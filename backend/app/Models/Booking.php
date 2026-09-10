<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Booking extends Model
{
    use HasFactory;

    protected $table = 'bookings';

    protected $fillable = [
        'booking_reference', 'user_id', 'property_id', 'check_in',
        'check_out', 'guests_count', 'nights_count', 'subtotal',
        'service_fee', 'cleaning_fee', 'total_amount', 'payment_method',
        'payment_status', 'booking_status', 'guest_notes', 'host_notes',
        'guest_details', 'qr_code', 'checked_in_at', 'checked_out_at'
    ];

    protected $casts = [
        'check_in' => 'date',
        'check_out' => 'date',
        'checked_in_at' => 'datetime',
        'checked_out_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'guest_details' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($booking) {
            $booking->booking_reference = 'BLF-' . strtoupper(Str::random(10));
        });
    }

    // Relations
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    public function review()
    {
        return $this->hasOne(Review::class);
    }

    // Accessors
    public function getGuestFullNameAttribute()
    {
        return $this->guest_details['full_name'] ?? $this->user->full_name;
    }

    public function getGuestEmailAttribute()
    {
        return $this->guest_details['email'] ?? $this->user->email;
    }

    public function getGuestPhoneAttribute()
    {
        return $this->guest_details['phone'] ?? $this->user->phone;
    }

    // Scopes
    public function scopeConfirmed($query)
    {
        return $query->where('booking_status', 'confirmed');
    }

    public function scopePending($query)
    {
        return $query->where('booking_status', 'pending');
    }

    public function scopeCompleted($query)
    {
        return $query->where('booking_status', 'completed');
    }

    public function scopeUpcoming($query)
    {
        return $query->where('check_in', '>', now());
    }

    public function scopeCurrent($query)
    {
        return $query->where('check_in', '<=', now())
                     ->where('check_out', '>=', now());
    }

    // Methods
    public function canBeCancelled()
    {
        $now = now();
        $checkIn = $this->check_in;
        
        switch ($this->property->cancellation_policy) {
            case 'flexible':
                return $now->lt($checkIn->copy()->subDay());
            case 'moderate':
                return $now->lt($checkIn->copy()->subDays(5));
            case 'strict':
                return $now->lt($checkIn->copy()->subDays(14));
            case 'non_refundable':
                return false;
            default:
                return false;
        }
    }

    public function calculateRefundAmount()
    {
        if (!$this->canBeCancelled()) {
            return 0;
        }
        
        $daysUntilCheckIn = now()->diffInDays($this->check_in);
        
        if ($this->property->cancellation_policy === 'flexible') {
            return $this->total_amount * 0.9;
        } elseif ($this->property->cancellation_policy === 'moderate') {
            if ($daysUntilCheckIn > 5) {
                return $this->total_amount * 0.95;
            }
            return $this->total_amount * 0.5;
        } elseif ($this->property->cancellation_policy === 'strict') {
            if ($daysUntilCheckIn > 14) {
                return $this->total_amount * 0.95;
            } elseif ($daysUntilCheckIn > 7) {
                return $this->total_amount * 0.5;
            }
            return 0;
        }
        
        return 0;
    }

    public function markAsCompleted()
    {
        if ($this->check_out <= now() && $this->booking_status === 'confirmed') {
            $this->booking_status = 'completed';
            $this->save();
            return true;
        }
        return false;
    }

    public function isAvailable($checkIn, $checkOut)
{
    $dates = [];
    $current = clone $checkIn;
    
    while ($current->lt($checkOut)) {
        $dates[] = $current->format('Y-m-d');
        $current->addDay();
    }
    
    $blockedDates = Availability::where('property_id', $this->id)
        ->whereIn('date', $dates)
        ->where('is_available', false)
        ->count();
    
    return $blockedDates === 0;
}

public function calculateTotalPrice($checkIn, $checkOut, $guests)
{
    $checkIn = new \DateTime($checkIn);
    $checkOut = new \DateTime($checkOut);
    $nights = $checkIn->diff($checkOut)->days;
    
    $subtotal = $this->price_per_night * $nights;
    
    // Frais supplémentaires si plus de voyageurs que prévu
    $extraGuests = max(0, $guests - $this->max_guests);
    $extraGuestFee = $extraGuests * ($this->extra_guest_fee ?? 0) * $nights;
    
    $serviceFee = $subtotal * ($this->service_fee_percentage / 100);
    $cleaningFee = $this->cleaning_fee ?? 0;
    
    $total = $subtotal + $serviceFee + $cleaningFee + $extraGuestFee;
    
    return [
        'nights' => $nights,
        'subtotal' => $subtotal,
        'service_fee' => $serviceFee,
        'cleaning_fee' => $cleaningFee,
        'extra_guest_fee' => $extraGuestFee,
        'total' => $total,
    ];
}
}

// app/Models/Property.php

