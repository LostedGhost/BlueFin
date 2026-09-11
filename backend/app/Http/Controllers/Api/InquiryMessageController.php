<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Property;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Conversations AVANT réservation (« Discutez avec l'hôte ») : fil entre un
 * voyageur et un hôte, hors réservation, expérience ou service.
 *
 * Le frontend appelait déjà ces routes (voyageur : /traveler/messages/
 * inquiries, /inquiry/{hôte} ; hôte : /host/messages/inquiry/{voyageur}),
 * mais elles n'existaient pas : le premier message partait, puis plus rien —
 * l'hôte ne le voyait jamais et personne ne pouvait répondre.
 *
 * Règles : un voyageur écrit à un hôte ; un hôte ne répond qu'à un voyageur
 * qui lui a déjà écrit (pas de démarchage). Aucune coordonnée n'est glissée
 * dans les messages : l'échange passe par la plateforme.
 */
class InquiryMessageController extends Controller
{
    public function __construct(private NotificationService $notifications) {}

    // ==================== VOYAGEUR ====================

    public function travelerThreads(Request $request)
    {
        $me = $request->user();
        $threads = $this->threads($me)->map(fn (array $t) => [
            'type' => 'inquiry',
            'booking' => [
                'id' => null,
                'reference' => '',
                'property' => $t['property'] ?? ['id' => null, 'title' => 'Demande d’information', 'photo' => null],
                'host' => $this->person($t['other']),
                'dates' => null,
            ],
            'last_message' => $this->lastMessage($t['last'], $me),
            'unread_count' => $t['unread'],
            'updated_at' => $t['last']->created_at?->toIso8601String(),
        ])->values();

        return response()->json(['success' => true, 'data' => $threads]);
    }

    public function travelerThread(Request $request, $hostId)
    {
        $me = $request->user();
        $host = User::where('user_type', 'hote')->findOrFail($hostId);

        return response()->json(['success' => true, 'data' => [
            'host' => $this->person($host),
        ] + $this->threadPayload($me, $host)]);
    }

    public function travelerReply(Request $request, $hostId)
    {
        $data = $request->validate([
            'message' => 'required|string|min:1|max:5000',
            'property_id' => 'nullable|integer|exists:properties,id',
        ], $this->frenchValidationMessages());

        $me = $request->user();
        $host = User::where('user_type', 'hote')->findOrFail($hostId);
        abort_if($host->id === $me->id, 422, 'Vous ne pouvez pas vous écrire à vous-même.');

        if (! empty($data['property_id'])) {
            abort_unless(Property::where('id', $data['property_id'])->where('user_id', $host->id)->exists(), 422, 'Ce logement n’appartient pas à cet hôte.');
        }

        return $this->send($me, $host, $data['message'], $data['property_id'] ?? null);
    }

    // ==================== HÔTE ====================

    /** Fils avant réservation, au format des conversations de la page hôte. */
    public function hostThreads(User $me): Collection
    {
        return $this->threads($me)->map(fn (array $t) => [
            'type' => 'inquiry',
            'booking' => [
                'id' => null,
                'reference' => '',
                'status' => 'inquiry',
                'property' => $t['property'] ?? ['id' => null, 'title' => 'Demande d’information', 'photo' => null],
                'guest' => $this->person($t['other']),
                'dates' => null,
                'check_in' => null,
                'check_out' => null,
            ],
            'last_message' => $this->lastMessage($t['last'], $me) + ['is_from_guest' => $t['last']->sender_id !== $me->id],
            'unread_count' => $t['unread'],
            'sort_at' => $t['last']->created_at?->timestamp ?? 0,
        ])->values();
    }

    public function hostThread(Request $request, $guestId)
    {
        $me = $request->user();
        $guest = User::findOrFail($guestId);
        // Lecture : tout fil existant, y compris celui ouvert par la réponse de
        // l'hôte à un « Besoin ». L'envoi, lui, reste réservé aux fils où le
        // voyageur a déjà écrit (hostReply).
        abort_unless($this->between($me, $guest)->exists(), 404, 'Aucune conversation avec ce voyageur.');

        return response()->json(['success' => true, 'data' => [
            'guest' => $this->person($guest),
        ] + $this->threadPayload($me, $guest)]);
    }

    public function hostReply(Request $request, $guestId)
    {
        $data = $request->validate(['message' => 'required|string|min:1|max:5000'], $this->frenchValidationMessages());
        $me = $request->user();
        $guest = User::findOrFail($guestId);
        // Pas de démarchage : l'hôte répond seulement à qui lui a écrit (fil
        // ouvert depuis une annonce, ou réponse du voyageur à son offre sur un
        // « Besoin »).
        abort_unless($this->hasThread($me, $guest), 403, 'Le voyageur doit d’abord vous répondre avant un nouveau message.');

        return $this->send($me, $guest, $data['message'], null);
    }

    /** Marque le fil comme lu (voyageur ou hôte). */
    public function markRead(Request $request, $otherId)
    {
        $me = $request->user();
        $this->inquiryQuery()
            ->where('sender_id', $otherId)
            ->where('receiver_id', $me->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['success' => true]);
    }

    // ==================== OUTILS ====================

    /** Messages « avant réservation » : ni réservation, ni expérience, ni service. */
    private function inquiryQuery()
    {
        $query = Message::query()->whereNull('booking_id');
        foreach (['experience_id', 'service_id'] as $column) {
            if (Schema::hasColumn('messages', $column)) {
                $query->whereNull($column);
            }
        }

        return $query;
    }

    private function between(User $a, User $b)
    {
        return $this->inquiryQuery()->where(fn ($q) => $q
            ->where(fn ($x) => $x->where('sender_id', $a->id)->where('receiver_id', $b->id))
            ->orWhere(fn ($x) => $x->where('sender_id', $b->id)->where('receiver_id', $a->id)));
    }

    private function hasThread(User $host, User $guest): bool
    {
        return $this->inquiryQuery()->where('sender_id', $guest->id)->where('receiver_id', $host->id)->exists();
    }

    /** @return Collection<int, array{other: User, last: Message, unread: int, property: ?array}> */
    private function threads(User $me): Collection
    {
        $hasProperty = Schema::hasColumn('messages', 'property_id');
        $messages = $this->inquiryQuery()
            ->where(fn ($q) => $q->where('sender_id', $me->id)->orWhere('receiver_id', $me->id))
            ->orderByDesc('created_at')
            ->limit(1000)
            ->get();

        $byOther = $messages->groupBy(fn (Message $m) => $m->sender_id === $me->id ? $m->receiver_id : $m->sender_id);
        $others = User::whereIn('id', $byOther->keys())->get()->keyBy('id');
        $propertyIds = $hasProperty ? $messages->pluck('property_id')->filter()->unique() : collect();
        $properties = Property::with('coverPhoto')->whereIn('id', $propertyIds)->get()->keyBy('id');

        return $byOther->map(function (Collection $thread, $otherId) use ($me, $others, $properties, $hasProperty) {
            $other = $others->get($otherId);
            if (! $other) {
                return null;
            }
            $propertyId = $hasProperty ? $thread->firstWhere('property_id', '!=', null)?->property_id : null;
            $property = $propertyId ? $properties->get($propertyId) : null;

            return [
                'other' => $other,
                'last' => $thread->first(),
                'unread' => $thread->where('receiver_id', $me->id)->where('is_read', false)->count(),
                'property' => $property ? [
                    'id' => $property->id,
                    'title' => $property->title,
                    'city' => $property->city,
                    'photo' => $property->coverPhoto?->full_url,
                ] : null,
            ];
        })->filter()->sortByDesc(fn ($t) => $t['last']->created_at)->values();
    }

    private function threadPayload(User $me, User $other): array
    {
        // Ouvrir le fil = lire les messages reçus.
        $this->between($me, $other)->where('receiver_id', $me->id)->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        $messages = $this->between($me, $other)->with('sender')->orderBy('created_at')->get();
        $propertyId = Schema::hasColumn('messages', 'property_id') ? $messages->whereNotNull('property_id')->last()?->property_id : null;
        $property = $propertyId ? Property::with('coverPhoto')->find($propertyId) : null;

        return [
            'property' => $property ? ['id' => $property->id, 'title' => $property->title, 'city' => $property->city, 'photo' => $property->coverPhoto?->full_url] : null,
            'messages' => $messages->map(fn (Message $m) => $this->presentMessage($m, $me))->values(),
        ];
    }

    private function send(User $from, User $to, string $text, ?int $propertyId)
    {
        $attributes = [
            'sender_id' => $from->id,
            'receiver_id' => $to->id,
            'booking_id' => null,
            'message' => trim($text),
            'message_type' => 'text',
            'is_read' => false,
        ];
        if (Schema::hasColumn('messages', 'property_id')) {
            // On garde le logement du fil si le message n'en précise pas.
            $attributes['property_id'] = $propertyId
                ?? $this->between($from, $to)->whereNotNull('property_id')->latest()->value('property_id');
        }
        if (Schema::hasColumn('messages', 'conversation_type')) {
            $attributes['conversation_type'] = 'inquiry';
        }

        $message = new Message();
        $message->forceFill($attributes)->save();
        $message->load('sender');

        try {
            $this->notifications->sendNotification(
                $to,
                'Nouveau message sur Bluefin-Immo',
                "{$from->first_name} vous a écrit sur Bluefin-Immo. Répondez depuis vos messages.",
                ['whatsapp', 'push']
            );
        } catch (\Throwable $e) {
            Log::warning('Notification de message non envoyée', ['message_id' => $message->id, 'error' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Message envoyé',
            'data' => $this->presentMessage($message, $from),
        ], 201);
    }

    private function presentMessage(Message $m, User $me): array
    {
        return [
            'id' => $m->id,
            'message' => $m->message,
            'type' => $m->message_type,
            'attachment_url' => $m->attachment_url,
            'is_from_me' => $m->sender_id === $me->id,
            'sender_id' => $m->sender_id,
            'receiver_id' => $m->receiver_id,
            'sender_name' => $m->sender?->full_name,
            'created_at' => $m->created_at?->format('H:i d/m/Y'),
            'is_read' => (bool) $m->is_read,
        ];
    }

    private function lastMessage(Message $m, User $me): array
    {
        return [
            'message' => $m->message,
            'preview' => mb_strimwidth((string) $m->message, 0, 80, '…'),
            'sent_at' => $m->created_at?->locale('fr')->diffForHumans(),
            'is_from_me' => $m->sender_id === $me->id,
        ];
    }

    private function person(User $u): array
    {
        return ['id' => $u->id, 'name' => $u->full_name, 'photo' => $u->profile_photo_url];
    }
}
