<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    protected $table = 'reviews';

    protected $fillable = [
        'booking_id', 'user_id', 'property_id', 'rating',
        'cleanliness_rating', 'communication_rating', 'checkin_rating',
        'accuracy_rating', 'location_rating', 'value_rating',
        'comment', 'review_type', 'host_response', 'host_response_at',
        'is_approved', 'moderation_notes'
    ];

    protected $casts = [
        'host_response_at' => 'datetime',
        'is_approved' => 'boolean',
    ];

    // Relations
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    // Accessors
    public function getAverageRatingAttribute()
    {
        return ($this->cleanliness_rating + $this->communication_rating + 
                $this->checkin_rating + $this->accuracy_rating + 
                $this->location_rating + $this->value_rating) / 6;
    }

    // Scopes
    public function scopeGuest($query)
    {
        return $query->where('review_type', 'guest');
    }

    public function scopeHost($query)
    {
        return $query->where('review_type', 'host');
    }

    public function scopeApproved($query)
    {
        return $query->where('is_approved', true);
    }

    // Methods
    public function addHostResponse($response)
    {
        $this->host_response = $response;
        $this->host_response_at = now();
        $this->save();
    }

    public function approve()
    {
        $this->is_approved = true;
        $this->save();
        
        // Update property average rating
        $this->property->updateAverageRating();
    }
}