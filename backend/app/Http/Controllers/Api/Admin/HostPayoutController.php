<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\HostPayoutAccount;
use App\Models\Payout;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Services\HostEarnings;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Versements aux hôtes, côté administration.
 *
 * Cycle d'un versement (table `payouts`) :
 *   pending ──(l'admin a envoyé l'argent, saisit la référence)──▶ completed
 *   pending ──(annulé, motif obligatoire)──────────────────────▶ failed
 *   completed ──(erreur de saisie, motif obligatoire)──────────▶ pending
 *
 * La plateforme n'envoie pas l'argent elle-même : l'admin effectue le
 * transfert Mobile Money / virement hors plateforme, puis le déclare ici avec
 * la référence de la transaction. Chaque étape est horodatée, attribuée à un
 * admin et journalisée.
 */
class HostPayoutController extends Controller
{
    public function __construct(
        private HostEarnings $earnings,
        private NotificationService $notifications,
    ) {}

    /** Chiffres clés de la page. */
    public function stats()
    {
        $hosts = User::where('user_type', 'hote')->get();
        $owedTotal = 0;
        $commissionTotal = 0;
        $hostsOwed = 0;

        foreach ($hosts as $host) {
            $summary = $this->earnings->summary($host);
            $owedTotal += $summary['owed'];
            $commissionTotal += $summary['commission'];
            $hostsOwed += $summary['owed'] > 0 ? 1 : 0;
        }

        $open = Payout::whereIn('status', Payout::OPEN_STATUSES);
        $overdueDays = PlatformSetting::current('payout_overdue_days');

        return response()->json([
            'success' => true,
            'data' => [
                'owed_total' => $owedTotal,
                'hosts_owed' => $hostsOwed,
                'open_total' => (int) (clone $open)->sum('amount'),
                'open_count' => (clone $open)->count(),
                'overdue_count' => (clone $open)->where('created_at', '<', now()->subDays($overdueDays))->count(),
                'paid_this_month' => (int) Payout::where('status', 'completed')
                    ->where('processed_at', '>=', now()->startOfMonth())->sum('amount'),
                'commission_total' => $commissionTotal,
                'hosts_count' => $hosts->count(),
                'hosts_without_account' => $hosts->count() - HostPayoutAccount::whereIn('user_id', $hosts->pluck('id'))->count(),
                'commission_rate' => PlatformSetting::current('commission_rate'),
                'min_payout_amount' => PlatformSetting::current('min_payout_amount'),
                'overdue_days' => $overdueDays,
            ],
        ]);
    }

    /** Liste des versements, en cours d'abord. */
    public function index(Request $request)
    {
        $payouts = $this->filteredPayouts($request)
            ->orderByRaw("CASE WHEN status IN ('pending','processing') THEN 0 ELSE 1 END")
            ->orderByDesc('created_at')
            ->paginate(min((int) $request->input('per_page', 50), 200));

        $overdueBefore = now()->subDays(PlatformSetting::current('payout_overdue_days'));
        $payouts->getCollection()->transform(fn (Payout $p) => $this->presentPayout($p, $overdueBefore));

        return response()->json(['success' => true, 'data' => $payouts]);
    }

    /** Hôtes, avec leur solde et leurs coordonnées de versement. */
    public function hosts(Request $request)
    {
        $query = User::where('user_type', 'hote')->with('payoutAccount');

        if ($search = trim((string) $request->input('search'))) {
            $query->where(fn ($q) => $q->where('first_name', 'like', "%{$search}%")
                ->orWhere('last_name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%"));
        }

        $hosts = $query->orderBy('first_name')->get()->map(function (User $host) {
            $summary = $this->earnings->summary($host);
            $last = Payout::where('user_id', $host->id)->where('status', 'completed')->latest('processed_at')->first();

            return [
                'id' => $host->id,
                'name' => $host->full_name,
                'email' => $host->email,
                'phone' => $host->phone,
                'host_type' => $host->host_type,
                'balance' => $summary,
                'account' => $host->payoutAccount ? $this->presentAccount($host->payoutAccount) : null,
                'last_paid_at' => $last?->processed_at?->toIso8601String(),
            ];
        });

        if ($request->boolean('owed_only')) {
            $hosts = $hosts->filter(fn ($h) => $h['balance']['owed'] > 0)->values();
        }

        return response()->json(['success' => true, 'data' => $hosts]);
    }

    public function showAccount($hostId)
    {
        $host = User::where('user_type', 'hote')->with('payoutAccount')->findOrFail($hostId);

        return response()->json([
            'success' => true,
            'data' => $host->payoutAccount ? $this->presentAccount($host->payoutAccount) : null,
        ]);
    }

    public function saveAccount(Request $request, $hostId)
    {
        $this->authorizeFinance($request);
        $host = User::where('user_type', 'hote')->findOrFail($hostId);

        $data = $request->validate([
            'payment_method' => 'required|in:mobile_money,bank_transfer',
            'full_name' => 'required|string|max:150',
            'phone_number' => 'required_if:payment_method,mobile_money|nullable|string|max:30',
            'mobile_provider' => 'required_if:payment_method,mobile_money|nullable|in:MTN,Moov,Celtiis',
            'bank_name' => 'required_if:payment_method,bank_transfer|nullable|string|max:100',
            'account_holder' => 'nullable|string|max:150',
            'iban' => 'required_if:payment_method,bank_transfer|nullable|string|max:40',
            'bic' => 'nullable|string|max:20',
        ], $this->frenchValidationMessages());

        // On ne garde que les champs du moyen choisi : pas de vieux numéro
        // Mobile Money qui traîne sur un compte passé au virement.
        $keep = $data['payment_method'] === 'mobile_money'
            ? ['phone_number', 'mobile_provider']
            : ['bank_name', 'account_holder', 'iban', 'bic'];
        foreach (['phone_number', 'mobile_provider', 'bank_name', 'account_holder', 'iban', 'bic'] as $field) {
            $data[$field] = in_array($field, $keep, true) ? ($data[$field] ?? null) : null;
        }

        $account = HostPayoutAccount::updateOrCreate(
            ['user_id' => $host->id],
            $data + ['updated_by' => $request->user()->id]
        );

        Log::info('Coordonnées de versement modifiées', [
            'admin_id' => $request->user()->id,
            'host_id' => $host->id,
            'method' => $account->payment_method,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Coordonnées de versement enregistrées.',
            'data' => $this->presentAccount($account),
        ]);
    }

    /**
     * Crée un versement « à effectuer » pour chaque hôte dont le solde dû
     * atteint le minimum et qui a des coordonnées de versement.
     * Idempotent : un solde déjà réservé par un versement en cours n'est plus
     * « dû », relancer la génération ne crée donc aucun doublon.
     */
    public function generate(Request $request)
    {
        $this->authorizeFinance($request);

        $minimum = PlatformSetting::current('min_payout_amount');
        $created = [];
        $skippedNoAccount = [];

        $hostIds = $request->filled('host_id')
            ? [(int) $request->input('host_id')]
            : User::where('user_type', 'hote')->pluck('id')->all();

        foreach ($hostIds as $hostId) {
            $result = DB::transaction(function () use ($hostId, $minimum, $request) {
                // Même verrou que la demande de retrait côté hôte.
                $host = User::whereKey($hostId)->where('user_type', 'hote')->lockForUpdate()->first();
                if (! $host) {
                    return null;
                }

                $owed = $this->earnings->owed($host);
                if ($owed <= 0 || $owed < $minimum) {
                    return null;
                }

                $account = HostPayoutAccount::where('user_id', $host->id)->first();
                if (! $account) {
                    return ['skipped' => $host->full_name];
                }

                return ['payout' => Payout::create([
                    'user_id' => $host->id,
                    'payout_reference' => 'PYT-' . strtoupper(Str::random(12)),
                    'amount' => $owed,
                    'payout_method' => $account->payment_method,
                    'mobile_money_provider' => $account->mobile_provider,
                    'mobile_money_number' => $account->phone_number,
                    'bank_name' => $account->bank_name,
                    'bank_account' => $account->iban,
                    'status' => 'pending',
                    'payout_details' => [
                        'origin' => 'admin_generated',
                        'beneficiary' => $account->full_name,
                        'generated_by' => ['id' => $request->user()->id, 'name' => $request->user()->full_name],
                    ],
                ])];
            });

            if (isset($result['payout'])) {
                $created[] = $result['payout'];
            } elseif (isset($result['skipped'])) {
                $skippedNoAccount[] = $result['skipped'];
            }
        }

        $total = array_sum(array_map(fn ($p) => $p->amount, $created));

        Log::info('Génération des versements hôtes', [
            'admin_id' => $request->user()->id,
            'created' => count($created),
            'total' => $total,
            'skipped_no_account' => count($skippedNoAccount),
        ]);

        $message = count($created)
            ? count($created) . ' versement(s) créé(s) pour ' . number_format($total, 0, ',', ' ') . ' FCFA.'
            : 'Aucun nouveau versement : aucun hôte n\'a de solde dû atteignant le minimum.';
        if ($skippedNoAccount) {
            $message .= ' ' . count($skippedNoAccount) . ' hôte(s) ignoré(s) faute de coordonnées de versement.';
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'created' => count($created),
                'total_amount' => $total,
                'skipped_no_account' => $skippedNoAccount,
            ],
        ]);
    }

    public function markPaid(Request $request, $payoutId)
    {
        $this->authorizeFinance($request);
        $data = $request->validate(['payment_reference' => 'required|string|min:3|max:100'], $this->frenchValidationMessages());

        $payout = DB::transaction(function () use ($payoutId, $data, $request) {
            $payout = Payout::whereKey($payoutId)->lockForUpdate()->firstOrFail();
            abort_unless(in_array($payout->status, Payout::OPEN_STATUSES, true), 422, 'Ce versement n\'est pas en attente.');

            $payout->update([
                'status' => 'completed',
                'processed_at' => now(),
                'payout_details' => array_merge($payout->payout_details ?? [], [
                    'payment_reference' => $data['payment_reference'],
                    'paid_by' => ['id' => $request->user()->id, 'name' => $request->user()->full_name],
                ]),
            ]);

            return $payout;
        });

        Log::info('Versement hôte effectué', [
            'admin_id' => $request->user()->id,
            'payout_id' => $payout->id,
            'amount' => $payout->amount,
        ]);

        $this->notifyHost($payout, "Votre versement de " . number_format($payout->amount, 0, ',', ' ')
            . " FCFA a été effectué (réf. {$data['payment_reference']}). Merci d'accueillir sur Bluefin-Immo.");

        return response()->json([
            'success' => true,
            'message' => 'Versement marqué comme effectué.',
            'data' => $this->presentPayout($payout->fresh('user')),
        ]);
    }

    /** Annule un versement en attente : le montant redevient dû. */
    public function cancel(Request $request, $payoutId)
    {
        $this->authorizeFinance($request);
        $data = $request->validate(['reason' => 'required|string|min:5|max:500'], $this->frenchValidationMessages());

        $payout = DB::transaction(function () use ($payoutId, $data, $request) {
            $payout = Payout::whereKey($payoutId)->lockForUpdate()->firstOrFail();
            abort_unless(in_array($payout->status, Payout::OPEN_STATUSES, true), 422, 'Seul un versement en attente peut être annulé.');

            $payout->update([
                'status' => 'failed',
                'failure_reason' => $data['reason'],
                'payout_details' => array_merge($payout->payout_details ?? [], [
                    'cancelled_by' => ['id' => $request->user()->id, 'name' => $request->user()->full_name],
                    'cancelled_at' => now()->toIso8601String(),
                ]),
            ]);

            return $payout;
        });

        Log::info('Versement hôte annulé', ['admin_id' => $request->user()->id, 'payout_id' => $payout->id]);

        return response()->json([
            'success' => true,
            'message' => 'Versement annulé : le montant redevient dû à l\'hôte.',
            'data' => $this->presentPayout($payout->fresh('user')),
        ]);
    }

    /** Remet en attente un versement déclaré effectué par erreur. */
    public function undo(Request $request, $payoutId)
    {
        $this->authorizeFinance($request);
        $data = $request->validate(['reason' => 'required|string|min:5|max:500'], $this->frenchValidationMessages());

        $payout = DB::transaction(function () use ($payoutId, $data, $request) {
            $payout = Payout::whereKey($payoutId)->lockForUpdate()->firstOrFail();
            abort_unless($payout->status === 'completed', 422, 'Seul un versement effectué peut être remis en attente.');

            $details = $payout->payout_details ?? [];
            $details['undo_history'][] = [
                'by' => ['id' => $request->user()->id, 'name' => $request->user()->full_name],
                'at' => now()->toIso8601String(),
                'reason' => $data['reason'],
                'previous_reference' => $details['payment_reference'] ?? null,
            ];
            unset($details['payment_reference'], $details['paid_by']);

            $payout->update(['status' => 'pending', 'processed_at' => null, 'payout_details' => $details]);

            return $payout;
        });

        Log::warning('Versement hôte remis en attente', [
            'admin_id' => $request->user()->id,
            'payout_id' => $payout->id,
            'reason' => $data['reason'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Versement remis en attente.',
            'data' => $this->presentPayout($payout->fresh('user')),
        ]);
    }

    /** Export CSV (séparateur « ; », lisible directement par Excel en français). */
    public function export(Request $request)
    {
        $payouts = $this->filteredPayouts($request)->orderByDesc('created_at')->get();
        $filename = 'versements-hotes-' . now()->format('Y-m-d') . '.csv';

        return new StreamedResponse(function () use ($payouts) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, ['Référence', 'Hôte', 'Téléphone', 'Moyen', 'Destination', 'Montant (FCFA)',
                'Statut', 'Créé le', 'Payé le', 'Réf. transaction', 'Payé par', 'Motif d\'annulation'], ';');

            foreach ($payouts as $p) {
                $row = $this->presentPayout($p);
                fputcsv($out, [
                    $p->payout_reference,
                    $row['host']['name'] ?? '',
                    $row['host']['phone'] ?? '',
                    $p->payout_method === 'mobile_money' ? 'Mobile Money' : 'Virement',
                    $row['destination'],
                    $p->amount,
                    $row['status_label'],
                    $p->created_at?->format('d/m/Y H:i'),
                    $p->processed_at?->format('d/m/Y H:i'),
                    $row['payment_reference'] ?? '',
                    $row['paid_by'] ?? '',
                    $p->failure_reason ?? '',
                ], ';');
            }
            fclose($out);
        }, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control' => 'no-store',
        ]);
    }

    private function filteredPayouts(Request $request)
    {
        $query = Payout::with('user');

        match ($request->input('status')) {
            'open' => $query->whereIn('status', Payout::OPEN_STATUSES),
            'completed' => $query->where('status', 'completed'),
            'failed' => $query->where('status', 'failed'),
            default => null,
        };

        if ($request->filled('host_id')) {
            $query->where('user_id', $request->input('host_id'));
        }
        if ($search = trim((string) $request->input('search'))) {
            $query->where(fn ($q) => $q->where('payout_reference', 'like', "%{$search}%")
                ->orWhereHas('user', fn ($u) => $u->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")));
        }
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->input('start_date'));
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->input('end_date'));
        }

        return $query;
    }

    private function presentPayout(Payout $p, $overdueBefore = null): array
    {
        $details = $p->payout_details ?? [];
        $overdueBefore ??= now()->subDays(PlatformSetting::current('payout_overdue_days'));

        return [
            'id' => $p->id,
            'reference' => $p->payout_reference,
            'amount' => (int) $p->amount,
            'method' => $p->payout_method,
            'destination' => $p->payout_method === 'mobile_money'
                ? trim(($p->mobile_money_provider ?? '') . ' · ' . ($p->mobile_money_number ?? ''), ' ·')
                : trim(($p->bank_name ?? '') . ' · ' . ($p->bank_account ?? ''), ' ·'),
            'beneficiary' => $details['beneficiary'] ?? $p->user?->full_name,
            'status' => $p->status,
            'status_label' => [
                'pending' => 'À verser', 'processing' => 'En cours', 'completed' => 'Versé', 'failed' => 'Annulé',
            ][$p->status] ?? $p->status,
            'is_overdue' => in_array($p->status, Payout::OPEN_STATUSES, true) && $p->created_at < $overdueBefore,
            'origin' => $details['origin'] ?? 'host_request',
            'payment_reference' => $details['payment_reference'] ?? null,
            'paid_by' => $details['paid_by']['name'] ?? null,
            'failure_reason' => $p->failure_reason,
            'undo_count' => count($details['undo_history'] ?? []),
            'created_at' => $p->created_at?->toIso8601String(),
            'processed_at' => $p->processed_at?->toIso8601String(),
            'host' => $p->user ? [
                'id' => $p->user->id,
                'name' => $p->user->full_name,
                'email' => $p->user->email,
                'phone' => $p->user->phone,
            ] : null,
        ];
    }

    private function presentAccount(HostPayoutAccount $a): array
    {
        return [
            'payment_method' => $a->payment_method,
            'full_name' => $a->full_name,
            'phone_number' => $a->phone_number,
            'mobile_provider' => $a->mobile_provider,
            'bank_name' => $a->bank_name,
            'account_holder' => $a->account_holder,
            'iban' => $a->iban,
            'bic' => $a->bic,
            'destination' => $a->destination(),
            'updated_at' => $a->updated_at?->toIso8601String(),
        ];
    }

    /** Toute opération qui touche à l'argent exige le droit « finance ». */
    private function authorizeFinance(Request $request): void
    {
        abort_unless($request->user()?->canViewFinanceData(), 403, 'Action réservée aux administrateurs habilités aux finances.');
    }

    /** Une notification ratée ne doit jamais annuler un versement enregistré. */
    private function notifyHost(Payout $payout, string $message): void
    {
        try {
            if ($payout->user) {
                $this->notifications->sendNotification($payout->user, 'Versement effectué', $message, ['whatsapp', 'email']);
            }
        } catch (\Throwable $e) {
            Log::warning('Notification de versement non envoyée', ['payout_id' => $payout->id, 'error' => $e->getMessage()]);
        }
    }
}
