<?php

namespace App\Http\Controllers\Api\Traveler;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Booking;
use App\Models\Property;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TravelerMessageController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get all conversations for traveler
     */
    public function getConversations(Request $request)
    {
        $user = $request->user();
        
        // Get all bookings made by traveler
        $bookings = Booking::with(['property', 'property.user'])
            ->where('user_id', $user->id)
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
                    'property' => [
                        'id' => $booking->property->id,
                        'title' => $booking->property->title,
                        'city' => $booking->property->city,
                        'district' => $booking->property->district,
                        'photo' => $booking->property->coverPhoto?->photo_url,
                    ],
                    'host' => [
                        'id' => $booking->property->user->id,
                        'name' => $booking->property->user->full_name,
                        'photo' => $booking->property->user->profile_photo_url,
                        'phone' => $booking->property->user->phone,
                    ],
                    'dates' => [
                        'check_in' => $booking->check_in->format('d/m/Y'),
                        'check_out' => $booking->check_out->format('d/m/Y'),
                    ],
                    'status' => $booking->booking_status,
                ],
                'last_message' => $lastMessage ? [
                    'message' => $lastMessage->message,
                    'preview' => strlen($lastMessage->message) > 50 ? substr($lastMessage->message, 0, 50) . '...' : $lastMessage->message,
                    'sent_at' => $lastMessage->created_at->diffForHumans(),
                    'is_from_host' => $lastMessage->sender_id !== $user->id,
                    'is_read' => $lastMessage->is_read,
                ] : null,
                'unread_count' => $unreadCount,
            ];
        }
        
        // Sort by last message time
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
        
        $booking = Booking::with(['property', 'property.user'])
            ->where('user_id', $user->id)
            ->findOrFail($bookingId);
        
        // Mark unread messages as read
        Message::where('booking_id', $bookingId)
            ->where('receiver_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);
        
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
                    'property' => [
                        'id' => $booking->property->id,
                        'title' => $booking->property->title,
                        'address' => $booking->property->address,
                        'city' => $booking->property->city,
                        'district' => $booking->property->district,
                        'phone' => $booking->property->user->phone,
                    ],
                    'host' => [
                        'id' => $booking->property->user->id,
                        'name' => $booking->property->user->full_name,
                        'photo' => $booking->property->user->profile_photo_url,
                    ],
                    'dates' => [
                        'check_in' => $booking->check_in->format('d/m/Y'),
                        'check_out' => $booking->check_out->format('d/m/Y'),
                    ],
                ],
                'messages' => $messages,
            ],
        ]);
    }

    /**
     * Send message to host
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
        
        $booking = Booking::with(['property.user'])
            ->where('user_id', $user->id)
            ->findOrFail($bookingId);
        
        $message = Message::create([
            'sender_id' => $user->id,
            'receiver_id' => $booking->property->user_id,
            'booking_id' => $bookingId,
            'message' => $request->message,
            'message_type' => 'text',
            'is_read' => false,
        ]);
        
        $message->load('sender');
        
        // Send real-time notification
        broadcast(new \App\Events\NewMessageSent($message))->toOthers();
        
        // Send WhatsApp notification to host
        $this->notificationService->sendWhatsApp(
            $booking->property->user->phone,
            "💬 *Nouveau message du voyageur*\n\n"
            . "🏠 Propriété: {$booking->property->title}\n"
            . "👤 Voyageur: {$user->full_name}\n"
            . "📞 Téléphone: {$user->phone}\n"
            . "📅 Dates: {$booking->check_in->format('d/m/Y')} → {$booking->check_out->format('d/m/Y')}\n\n"
            . "📝 Message:\n{$request->message}\n\n"
            . "📱 Répondez directement dans l'application Bluefin Immo"
        );
        
        // Send push notification
        $this->notificationService->sendPushNotification(
            $booking->property->user->devices()->where('is_active', true)->pluck('device_token')->toArray(),
            "Nouveau message de {$user->first_name}",
            $request->message,
            ['booking_id' => $bookingId, 'type' => 'traveler_message']
        );
        
        return response()->json([
            'success' => true,
            'message' => 'Message envoyé',
            'data' => [
                'id' => $message->id,
                'message' => $message->message,
                'created_at' => $message->created_at->format('H:i d/m/Y'),
                'is_from_me' => true,
            ],
        ], 201);
    }

    /**
     * Send inquiry message before booking
     */
    public function sendInquiry(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'property_id' => 'required|exists:properties,id',
            'message' => 'required|string|min:10|max:2000',
            'check_in' => 'nullable|date|after:today',
            'check_out' => 'nullable|date|after:check_in',
            'guests' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        $property = Property::with('user')->findOrFail($request->property_id);
        
        $messageText = "📝 *Demande d'information*\n\n";
        
        if ($request->check_in && $request->check_out) {
            $messageText .= "📅 Dates souhaitées: " . date('d/m/Y', strtotime($request->check_in)) 
                . " → " . date('d/m/Y', strtotime($request->check_out)) . "\n";
            $nights = \Carbon\Carbon::parse($request->check_in)->diffInDays(\Carbon\Carbon::parse($request->check_out));
            $messageText .= "📆 Nuits: {$nights}\n";
        }
        
        if ($request->guests) {
            $messageText .= "👥 Voyageurs: {$request->guests}\n";
        }
        
        $messageText .= "\n📝 Message:\n{$request->message}\n\n"
            . "👤 Voyageur: {$user->full_name}\n"
            . "📞 Téléphone: {$user->phone}\n"
            . "📧 Email: {$user->email}";
        
        // Create message without booking
        $message = Message::create([
            'sender_id' => $user->id,
            'receiver_id' => $property->user_id,
            'booking_id' => null,
            'message' => $messageText,
            'message_type' => 'text',
            'is_read' => false,
        ]);
        
        // Send notification to host
        $this->notificationService->sendWhatsApp(
            $property->user->phone,
            "💬 *NOUVELLE DEMANDE D'INFORMATION*\n\n"
            . "🏠 Propriété: {$property->title}\n"
            . "📍 {$property->district}, {$property->city}\n"
            . "👤 Voyageur: {$user->full_name}\n"
            . "📞 Téléphone: {$user->phone}\n\n"
            . "📝 Message:\n{$request->message}\n\n"
            . "📱 Répondez directement dans l'application Bluefin Immo"
        );
        
        return response()->json([
            'success' => true,
            'message' => 'Votre message a été envoyé à l\'hôte. Il vous répondra dans les plus brefs délais.',
            'data' => [
                'message_id' => $message->id,
                'sent_at' => now()->format('H:i d/m/Y'),
            ],
        ], 201);
    }

    /**
     * Mark message as read
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
     * Mark all messages in conversation as read
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
     * Get unread messages count
     */
    public function getUnreadCount(Request $request)
    {
        $user = $request->user();
        
        $unreadCount = Message::where('receiver_id', $user->id)
            ->where('is_read', false)
            ->count();
        
        return response()->json([
            'success' => true,
            'unread_count' => $unreadCount,
        ]);
    }
}