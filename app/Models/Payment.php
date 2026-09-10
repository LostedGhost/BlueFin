<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $table = 'payments';

    protected $fillable = [
        'booking_id', 'experience_booking_id', 'service_booking_id', 'transaction_id',
        'payment_method', 'mobile_money_provider',
        'mobile_money_number', 'card_last_four', 'amount', 'currency',
        'conversion_rate', 'amount_converted', 'status', 'payment_gateway_response',
        'paid_at', 'refunded_at', 'failure_reason'
    ];

    protected $casts = [
        'payment_gateway_response' => 'array',
        'paid_at' => 'datetime',
        'refunded_at' => 'datetime',
        'amount' => 'decimal:0',
        'amount_converted' => 'decimal:2',
    ];

    // Relations
    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function experienceBooking()
    {
        return $this->belongsTo(ExperienceBooking::class);
    }

    public function serviceBooking()
    {
        return $this->belongsTo(ServiceBooking::class);
    }

    /**
     * La réservation réglée par ce paiement, quel que soit son type
     * (logement, expérience ou service) — un seul des trois FK est rempli.
     * Volontairement pas une relation Eloquent (nom différent d'une colonne _id)
     * pour ne pas être confondu avec booking()/experienceBooking()/serviceBooking().
     */
    public function getPayableBooking()
    {
        return $this->booking ?? $this->experienceBooking ?? $this->serviceBooking;
    }

    // Scopes
    public function scopeSuccessful($query)
    {
        return $query->where('status', 'success');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    // Methods
    public function markAsSuccess()
    {
        $this->status = 'success';
        $this->paid_at = now();
        $this->save();

        $this->getPayableBooking()?->update(['payment_status' => 'paid']);
    }

    public function markAsFailed($reason = null)
    {
        $this->status = 'failed';
        $this->failure_reason = $reason;
        $this->save();
    }

    public function refund()
    {
        $this->status = 'refunded';
        $this->refunded_at = now();
        $this->save();

        $this->getPayableBooking()?->update([
            'payment_status' => 'refunded',
            'booking_status' => 'refunded'
        ]);
    }
}