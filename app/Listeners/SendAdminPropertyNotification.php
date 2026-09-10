<?php

namespace App\Listeners;

use App\Events\PropertySubmittedForApproval;
use App\Models\AdminNotification;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendAdminPropertyNotification implements ShouldQueue
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function handle(PropertySubmittedForApproval $event)
    {
        $property = $event->property;
        
        // Get all admins
        $admins = User::where('user_type', 'admin')->get();
        
        // Get first property photo for email
        $firstPhoto = $property->photos()->first();
        $photoUrl = $firstPhoto ? ($firstPhoto->photo_url ?? ($firstPhoto->photo_path ? \Illuminate\Support\Facades\Storage::url($firstPhoto->photo_path) : null)) : null;
        
        foreach ($admins as $admin) {
            // Create database notification
            AdminNotification::create([
                'admin_id' => $admin->id,
                'type' => 'property_submitted',
                'title' => 'Nouvelle propriété en attente de validation',
                'message' => "{$property->user->full_name} a soumis '{$property->title}' à {$property->city}",
                'priority' => 'high',
                'data' => [
                    'property_id' => $property->id,
                    'property_title' => $property->title,
                    'host_id' => $property->user_id,
                    'host_name' => $property->user->full_name,
                    'host_phone' => $property->user->phone,
                    'city' => $property->city,
                    'district' => $property->district,
                    'created_at' => $property->created_at->toIso8601String(),
                ],
            ]);
            
            // Send WhatsApp notification to admin
            if ($admin->receive_whatsapp_notifications) {
                $this->notificationService->sendWhatsApp(
                    $admin->phone,
                    "🏠 *NOUVELLE PROPRIÉTÉ À VALIDER*\n\n"
                    . "Hôte: {$property->user->full_name}\n"
                    . "Titre: {$property->title}\n"
                    . "Type: " . $this->getPropertyTypeLabel($property->property_type) . "\n"
                    . "📍 {$property->district}, {$property->city}\n"
                    . "💰 {$this->formatPrice($property->price_per_night)} FCFA/nuit\n\n"
                    . "🔗 Cliquez pour modérer: " . env('APP_URL') . "/admin/properties/{$property->id}/moderate"
                );
            }
            
            // Send email notification
            if ($admin->receive_email_notifications) {
                $this->notificationService->sendEmail(
                    $admin->email,
                    'Nouvelle propriété à valider - Bluefin Immo',
                    'emails.admin.property_submitted',
                    [
                        'property' => [
                            'id' => $property->id,
                            'title' => $property->title,
                            'description' => $property->description,
                            'host_name' => $property->user->full_name,
                            'host_phone' => $property->user->phone,
                            'city' => $property->city,
                            'district' => $property->district,
                            'property_type' => $this->getPropertyTypeLabel($property->property_type),
                            'image_url' => $photoUrl,
                            'created_at' => $property->created_at->format('d/m/Y H:i'),
                            'price_per_night' => $this->formatPrice($property->price_per_night),
                        ],
                        'admin' => $admin
                    ]
                );
            }
        }
    }
    
    private function getPropertyTypeLabel($type)
    {
        $labels = [
            'appartement' => 'Appartement',
            'villa' => 'Villa',
            'hotel' => 'Hôtel',
            'maison_hotes' => 'Maison d\'hôtes',
            'ecolodge' => 'Écolodge',
        ];
        
        return $labels[$type] ?? $type;
    }
    
    private function formatPrice($price)
    {
        return number_format($price, 0, ',', ' ');
    }
}