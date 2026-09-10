<?php


namespace App\Listeners;

use App\Models\Availability;
use Carbon\Carbon;

class GenerateAvailabilityForNewProperty
{
    public function handle($event)
    {
        $property = $event->property;
        
        $startDate = Carbon::today();
        $endDate = Carbon::today()->addMonths(12);
        
        $currentDate = clone $startDate;
        
        while ($currentDate <= $endDate) {
            Availability::firstOrCreate(
                [
                    'property_id' => $property->id,
                    'date' => $currentDate->format('Y-m-d'),
                ],
                [
                    'is_available' => true,
                    'status' => 'available',
                ]
            );
            $currentDate->addDay();
        }
    }
}