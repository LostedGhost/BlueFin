<?php

namespace App\Events;

use App\Models\Payment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentReceived implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $payment;

    public function __construct(Payment $payment)
    {
        $this->payment = $payment->load(['booking', 'booking.user', 'booking.property']);
    }

    public function broadcastOn()
    {
        return new Channel('admin-notifications');
    }

    public function broadcastAs()
    {
        return 'payment.received';
    }

    public function broadcastWith()
    {
        $booking = $this->payment->booking;
        
        return [
            'id' => $this->payment->id,
            'transaction_id' => $this->payment->transaction_id,
            'amount' => $this->payment->amount,
            'payment_method' => $this->payment->payment_method,
            'guest_name' => $booking->user->full_name,
            'guest_phone' => $booking->user->phone,
            'property_title' => $booking->property->title,
            'booking_reference' => $booking->booking_reference,
            'check_in' => $booking->check_in->toDateString(),
            'check_out' => $booking->check_out->toDateString(),
            'created_at' => $this->payment->created_at->toIso8601String(),
        ];
    }
}