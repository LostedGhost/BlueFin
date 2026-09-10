<?php

namespace App\Http\Controllers\Api\Traveler;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\Availability;
use App\Models\Booking;
use Illuminate\Http\Request;

class TravelerCalendarController extends Controller
{
    /**
     * Get availability calendar for a property
     */
    public function getPropertyCalendar(Request $request, $propertyId)
    {
        $property = Property::findOrFail($propertyId);
        
        $year = $request->get('year', now()->year);
        $month = $request->get('month', now()->month);
        
        $startDate = now()->setYear($year)->setMonth($month)->startOfMonth();
        $endDate = now()->setYear($year)->setMonth($month)->endOfMonth();
        
        // Get availability from database
        $availability = Availability::where('property_id', $propertyId)
            ->whereBetween('date', [$startDate, $endDate])
            ->get()
            ->keyBy('date');
        
        // Get bookings for this period
        $bookings = Booking::where('property_id', $propertyId)
            ->where('booking_status', 'confirmed')
            ->where(function($q) use ($startDate, $endDate) {
                $q->whereBetween('check_in', [$startDate, $endDate])
                  ->orWhereBetween('check_out', [$startDate, $endDate]);
            })
            ->get();
        
        $calendar = [];
        $currentDate = clone $startDate;
        
        while ($currentDate <= $endDate) {
            $dateStr = $currentDate->format('Y-m-d');
            $avail = $availability->get($dateStr);
            
            // Check if date is booked
            $isBooked = false;
            foreach ($bookings as $booking) {
                if ($currentDate->between($booking->check_in, $booking->check_out->subDay())) {
                    $isBooked = true;
                    break;
                }
            }
            
            $isAvailable = $avail ? $avail->is_available : true;
            $status = $avail ? $avail->status : 'available';
            
            if ($isBooked) {
                $status = 'booked';
                $isAvailable = false;
            }
            
            $calendar[] = [
                'date' => $dateStr,
                'day' => $currentDate->day,
                'month' => $currentDate->month,
                'year' => $currentDate->year,
                'is_available' => $isAvailable,
                'status' => $status,
                'special_price' => $avail ? $avail->special_price : null,
                'is_weekend' => $currentDate->isWeekend(),
                'is_today' => $currentDate->isToday(),
                'is_past' => $currentDate->isPast(),
                'price' => $avail && $avail->special_price 
                    ? number_format($avail->special_price, 0, ',', ' ')
                    : number_format($property->price_per_night, 0, ',', ' '),
            ];
            
            $currentDate->addDay();
        }
        
        // Get next 3 months availability summary
        $nextMonths = [];
        for ($i = 1; $i <= 3; $i++) {
            $nextMonthStart = now()->addMonths($i)->startOfMonth();
            $nextMonthEnd = now()->addMonths($i)->endOfMonth();
            
            $availableDays = Availability::where('property_id', $propertyId)
                ->whereBetween('date', [$nextMonthStart, $nextMonthEnd])
                ->where('is_available', true)
                ->count();
            
            $nextMonths[] = [
                'month' => $nextMonthStart->format('F Y'),
                'available_days' => $availableDays,
                'total_days' => $nextMonthEnd->day,
            ];
        }
        
        return response()->json([
            'success' => true,
            'data' => [
                'property' => [
                    'id' => $property->id,
                    'title' => $property->title,
                    'price_per_night' => number_format($property->price_per_night, 0, ',', ' '),
                ],
                'year' => $year,
                'month' => $month,
                'month_name' => $startDate->format('F Y'),
                'calendar' => $calendar,
                'next_months' => $nextMonths,
                'legend' => [
                    ['status' => 'available', 'label' => 'Disponible', 'color' => '#10B981'],
                    ['status' => 'booked', 'label' => 'Réservé', 'color' => '#EF4444'],
                    ['status' => 'blocked', 'label' => 'Indisponible', 'color' => '#F59E0B'],
                ],
            ],
        ]);
    }

    /**
     * Get multiple months calendar view
     */
    public function getMonthsCalendar(Request $request, $propertyId)
    {
        $property = Property::findOrFail($propertyId);
        
        $months = $request->get('months', 6);
        $startMonth = $request->get('start_month', now()->format('Y-m'));
        
        $startDate = now()->parse($startMonth . '-01')->startOfMonth();
        $endDate = $startDate->copy()->addMonths($months - 1)->endOfMonth();
        
        $availability = Availability::where('property_id', $propertyId)
            ->whereBetween('date', [$startDate, $endDate])
            ->get()
            ->keyBy('date');
        
        $bookings = Booking::where('property_id', $propertyId)
            ->where('booking_status', 'confirmed')
            ->where(function($q) use ($startDate, $endDate) {
                $q->whereBetween('check_in', [$startDate, $endDate])
                  ->orWhereBetween('check_out', [$startDate, $endDate]);
            })
            ->get();
        
        $calendarData = [];
        $currentDate = clone $startDate;
        
        while ($currentDate <= $endDate) {
            $monthKey = $currentDate->format('Y-m');
            
            if (!isset($calendarData[$monthKey])) {
                $calendarData[$monthKey] = [
                    'month' => $currentDate->format('F Y'),
                    'year' => $currentDate->year,
                    'month_number' => $currentDate->month,
                    'weeks' => [],
                ];
            }
            
            $weekNumber = $currentDate->weekOfMonth;
            
            if (!isset($calendarData[$monthKey]['weeks'][$weekNumber])) {
                $calendarData[$monthKey]['weeks'][$weekNumber] = [];
            }
            
            $dateStr = $currentDate->format('Y-m-d');
            $avail = $availability->get($dateStr);
            
            // Check if date is booked
            $isBooked = false;
            foreach ($bookings as $booking) {
                if ($currentDate->between($booking->check_in, $booking->check_out->subDay())) {
                    $isBooked = true;
                    break;
                }
            }
            
            $calendarData[$monthKey]['weeks'][$weekNumber][] = [
                'date' => $dateStr,
                'day' => $currentDate->day,
                'is_available' => !$isBooked && ($avail ? $avail->is_available : true),
                'is_past' => $currentDate->isPast(),
                'price' => number_format($avail && $avail->special_price ? $avail->special_price : $property->price_per_night, 0, ',', ' '),
            ];
            
            $currentDate->addDay();
        }
        
        return response()->json([
            'success' => true,
            'data' => [
                'property' => [
                    'id' => $property->id,
                    'title' => $property->title,
                ],
                'calendars' => array_values($calendarData),
            ],
        ]);
    }

    /**
     * Get available dates for a property
     */
    public function getAvailableDates(Request $request, $propertyId)
    {
        $property = Property::findOrFail($propertyId);
        
        $startDate = $request->get('start_date', now()->toDateString());
        $endDate = $request->get('end_date', now()->addMonths(6)->toDateString());
        
        $availability = Availability::where('property_id', $propertyId)
            ->whereBetween('date', [$startDate, $endDate])
            ->where('is_available', true)
            ->orderBy('date')
            ->pluck('date');
        
        $bookedDates = Booking::where('property_id', $propertyId)
            ->where('booking_status', 'confirmed')
            ->where(function($q) use ($startDate, $endDate) {
                $q->whereBetween('check_in', [$startDate, $endDate])
                  ->orWhereBetween('check_out', [$startDate, $endDate]);
            })
            ->get()
            ->flatMap(function($booking) {
                $dates = [];
                $current = clone $booking->check_in;
                while ($current < $booking->check_out) {
                    $dates[] = $current->format('Y-m-d');
                    $current->addDay();
                }
                return $dates;
            });
        
        $availableDates = $availability->diff($bookedDates)->values();
        
        return response()->json([
            'success' => true,
            'data' => [
                'property_id' => $propertyId,
                'available_dates' => $availableDates,
                'total_available' => $availableDates->count(),
            ],
        ]);
    }

    /**
     * Check date range availability
     */
    public function checkDateRange(Request $request, $propertyId)
    {
        $validator = Validator::make($request->all(), [
            'check_in' => 'required|date|after:today',
            'check_out' => 'required|date|after:check_in',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $property = Property::findOrFail($propertyId);
        
        $checkIn = $request->check_in;
        $checkOut = $request->check_out;
        
        // Check if dates are available
        $isAvailable = $property->isAvailable($checkIn, $checkOut);
        
        // Get price calculation
        $priceDetails = $property->calculateTotalPrice($checkIn, $checkOut, $request->get('guests', 1));
        
        // Get unavailable dates for display
        $unavailableDates = [];
        if (!$isAvailable) {
            $unavailableDates = Availability::where('property_id', $propertyId)
                ->whereBetween('date', [$checkIn, $checkOut])
                ->where('status', '!=', 'available')
                ->pluck('date')
                ->toArray();
        }
        
        return response()->json([
            'success' => true,
            'data' => [
                'available' => $isAvailable,
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                'nights' => $priceDetails['nights'],
                'price_details' => [
                    'price_per_night' => number_format($property->price_per_night, 0, ',', ' '),
                    'subtotal' => number_format($priceDetails['subtotal'], 0, ',', ' '),
                    'cleaning_fee' => number_format($priceDetails['cleaning_fee'], 0, ',', ' '),
                    'service_fee' => number_format($priceDetails['service_fee'], 0, ',', ' '),
                    'total' => number_format($priceDetails['total'], 0, ',', ' '),
                ],
                'unavailable_dates' => $unavailableDates,
                'suggested_dates' => !$isAvailable ? $this->getSuggestedDates($property, $checkIn, $checkOut) : [],
            ],
        ]);
    }

    private function getSuggestedDates($property, $checkIn, $checkOut)
    {
        $suggestions = [];
        
        // Try to find available dates before
        $beforeDate = \Carbon\Carbon::parse($checkIn);
        for ($i = 1; $i <= 7; $i++) {
            $newCheckIn = $beforeDate->copy()->subDays($i);
            $newCheckOut = $newCheckIn->copy()->addDays(\Carbon\Carbon::parse($checkIn)->diffInDays(\Carbon\Carbon::parse($checkOut)));
            if ($property->isAvailable($newCheckIn, $newCheckOut)) {
                $suggestions[] = [
                    'check_in' => $newCheckIn->format('Y-m-d'),
                    'check_out' => $newCheckOut->format('Y-m-d'),
                    'type' => 'before',
                ];
                break;
            }
        }
        
        // Try to find available dates after
        $afterDate = \Carbon\Carbon::parse($checkOut);
        for ($i = 1; $i <= 7; $i++) {
            $newCheckOut = $afterDate->copy()->addDays($i);
            $newCheckIn = $newCheckOut->copy()->subDays(\Carbon\Carbon::parse($checkIn)->diffInDays(\Carbon\Carbon::parse($checkOut)));
            if ($property->isAvailable($newCheckIn, $newCheckOut)) {
                $suggestions[] = [
                    'check_in' => $newCheckIn->format('Y-m-d'),
                    'check_out' => $newCheckOut->format('Y-m-d'),
                    'type' => 'after',
                ];
                break;
            }
        }
        
        return $suggestions;
    }
}