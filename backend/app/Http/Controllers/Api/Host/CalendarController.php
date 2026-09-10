<?php

namespace App\Http\Controllers\Api\Host;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\Availability;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CalendarController extends Controller
{
    // Supprimer le constructeur si vous utilisez des middlewares spécifiques
    // public function __construct()
    // {
    //     $this->middleware('auth:sanctum');
    // }
    
    public function index(Request $request, $propertyId)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Non authentifié'], 401);
            }
            
            $property = Property::where('user_id', $user->id)
                ->find($propertyId);
            
            if (!$property) {
                return response()->json(['success' => false, 'message' => 'Propriété non trouvée'], 404);
            }
            
            $year = $request->get('year', date('Y'));
            $month = $request->get('month', date('m'));
            
            $startDate = Carbon::create($year, $month, 1)->startOfMonth();
            $endDate = Carbon::create($year, $month, 1)->endOfMonth();
            
            // Créer une collection de tous les jours du mois
            $calendar = [];
            $currentDate = clone $startDate;
            
            while ($currentDate <= $endDate) {
                $dateStr = $currentDate->format('Y-m-d');
                
                // Récupérer la disponibilité
                $availability = Availability::where('property_id', $propertyId)
                    ->where('date', $dateStr)
                    ->first();
                
                // Vérifier si la date est réservée
                $isBooked = Booking::where('property_id', $propertyId)
                    ->where('booking_status', 'confirmed')
                    ->where('check_in', '<=', $dateStr)
                    ->where('check_out', '>', $dateStr)
                    ->exists();
                
                if ($isBooked) {
                    $status = 'booked';
                    $isAvailable = false;
                } elseif ($availability) {
                    $status = $availability->status;
                    $isAvailable = $availability->is_available;
                } else {
                    // Créer une disponibilité par défaut si elle n'existe pas
                    $availability = Availability::create([
                        'property_id' => $propertyId,
                        'date' => $dateStr,
                        'is_available' => true,
                        'status' => 'available',
                    ]);
                    $status = 'available';
                    $isAvailable = true;
                }
                
                $calendar[] = [
                    'date' => $dateStr,
                    'day' => (int)$currentDate->day,
                    'is_available' => (bool)$isAvailable,
                    'status' => $status,
                    'special_price' => $availability ? $availability->special_price : null,
                ];
                
                $currentDate->addDay();
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'property' => $property,
                    'year' => $year,
                    'month' => $month,
                    'month_name' => $startDate->format('F Y'),
                    'calendar' => $calendar,
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Calendar index error: ' . $e->getMessage());
            Log::error('Line: ' . $e->getLine());
            Log::error('File: ' . $e->getFile());
            
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'line' => $e->getLine()
            ], 500);
        }
    }
    
    public function updateAvailability(Request $request, $propertyId)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Non authentifié'], 401);
            }
            
            $property = Property::where('user_id', $user->id)
                ->find($propertyId);
            
            if (!$property) {
                return response()->json(['success' => false, 'message' => 'Propriété non trouvée'], 404);
            }
            
            $validated = $request->validate([
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
                'status' => 'required|in:available,blocked',
                'special_price' => 'nullable|numeric|min:0',
                'reason' => 'nullable|string|max:255',
            ]);
            
            $startDate = Carbon::parse($validated['start_date']);
            $endDate = Carbon::parse($validated['end_date']);
            
            $currentDate = clone $startDate;
            $updatedCount = 0;
            
            while ($currentDate <= $endDate) {
                $dateStr = $currentDate->format('Y-m-d');
                
                Availability::updateOrCreate(
                    [
                        'property_id' => $propertyId,
                        'date' => $dateStr,
                    ],
                    [
                        'is_available' => $validated['status'] === 'available',
                        'status' => $validated['status'],
                        'special_price' => $validated['special_price'] ?? null,
                        'notes' => $validated['reason'] ?? null,
                    ]
                );
                $updatedCount++;
                $currentDate->addDay();
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Disponibilités mises à jour',
                'updated_count' => $updatedCount
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Update availability error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}