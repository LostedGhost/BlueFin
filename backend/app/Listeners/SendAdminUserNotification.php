<?php

namespace App\Listeners;

use App\Events\NewUserRegistered;
use App\Models\AdminNotification;
use App\Models\User;

class SendAdminUserNotification
{
    public function handle(NewUserRegistered $event)
    {
        $user = $event->user;
        
        $admins = User::where('user_type', 'admin')->get();
        
        foreach ($admins as $admin) {
            AdminNotification::create([
                'admin_id' => $admin->id,
                'type' => 'user_registered',
                'title' => '👤 Nouvel utilisateur inscrit',
                'message' => "{$user->full_name} s'est inscrit en tant que {$user->user_type}",
                'priority' => 'normal',
                'data' => [
                    'user_id' => $user->id,
                    'user_name' => $user->full_name,
                    'user_email' => $user->email,
                    'user_phone' => $user->phone,
                    'user_type' => $user->user_type,
                    'registered_at' => $user->created_at->toIso8601String(),
                ],
            ]);
        }
    }
}