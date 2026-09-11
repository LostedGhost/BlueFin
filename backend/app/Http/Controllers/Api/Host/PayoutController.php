<?php

namespace App\Http\Controllers\Api\Host;

use App\Http\Controllers\Controller;
use App\Models\Payout;
use App\Models\Booking;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use App\Models\PlatformSetting;
use App\Services\HostEarnings;

class PayoutController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get payout history
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $payouts = Payout::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);
        
        $payouts->getCollection()->transform(function($payout) {
            return [
                'id' => $payout->id,
                'reference' => $payout->payout_reference,
                'amount' => number_format($payout->amount, 0, ',', ' '),
                'method' => $payout->payout_method,
                'status' => $payout->status,
                'status_label' => $this->getStatusLabel($payout->status),
                'created_at' => $payout->created_at->format('d/m/Y'),
                'processed_at' => $payout->processed_at?->format('d/m/Y'),
            ];
        });
        
        return response()->json([
            'success' => true,
            'data' => $payouts,
        ]);
    }

    /**
     * Get available balance
     */
    public function getBalance(Request $request)
    {
        $user = $request->user();
        
        $balance = app(HostEarnings::class)->summary($user);

        // Get recent earnings (last 30 days)
        $recentEarnings = Booking::whereHas('property', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->where('booking_status', 'completed')
            ->where('check_out', '>=', now()->subDays(30))
            ->selectRaw('DATE(check_out) as date, SUM(total_amount) as amount')
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => [
                'total_earned' => number_format($balance['gross'], 0, ',', ' '),
                'service_fee' => number_format($balance['commission'], 0, ',', ' '),
                'net_earned' => number_format($balance['net'], 0, ',', ' '),
                'paid_out' => number_format($balance['paid'], 0, ',', ' '),
                'pending_payouts' => number_format($balance['open'], 0, ',', ' '),
                'available_balance' => number_format($balance['owed'], 0, ',', ' '),
                'commission_rate' => $balance['commission_rate'],
                'min_payout_amount' => PlatformSetting::current('min_payout_amount'),
                'recent_earnings' => $recentEarnings,
            ],
        ]);
    }

    /**
     * Request a payout
     */
    public function requestPayout(Request $request)
    {
        $user = $request->user();
        
        $validator = Validator::make($request->all(), [
            'amount' => 'required|integer|min:' . max(1, PlatformSetting::current('min_payout_amount')),
            'payout_method' => 'required|in:mobile_money,bank_transfer',
            'mobile_money_provider' => 'required_if:payout_method,mobile_money|in:MTN,Moov,Celtiis,Orange',
            'mobile_money_number' => 'required_if:payout_method,mobile_money|string',
            'bank_name' => 'required_if:payout_method,bank_transfer|string',
            'bank_account' => 'required_if:payout_method,bank_transfer|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Verrou sur la ligne de l'hôte : deux demandes simultanées ne doivent
        // pas pouvoir retirer deux fois le même solde.
        $payout = DB::transaction(function () use ($request, $user) {
            User::whereKey($user->id)->lockForUpdate()->first();

            $available = app(HostEarnings::class)->owed($user);
            if ($request->amount > $available) {
                return $available;
            }

            return Payout::create([
                'user_id' => $user->id,
                'payout_reference' => 'PYT-' . strtoupper(Str::random(12)),
                'amount' => (int) $request->amount,
                'payout_method' => $request->payout_method,
                'mobile_money_provider' => $request->mobile_money_provider,
                'mobile_money_number' => $request->mobile_money_number,
                'bank_name' => $request->bank_name,
                'bank_account' => $request->bank_account,
                'status' => 'pending',
                'payout_details' => ['origin' => 'host_request'],
            ]);
        });

        if (! $payout instanceof Payout) {
            return response()->json([
                'success' => false,
                'message' => 'Montant demandé supérieur au solde disponible',
                'available_balance' => number_format($payout, 0, ',', ' '),
            ], 422);
        }

        // Send notification
        $this->notificationService->sendWhatsApp(
            $user->phone,
            "💰 *Demande de retrait* 💰\n\n"
            . "Montant: " . number_format($request->amount, 0, ',', ' ') . " FCFA\n"
            . "Méthode: " . ($request->payout_method === 'mobile_money' ? 'Mobile Money' : 'Virement bancaire') . "\n"
            . "Référence: {$payout->payout_reference}\n\n"
            . "⏳ En traitement - Vous recevrez une confirmation sous 48h."
        );
        
        // Notify admin
        $this->notifyAdminPayoutRequest($user, $payout);
        
        return response()->json([
            'success' => true,
            'message' => 'Demande de retrait envoyée avec succès. Traitement sous 48h.',
            'data' => [
                'reference' => $payout->payout_reference,
                'amount' => number_format($payout->amount, 0, ',', ' '),
                'status' => $payout->status,
            ],
        ]);
    }

    private function getStatusLabel($status)
    {
        $labels = [
            'pending' => 'En attente',
            'processing' => 'En cours',
            'completed' => 'Effectué',
            'failed' => 'Échoué',
        ];
        return $labels[$status] ?? $status;
    }

    private function notifyAdminPayoutRequest($user, $payout)
    {
        $admins = User::where('user_type', 'admin')->get();
        
        foreach ($admins as $admin) {
            $this->notificationService->sendWhatsApp(
                $admin->phone,
                "💰 *NOUVELLE DEMANDE DE RETRAIT* 💰\n\n"
                . "Hôte: {$user->full_name}\n"
                . "📞 Téléphone: {$user->phone}\n"
                . "Montant: " . number_format($payout->amount, 0, ',', ' ') . " FCFA\n"
                . "Méthode: {$payout->payout_method}\n"
                . "Référence: {$payout->payout_reference}\n\n"
                . "🔗 Connectez-vous au panel admin pour traiter."
            );
        }
    }
}