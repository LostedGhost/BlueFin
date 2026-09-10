<?php

namespace App\Listeners;

use App\Events\NewMessageSent;
use App\Models\AdminNotification;
use App\Models\User;
use App\Services\NotificationService;

class SendAdminMessageNotification
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function handle(NewMessageSent $event)
    {
        $message = $event->message;
        
        // Only notify for messages related to bookings
        if (!$message->booking_id) {
            return;
        }
        
        $admins = User::where('user_type', 'admin')->get();
        
        foreach ($admins as $admin) {
            // Create notification (lower priority for messages)
            AdminNotification::create([
                'admin_id' => $admin->id,
                'type' => 'message_sent',
                'title' => 'Nouveau message entre utilisateurs',
                'message' => "{$message->sender->full_name} a envoyé un message à {$message->receiver->full_name}",
                'priority' => 'normal',
                'data' => [
                    'message_id' => $message->id,
                    'sender_id' => $message->sender_id,
                    'sender_name' => $message->sender->full_name,
                    'receiver_id' => $message->receiver_id,
                    'receiver_name' => $message->receiver->full_name,
                    'booking_id' => $message->booking_id,
                    'message_preview' => substr($message->message, 0, 200),
                ],
            ]);
        }
    }
}