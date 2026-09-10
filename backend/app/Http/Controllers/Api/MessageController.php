<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Booking;
use App\Models\Property;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MessageController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get all conversations for the traveler
     */
    public function getConversations(Request $request)
    {
        $user = $request->user();
        
        // Get all bookings made by the traveler
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
                        'photo' => $booking->property->coverPhoto?->photo_url,
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
                'last_message' => $lastMessage ? [
                    'message' => $lastMessage->message,
                    'sent_at' => $lastMessage->created_at->diffForHumans(),
                    'is_from_host' => $lastMessage->sender_id !== $user->id,
                ] : null,
                'unread_count' => $unreadCount,
            ];
        }
        
        return response()->json([
            'success' => true,
            'data' => $conversations,
        ]);
    }

    /**
     * Get messages for a specific booking (traveler view)
     */
    public function getMessages(Request $request, $bookingId)
    {
        $user = $request->user();
        
        $booking = Booking::where('user_id', $user->id)->findOrFail($bookingId);
        
        // Mark messages as read
        Message::where('booking_id', $bookingId)
            ->where('receiver_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);
        
        $messages = Message::where('booking_id', $bookingId)
            ->with(['sender', 'receiver'])
            ->orderBy('created_at', 'asc')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => [
                'booking' => $booking->load('property'),
                'messages' => $messages,
            ],
        ]);
    }

    /**
     * Send message to host (traveler to host)
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
        
        // Send notification to host
        $this->notificationService->sendWhatsApp(
            $booking->property->user->phone,
            "💬 *Nouveau message du voyageur*\n\n"
            . "🏠 Propriété: {$booking->property->title}\n"
            . "👤 Voyageur: {$user->full_name}\n"
            . "📞 Téléphone: {$user->phone}\n"
            . "📅 Dates: {$booking->check_in->format('d/m/Y')} → {$booking->check_out->format('d/m/Y')}\n\n"
            . "📝 Message:\n{$request->message}\n\n"
            . "📱 Répondez dans l'application Bluefin Immo"
        );
        
        return response()->json([
            'success' => true,
            'message' => 'Message envoyé',
            'data' => $message,
        ], 201);
    }

    /**
     * Send initial message before booking
     */
    public function sendInquiryMessage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'property_id' => 'required|exists:properties,id',
            'message' => 'required|string|min:10|max:2000',
            'check_in' => 'nullable|date',
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
            $messageText .= "📅 Dates: " . date('d/m/Y', strtotime($request->check_in)) 
                . " → " . date('d/m/Y', strtotime($request->check_out)) . "\n";
        }
        
        if ($request->guests) {
            $messageText .= "👥 Voyageurs: {$request->guests}\n";
        }
        
        $messageText .= "\n📝 Message:\n{$request->message}\n\n"
            . "👤 De: {$user->full_name}\n"
            . "📞 Téléphone: {$user->phone}";
        
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
            . "👤 Voyageur: {$user->full_name}\n"
            . "📞 Téléphone: {$user->phone}\n\n"
            . "📝 Message:\n{$request->message}\n\n"
            . "📱 Répondez directement dans l'application Bluefin Immo"
        );
        
        return response()->json([
            'success' => true,
            'message' => 'Votre message a été envoyé à l\'hôte',
            'data' => $message,
        ], 201);
    }

    /**
     * Mark a specific message as read.
     */
    public function markAsRead(Request $request, $id)
    {
        $user = $request->user();

        $message = Message::where('receiver_id', $user->id)
            ->findOrFail($id);

        $message->update(['is_read' => true, 'read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Message marqué comme lu',
        ]);
    }

    /**
     * Delete a message for the authenticated user.
     */
    public function deleteMessage(Request $request, $id)
    {
        $user = $request->user();

        $message = Message::where(function ($query) use ($user) {
                $query->where('sender_id', $user->id)
                      ->orWhere('receiver_id', $user->id);
            })
            ->findOrFail($id);

        if ($message->sender_id === $user->id) {
            $message->update(['is_deleted_by_sender' => true]);
        } else {
            $message->update(['is_deleted_by_receiver' => true]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Message supprimé',
        ]);
    }

    /**
     * Get unread messages count.
     */
    public function getUnreadCount(Request $request)
    {
        $user = $request->user();

        $count = Message::where('receiver_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'success' => true,
            'unread_count' => $count,
        ]);
    }
}
