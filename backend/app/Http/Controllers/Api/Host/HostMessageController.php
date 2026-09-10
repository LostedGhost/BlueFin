<?php

namespace App\Http\Controllers\Api\Host;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Booking;
use App\Models\Property;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class HostMessageController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get all conversations for the host
     */
    public function getConversations(Request $request)
    {
        $user = $request->user();
        
        // Get all properties owned by host
        $propertyIds = Property::where('user_id', $user->id)->pluck('id');
        
        // Get all bookings for these properties
        $bookings = Booking::with(['user', 'property'])
            ->whereIn('property_id', $propertyIds)
            ->where('booking_status', '!=', 'cancelled')
            ->orderBy('created_at', 'desc')
            ->get();
        
        $conversations = [];
        
        foreach ($bookings as $booking) {
            // Get last message for this booking
            $lastMessage = Message::where('booking_id', $booking->id)
                ->orderBy('created_at', 'desc')
                ->first();
            
            // Get unread count for host
            $unreadCount = Message::where('booking_id', $booking->id)
                ->where('receiver_id', $user->id)
                ->where('is_read', false)
                ->count();
            
            $conversations[] = [
                'booking' => [
                    'id' => $booking->id,
                    'reference' => $booking->booking_reference,
                    'status' => $booking->booking_status,
                    'property' => [
                        'id' => $booking->property->id,
                        'title' => $booking->property->title,
                        'city' => $booking->property->city,
                        'district' => $booking->property->district,
                        'photo' => $booking->property->coverPhoto?->photo_url,
                    ],
                    'guest' => [
                        'id' => $booking->user->id,
                        'name' => $booking->user->full_name,
                        'photo' => $booking->user->profile_photo_url,
                        'phone' => $booking->user->phone,
                    ],
                    'dates' => [
                        'check_in' => $booking->check_in->format('d/m/Y'),
                        'check_out' => $booking->check_out->format('d/m/Y'),
                    ],
                ],
                'last_message' => $lastMessage ? [
                    'message' => $lastMessage->message,
                    'preview' => $lastMessage->preview,
                    'sent_at' => $lastMessage->created_at->diffForHumans(),
                    'is_from_guest' => $lastMessage->sender_id !== $user->id,
                ] : null,
                'unread_count' => $unreadCount,
            ];
        }
        
        // Sort by last message time (most recent first)
        usort($conversations, function($a, $b) {
            $timeA = $a['last_message']['sent_at'] ?? '';
            $timeB = $b['last_message']['sent_at'] ?? '';
            return strcmp($timeB, $timeA);
        });
        
        return response()->json([
            'success' => true,
            'data' => $conversations,
            'total' => count($conversations),
        ]);
    }

    /**
     * Get messages for a specific booking
     */
    public function getMessages(Request $request, $bookingId)
    {
        $user = $request->user();
        
        // Verify host owns the property for this booking
        $booking = Booking::with(['property', 'user'])
            ->whereHas('property', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->findOrFail($bookingId);
        
        // Mark all unread messages as read
        Message::where('booking_id', $bookingId)
            ->where('receiver_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);
        
        // Get all messages for this booking
        $messages = Message::where('booking_id', $bookingId)
            ->with(['sender', 'receiver'])
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function($message) use ($user) {
                return [
                    'id' => $message->id,
                    'message' => $message->message,
                    'type' => $message->message_type,
                    'attachment_url' => $message->attachment_url,
                    'is_from_me' => $message->sender_id === $user->id,
                    'sender_name' => $message->sender->full_name,
                    'created_at' => $message->created_at->format('H:i d/m/Y'),
                    'is_read' => $message->is_read,
                ];
            });
        
        return response()->json([
            'success' => true,
            'data' => [
                'booking' => [
                    'id' => $booking->id,
                    'reference' => $booking->booking_reference,
                    'status' => $booking->booking_status,
                    'property' => [
                        'id' => $booking->property->id,
                        'title' => $booking->property->title,
                        'address' => $booking->property->address,
                        'city' => $booking->property->city,
                        'district' => $booking->property->district,
                    ],
                    'guest' => [
                        'id' => $booking->user->id,
                        'name' => $booking->user->full_name,
                        'photo' => $booking->user->profile_photo_url,
                        'phone' => $booking->user->phone,
                        'email' => $booking->user->email,
                    ],
                    'dates' => [
                        'check_in' => $booking->check_in->format('d/m/Y'),
                        'check_out' => $booking->check_out->format('d/m/Y'),
                        'nights' => $booking->nights_count,
                    ],
                    'guests_count' => $booking->guests_count,
                    'total_amount' => number_format($booking->total_amount, 0, ',', ' '),
                ],
                'messages' => $messages,
            ],
        ]);
    }

    /**
     * Send a message to the guest
     */
    public function sendMessage(Request $request, $bookingId)
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string|min:1|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        
        // Verify host owns the property
        $booking = Booking::with(['property', 'user'])
            ->whereHas('property', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->findOrFail($bookingId);
        
        // Create message
        $message = Message::create([
            'sender_id' => $user->id,
            'receiver_id' => $booking->user_id,
            'booking_id' => $bookingId,
            'message' => $request->message,
            'message_type' => 'text',
            'is_read' => false,
        ]);
        
        $message->load('sender', 'receiver');
        
        // Send real-time notification via WebSocket
        broadcast(new \App\Events\NewMessageSent($message))->toOthers();
        
        // Send WhatsApp notification to guest
        $this->notificationService->sendWhatsApp(
            $booking->user->phone,
            "💬 *Nouveau message de l'hôte*\n\n"
            . "🏠 Propriété: {$booking->property->title}\n"
            . "📅 Réservation: #{$booking->booking_reference}\n"
            . "📆 Dates: {$booking->check_in->format('d/m/Y')} → {$booking->check_out->format('d/m/Y')}\n\n"
            . "📝 Message:\n{$request->message}\n\n"
            . "📱 Répondez directement dans l'application Bluefin"
        );
        
        // Send push notification
        $this->notificationService->sendPushNotification(
            $booking->user->devices()->where('is_active', true)->pluck('device_token')->toArray(),
            "Nouveau message de l'hôte",
            $request->message,
            ['booking_id' => $bookingId, 'type' => 'host_message']
        );
        
        // Send email notification
        $this->notificationService->sendEmail(
            $booking->user->email,
            "Nouveau message concernant votre réservation #{$booking->booking_reference}",
            'emails.message_notification',
            [
                'guest' => $booking->user,
                'host' => $user,
                'property' => $booking->property,
                'message' => $request->message,
            ]
        );
        
        return response()->json([
            'success' => true,
            'message' => 'Message envoyé avec succès',
            'data' => [
                'id' => $message->id,
                'message' => $message->message,
                'created_at' => $message->created_at->format('H:i d/m/Y'),
                'is_from_me' => true,
            ],
        ], 201);
    }

    /**
     * Get conversations for a specific property
     */
    public function getPropertyConversations(Request $request, $propertyId)
    {
        $user = $request->user();
        
        // Verify host owns the property
        $property = Property::where('user_id', $user->id)->findOrFail($propertyId);
        
        // Get all bookings for this property
        $bookings = Booking::with(['user'])
            ->where('property_id', $propertyId)
            ->where('booking_status', '!=', 'cancelled')
            ->orderBy('created_at', 'desc')
            ->get();
        
        $conversations = [];
        
        foreach ($bookings as $booking) {
            $lastMessage = Message::where('booking_id', $booking->id)
                ->orderBy('created_at', 'desc')
                ->first();
            
            $unreadCount = Message::where('booking_id', $booking->id)
                ->where('receiver_id', $user->id)
                ->where('is_read', false)
                ->count();
            
            $conversations[] = [
                'booking' => [
                    'id' => $booking->id,
                    'reference' => $booking->booking_reference,
                    'guest' => [
                        'id' => $booking->user->id,
                        'name' => $booking->user->full_name,
                        'photo' => $booking->user->profile_photo_url,
                    ],
                    'dates' => [
                        'check_in' => $booking->check_in->format('d/m/Y'),
                        'check_out' => $booking->check_out->format('d/m/Y'),
                    ],
                ],
                'last_message' => $lastMessage ? [
                    'message' => $lastMessage->message,
                    'preview' => $lastMessage->preview,
                    'sent_at' => $lastMessage->created_at->diffForHumans(),
                ] : null,
                'unread_count' => $unreadCount,
            ];
        }
        
        return response()->json([
            'success' => true,
            'data' => [
                'property' => [
                    'id' => $property->id,
                    'title' => $property->title,
                ],
                'conversations' => $conversations,
            ],
        ]);
    }

    /**
     * Send a message without booking (general inquiry)
     */
    public function sendGeneralMessage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'receiver_id' => 'required|exists:users,id',
            'message' => 'required|string|min:1|max:5000',
            'property_id' => 'required|exists:properties,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        $property = Property::findOrFail($request->property_id);
        
        // Create message without booking
        $message = Message::create([
            'sender_id' => $user->id,
            'receiver_id' => $request->receiver_id,
            'booking_id' => null,
            'message' => $request->message,
            'message_type' => 'text',
            'is_read' => false,
        ]);
        
        // Send notification
        $this->notificationService->sendWhatsApp(
            $property->user->phone,
            "💬 *Nouveau message d'un voyageur*\n\n"
            . "🏠 Propriété: {$property->title}\n"
            . "👤 De: {$user->full_name}\n"
            . "📞 Téléphone: {$user->phone}\n\n"
            . "📝 Message:\n{$request->message}\n\n"
            . "📱 Répondez dans l'application Bluefin"
        );
        
        return response()->json([
            'success' => true,
            'message' => 'Message envoyé',
            'data' => $message,
        ], 201);
    }

    /**
     * Mark a specific message as read
     */
    public function markAsRead(Request $request, $messageId)
    {
        $user = $request->user();
        
        $message = Message::where('receiver_id', $user->id)
            ->findOrFail($messageId);
        
        $message->markAsRead();
        
        return response()->json([
            'success' => true,
            'message' => 'Message marqué comme lu',
        ]);
    }

    /**
     * Mark all messages in a conversation as read
     */
    public function markConversationAsRead(Request $request, $bookingId)
    {
        $user = $request->user();
        
        $updated = Message::where('booking_id', $bookingId)
            ->where('receiver_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);
        
        return response()->json([
            'success' => true,
            'message' => "{$updated} message(s) marqué(s) comme lu(s)",
        ]);
    }

    /**
     * Delete a message (soft delete for user)
     */
    public function deleteMessage(Request $request, $messageId)
    {
        $user = $request->user();
        
        $message = Message::where(function($q) use ($user) {
                $q->where('sender_id', $user->id)
                  ->orWhere('receiver_id', $user->id);
            })
            ->findOrFail($messageId);
        
        if ($message->sender_id === $user->id) {
            $message->is_deleted_by_sender = true;
        } else {
            $message->is_deleted_by_receiver = true;
        }
        
        $message->save();
        
        return response()->json([
            'success' => true,
            'message' => 'Message supprimé',
        ]);
    }

    /**
     * Get unread messages count for host
     */
    public function getUnreadCount(Request $request)
    {
        $user = $request->user();
        
        $propertyIds = Property::where('user_id', $user->id)->pluck('id');
        
        $bookingIds = Booking::whereIn('property_id', $propertyIds)->pluck('id');
        
        $unreadCount = Message::whereIn('booking_id', $bookingIds)
            ->where('receiver_id', $user->id)
            ->where('is_read', false)
            ->count();
        
        return response()->json([
            'success' => true,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Get quick reply templates for host
     */
    public function getQuickReplies(Request $request)
    {
        $replies = [
            [
                'id' => 1,
                'title' => 'Instructions d\'arrivée',
                'message' => "Bonjour! Voici les instructions pour votre arrivée:\n\n"
                    . "📍 Adresse: [ajoutez votre adresse]\n"
                    . "🕐 Heure d'arrivée: À partir de 14h\n"
                    . "🔑 Récupération des clés: [instructions]\n"
                    . "🅿️ Parking: [informations]\n\n"
                    . "N'hésitez pas si vous avez des questions! Bon voyage ✈️"
            ],
            [
                'id' => 2,
                'title' => 'Informations Wi-Fi',
                'message' => "Bonjour! Le Wi-Fi est disponible:\n\n"
                    . "📶 Réseau: [nom du réseau]\n"
                    . "🔐 Mot de passe: [mot de passe]\n\n"
                    . "La connexion est normalement stable, mais nous avons un groupe électrogène en cas de coupure.\n\n"
                    . "Bon séjour! 🌐"
            ],
            [
                'id' => 3,
                'title' => 'Services à proximité',
                'message' => "Bonjour! À proximité de notre logement vous trouverez:\n\n"
                    . "🛒 Supermarché: [nom] à 5min à pied\n"
                    . "🍽 Restaurants: [noms des restaurants]\n"
                    . "🚕 Taxis: Disponibles 24/7\n"
                    . "🏧 Distributeur: À 200m\n"
                    . "💊 Pharmacie: À 300m\n\n"
                    . "Bonne journée! 😊"
            ],
            [
                'id' => 4,
                'title' => 'Heure de départ',
                'message' => "Bonjour! Un petit rappel pour votre départ:\n\n"
                    . "🕚 Heure de check-out: 11h\n"
                    . "🔑 Merci de laisser les clés sur la table\n"
                    . "🗑️ Sortez vos poubelles\n"
                    . "💡 Éteignez les lumières et la climatisation\n\n"
                    . "N'oubliez pas vos affaires! Merci pour votre séjour et à bientôt! 🌟"
            ],
            [
                'id' => 5,
                'title' => 'Confirmation de réservation',
                'message' => "Bonjour! Je confirme votre réservation:\n\n"
                    . "📅 Arrivée: [date]\n"
                    . "📅 Départ: [date]\n"
                    . "👥 Nombre de voyageurs: [nombre]\n\n"
                    . "L'adresse exacte vous sera envoyée avant votre arrivée.\n\n"
                    . "Au plaisir de vous accueillir! 🤝"
            ],
            [
                'id' => 6,
                'title' => 'Groupe électrogène (coupures courant)',
                'message' => "Bonjour! Important concernant l'électricité:\n\n"
                    . "Notre logement dispose d'un groupe électrogène automatique qui se déclenche immédiatement en cas de coupure de courant.\n\n"
                    . "L'eau chaude, la climatisation et le Wi-Fi restent fonctionnels.\n\n"
                    . "Vous ne serez donc pas dérangé par les coupures! ⚡"
            ],
            [
                'id' => 7,
                'title' => 'Citerne d\'eau (coupures d\'eau)',
                'message' => "Bonjour! Information sur l'eau:\n\n"
                    . "Nous disposons d'une citerne d'eau avec pompe. Vous aurez de l'eau 24h/24 même en cas de coupure du réseau.\n\n"
                    . "Pas de souci à se faire! 💧"
            ],
            [
                'id' => 8,
                'title' => 'Merci et demande d\'avis',
                'message' => "Bonjour! Merci d'avoir choisi notre logement! 🙏\n\n"
                    . "J'espère que votre séjour s'est bien passé.\n\n"
                    . "Si cela vous a plu, n'hésitez pas à laisser un avis sur Bluefin. Cela nous aide beaucoup!\n\n"
                    . "Au plaisir de vous accueillir à nouveau! 🌟"
            ],
        ];
        
        return response()->json([
            'success' => true,
            'data' => $replies,
        ]);
    }
}