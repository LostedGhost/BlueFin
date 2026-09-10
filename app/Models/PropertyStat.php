<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PropertyStat extends Model
{
    use HasFactory;

    protected $table = 'property_stats';

    protected $fillable = [
        'property_id', 'date', 'views', 'unique_visitors', 
        'clicks_on_contact', 'booking_requests', 'bookings_confirmed', 
        'revenue', 'conversion_rate'
    ];

    protected $casts = [
        'date' => 'date',
        'views' => 'integer',
        'unique_visitors' => 'integer',
        'clicks_on_contact' => 'integer',
        'booking_requests' => 'integer',
        'bookings_confirmed' => 'integer',
        'revenue' => 'decimal:0',
        'conversion_rate' => 'decimal:2',
    ];

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public static function updateStats($propertyId, $date)
    {
        $views = PropertyView::where('property_id', $propertyId)
            ->whereDate('view_date', $date)
            ->count();
        
        $uniqueVisitors = PropertyView::where('property_id', $propertyId)
            ->whereDate('view_date', $date)
            ->distinct('ip_address')
            ->count('ip_address');
        
        $bookingRequests = Booking::where('property_id', $propertyId)
            ->whereDate('created_at', $date)
            ->count();
        
        $bookingsConfirmed = Booking::where('property_id', $propertyId)
            ->where('booking_status', 'confirmed')
            ->whereDate('created_at', $date)
            ->count();
        
        $revenue = Booking::where('property_id', $propertyId)
            ->where('booking_status', 'completed')
            ->whereDate('created_at', $date)
            ->sum('total_amount');
        
        $conversionRate = $views > 0 
            ? ($bookingsConfirmed / $views) * 100 
            : 0;
        
        return self::updateOrCreate(
            ['property_id' => $propertyId, 'date' => $date],
            [
                'views' => $views,
                'unique_visitors' => $uniqueVisitors,
                'booking_requests' => $bookingRequests,
                'bookings_confirmed' => $bookingsConfirmed,
                'revenue' => $revenue,
                'conversion_rate' => $conversionRate,
            ]
        );
    }
}