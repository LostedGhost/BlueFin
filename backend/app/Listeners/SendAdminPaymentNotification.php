<?php

namespace App\Listeners;

use App\Events\PaymentReceived;
use App\Models\AdminNotification;
use App\Models\User;
use App\Services\NotificationService;

class SendAdminPaymentNotification
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function handle(PaymentReceived $event)
    {
        $payment = $event->payment;
        $booking = $payment->booking;
        
        $admins = User::where('user_type', 'admin')->get();
        
        foreach ($admins as $admin) {
            // Create notification (high priority for payments)
            AdminNotification::create([
                'admin_id' => $admin->id,
                'type' => 'payment_received',
                'title' => '💰 Nouveau paiement reçu',
                'message' => "Paiement de {$this->formatPrice($payment->amount)} FCFA pour la réservation #{$booking->booking_reference}",
                'priority' => 'high',
                'data' => [
                    'payment_id' => $payment->id,
                    'transaction_id' => $payment->transaction_id,
                    'amount' => $payment->amount,
                    'payment_method' => $payment->payment_method,
                    'booking_reference' => $booking->booking_reference,
                    'guest_name' => $booking->user->full_name,
                    'guest_phone' => $booking->user->phone,
                    'property_title' => $booking->property->title,
                    'host_name' => $booking->property->user->full_name,
                ],
            ]);
            
            // Send WhatsApp for significant payments (>100,000 FCFA)
            if ($payment->amount >= 100000 && $admin->receive_whatsapp_notifications) {
                $this->notificationService->sendWhatsApp(
                    $admin->phone,
                    "💰 *NOUVEAU PAIEMENT* 💰\n\n"
                    . "Montant: {$this->formatPrice($payment->amount)} FCFA\n"
                    . "Méthode: {$payment->payment_method}\n"
                    . "Réservation: #{$booking->booking_reference}\n"
                    . "Voyageur: {$booking->user->full_name}\n"
                    . "Hébergement: {$booking->property->title}\n"
                    . "Dates: {$booking->check_in->format('d/m/Y')} → {$booking->check_out->format('d/m/Y')}\n\n"
                    . "✅ Paiement confirmé"
                );
            }
        }
    }
    
    private function formatPrice($price)
    {
        return number_format($price, 0, ',', ' ');
    }
}