<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Experience;
use App\Models\Need;
use App\Models\NeedResponse;
use App\Models\Property;
use App\Models\Service;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * « Besoins » : le voyageur publie ce qu'il cherche, les hôtes de la ville
 * répondent, l'administration voit tout (choix du client).
 *
 * Confidentialité : un hôte ne voit du voyageur que son prénom et l'initiale
 * de son nom — jamais son e-mail ni son téléphone.
 */
class NeedController extends Controller
{
    public function __construct(private NotificationService $notifications) {}

    // ==================== VOYAGEUR ====================

    public function mine(Request $request)
    {
        $needs = Need::where('user_id', $request->user()->id)
            ->with(['responses.host', 'responses.property.coverPhoto'])
            ->latest()
            ->get()
            ->map(fn (Need $n) => $this->presentForOwner($n));

        return response()->json(['success' => true, 'data' => $needs]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if ($user->user_type === 'admin') {
            abort(403, 'Un compte administrateur ne publie pas de besoin.');
        }

        $data = $request->validate([
            'type' => 'required|in:logement,experience,service',
            'city' => 'required|string|max:100',
            'district' => 'nullable|string|max:100',
            'start_date' => 'nullable|date|after_or_equal:today',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'guests' => 'required|integer|min:1|max:50',
            'budget_max' => 'nullable|integer|min:0|max:100000000',
            'details' => 'nullable|string|max:1000',
        ], $this->frenchValidationMessages() + [
            'start_date.after_or_equal' => 'La date de début ne peut pas être passée.',
            'end_date.after_or_equal' => 'La date de fin doit suivre la date de début.',
        ]);

        $open = Need::where('user_id', $user->id)->where('status', 'open')->count();
        if ($open >= Need::MAX_OPEN_PER_USER) {
            return response()->json([
                'success' => false,
                'message' => 'Vous avez déjà ' . Need::MAX_OPEN_PER_USER . ' besoins ouverts. Clôturez-en un pour en publier un nouveau.',
            ], 422);
        }

        // Majuscules normalisées : « cotonou » → « Cotonou », « porto-novo » → « Porto-Novo ».
        $data['city'] = (string) \Illuminate\Support\Str::of($data['city'])->squish()->title();
        if (! empty($data['district'])) {
            $data['district'] = (string) \Illuminate\Support\Str::of($data['district'])->squish()->title();
        }

        $need = Need::create($data + ['user_id' => $user->id, 'status' => 'open']);

        return response()->json([
            'success' => true,
            'message' => 'Votre besoin est publié : les hôtes de ' . $need->city . ' peuvent maintenant vous répondre.',
            'data' => $this->presentForOwner($need->load('responses')),
        ], 201);
    }

    public function close(Request $request, $id)
    {
        $need = Need::where('user_id', $request->user()->id)->findOrFail($id);
        $need->update(['status' => 'closed', 'closed_reason' => 'Clôturé par le voyageur']);

        return response()->json(['success' => true, 'message' => 'Besoin clôturé.', 'data' => $this->presentForOwner($need->load('responses'))]);
    }

    // ==================== HÔTE ====================

    /** Besoins ouverts de la ville (et du type d'offre) de l'hôte. */
    public function forHost(Request $request)
    {
        $host = $request->user();
        $areas = $this->hostAreas($host);

        $needs = Need::where('status', 'open')
            ->where('user_id', '!=', $host->id)
            ->with(['user', 'responses' => fn ($q) => $q->where('host_id', $host->id)])
            ->latest()
            ->get()
            ->filter(fn (Need $n) => ! $n->isExpired() && in_array(Need::cityKey($n->city), $areas[$n->type] ?? [], true))
            ->values()
            ->map(fn (Need $n) => $this->presentForHost($n, $host));

        return response()->json([
            'success' => true,
            'data' => $needs,
            'areas' => collect($areas)->map(fn ($keys) => count($keys))->all(),
        ]);
    }

    public function respond(Request $request, $id)
    {
        $host = $request->user();
        $data = $request->validate([
            'message' => 'required|string|min:10|max:2000',
            'property_id' => 'nullable|integer',
        ], $this->frenchValidationMessages() + [
            'message.min' => 'Votre réponse doit contenir au moins :min caractères.',
        ]);

        $need = Need::with('user')->findOrFail($id);
        abort_unless($need->isOpen(), 422, 'Ce besoin n’attend plus de réponse.');
        abort_if($need->user_id === $host->id, 422, 'Vous ne pouvez pas répondre à votre propre besoin.');
        $areas = $this->hostAreas($host);
        abort_unless(in_array(Need::cityKey($need->city), $areas[$need->type] ?? [], true), 403, 'Ce besoin ne concerne pas votre ville.');

        if (! empty($data['property_id'])) {
            abort_unless(Property::where('id', $data['property_id'])->where('user_id', $host->id)->exists(), 422, 'Cette annonce ne vous appartient pas.');
        }

        $response = DB::transaction(function () use ($need, $host, $data) {
            $response = NeedResponse::updateOrCreate(
                ['need_id' => $need->id, 'host_id' => $host->id],
                ['message' => $data['message'], 'property_id' => $data['property_id'] ?? null]
            );
            $need->forceFill(['responses_count' => $need->responses()->count()])->save();

            return $response;
        });

        $this->notifyTraveler($need, $host);

        return response()->json([
            'success' => true,
            'message' => 'Réponse envoyée au voyageur.',
            'data' => $this->presentForHost($need->load(['user', 'responses' => fn ($q) => $q->where('host_id', $host->id)]), $host),
        ]);
    }

    // ==================== ADMIN ====================

    public function adminIndex(Request $request)
    {
        $query = Need::with(['user', 'responses.host', 'responses.property'])->latest();
        if (in_array($request->input('status'), ['open', 'closed'], true)) {
            $query->where('status', $request->input('status'));
        }

        $needs = $query->limit(300)->get()->map(fn (Need $n) => $this->presentForOwner($n) + [
            'traveler' => ['id' => $n->user?->id, 'name' => $n->user?->full_name, 'email' => $n->user?->email, 'phone' => $n->user?->phone],
        ]);

        return response()->json(['success' => true, 'data' => $needs]);
    }

    public function adminClose(Request $request, $id)
    {
        $need = Need::findOrFail($id);
        $reason = $request->validate(['reason' => 'nullable|string|max:255'], $this->frenchValidationMessages())['reason'] ?? null;
        $need->update(['status' => 'closed', 'closed_reason' => $reason ?: 'Clôturé par l’administration']);

        return response()->json(['success' => true, 'message' => 'Besoin clôturé.']);
    }

    // ==================== OUTILS ====================

    /**
     * Villes de l'hôte, par type d'offre : villes de ses logements, lieux de
     * ses expériences et services. Clés normalisées (Need::cityKey).
     */
    private function hostAreas(User $host): array
    {
        $areas = ['logement' => [], 'experience' => [], 'service' => []];
        if ($host->user_type !== 'hote') {
            return $areas;
        }

        $areas['logement'] = Property::where('user_id', $host->id)->pluck('city')->map(fn ($c) => Need::cityKey($c))->unique()->values()->all();
        if (Schema::hasTable('experiences') && Schema::hasColumn('experiences', 'location')) {
            $areas['experience'] = Experience::where('host_id', $host->id)->pluck('location')->map(fn ($c) => Need::cityKey($c))->unique()->values()->all();
        }
        if (Schema::hasTable('services') && Schema::hasColumn('services', 'location')) {
            $areas['service'] = Service::where('host_id', $host->id)->pluck('location')->map(fn ($c) => Need::cityKey($c))->unique()->values()->all();
        }

        return $areas;
    }

    private function presentBase(Need $n): array
    {
        return [
            'id' => $n->id,
            'type' => $n->type,
            'city' => $n->city,
            'district' => $n->district,
            'start_date' => $n->start_date?->toDateString(),
            'end_date' => $n->end_date?->toDateString(),
            'guests' => $n->guests,
            'budget_max' => $n->budget_max,
            'details' => $n->details,
            'status' => $n->isExpired() && $n->status === 'open' ? 'expired' : $n->status,
            'closed_reason' => $n->closed_reason,
            'responses_count' => $n->responses_count,
            'created_at' => $n->created_at?->toIso8601String(),
        ];
    }

    private function presentForOwner(Need $n): array
    {
        return $this->presentBase($n) + [
            'responses' => $n->relationLoaded('responses') ? $n->responses->map(fn (NeedResponse $r) => [
                'id' => $r->id,
                'message' => $r->message,
                'created_at' => $r->updated_at?->toIso8601String(),
                'host' => $r->host ? ['id' => $r->host->id, 'name' => $r->host->first_name . ' ' . mb_substr((string) $r->host->last_name, 0, 1) . '.'] : null,
                'property' => $r->property ? [
                    'id' => $r->property->id,
                    'title' => $r->property->title,
                    'city' => $r->property->city,
                    'price_per_night' => (int) $r->property->price_per_night,
                    'photo' => $r->property->coverPhoto?->full_url,
                ] : null,
            ])->values() : [],
        ];
    }

    private function presentForHost(Need $n, User $host): array
    {
        $mine = $n->relationLoaded('responses') ? $n->responses->firstWhere('host_id', $host->id) : null;

        return $this->presentBase($n) + [
            // Prénom + initiale seulement : pas de coordonnées du voyageur.
            'traveler_name' => $n->user ? $n->user->first_name . ' ' . mb_substr((string) $n->user->last_name, 0, 1) . '.' : 'Voyageur',
            'my_response' => $mine ? ['message' => $mine->message, 'property_id' => $mine->property_id, 'updated_at' => $mine->updated_at?->toIso8601String()] : null,
        ];
    }

    private function notifyTraveler(Need $need, User $host): void
    {
        try {
            if ($need->user) {
                $this->notifications->sendNotification(
                    $need->user,
                    'Nouvelle réponse à votre besoin',
                    "{$host->first_name} a répondu à votre besoin à {$need->city} sur Bluefin-Immo. Consultez-la dans l'onglet Besoins.",
                    ['whatsapp', 'email']
                );
            }
        } catch (\Throwable $e) {
            Log::warning('Notification de réponse à un besoin non envoyée', ['need_id' => $need->id, 'error' => $e->getMessage()]);
        }
    }
}
