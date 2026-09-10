<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ServiceBooking extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_reference', 'service_id', 'user_id', 'reservation_date',
        'guests_count', 'total_amount', 'payment_method', 'mobile_money_provider',
        'mobile_money_number', 'payment_status', 'booking_status',
        'guest_details', 'special_requests', 'cancelled_at', 'cancellation_reason',
    ];

    protected $casts = [
        'reservation_date' => 'date',
        'cancelled_at' => 'datetime',
        'guest_details' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function (self $booking) {
            $booking->booking_reference = 'BLF-SRV-' . strtoupper(Str::random(8));
        });
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class, 'service_booking_id');
    }
}
