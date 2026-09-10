<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Property;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function summary(Request $request)
    {
        try {
            // Statistiques de base
            $totalUsers = User::count();
            $totalProperties = Property::count();
            $totalBookings = Booking::count();
            $totalRevenue = Payment::where('status', 'success')->sum('amount') ?? 0;
            
            // ✅ Comptage correct des propriétés par statut
            $activeProperties = Property::where('status', 'active')->count();
            $pendingProperties = Property::where('status', 'pending')->count();
            $publishedProperties = Property::where('is_published', 1)->count();
            
            // ✅ Répartition par type de propriété
            $appartementsCount = Property::where('property_type', 'appartement')->count();
            $villasCount = Property::where('property_type', 'villa')->count();
            $studiosCount = Property::where('property_type', 'studio')->count();
            $maisonsCount = Property::where('property_type', 'maison')->count();
            
            // Aujourd'hui
            $today = Carbon::today();
            $newUsers = User::whereDate('created_at', $today)->count();
            $newProperties = Property::whereDate('created_at', $today)->count();
            $bookingsCount = Booking::whereDate('created_at', $today)->count();
            $todayRevenue = Payment::where('status', 'success')
                ->whereDate('paid_at', $today)
                ->sum('amount') ?? 0;
            
            // Statistiques utilisateurs
            $totalHosts = User::where('user_type', 'hote')->count();
            $totalTravelers = User::where('user_type', 'voyageur')->count();
            $activeUsers = User::where('is_active', true)->count();
            
            // Données pour les graphiques (7 derniers jours)
            $chartLabels = [];
            $chartRevenue = [];
            $chartUsers = [];
            $chartBookings = [];
            
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::today()->subDays($i);
                $chartLabels[] = $date->format('d/m');
                $chartRevenue[] = Payment::where('status', 'success')
                    ->whereDate('paid_at', $date)->sum('amount') ?? 0;
                $chartUsers[] = User::whereDate('created_at', $date)->count();
                $chartBookings[] = Booking::whereDate('created_at', $date)->count();
            }
            
            $data = [
                'total_users' => $totalUsers,
                'total_properties' => $totalProperties,
                'total_bookings' => $totalBookings,
                'total_revenue' => $totalRevenue,
                'new_users' => $newUsers,
                'new_properties' => $newProperties,
                'bookings_count' => $bookingsCount,
                'revenue' => $todayRevenue,
                
                // ✅ Données propriétés
                'active_properties' => $activeProperties,
                'pending_properties' => $pendingProperties,
                'published_properties' => $publishedProperties,
                
                // ✅ Répartition par type
                'appartements_count' => $appartementsCount,
                'villas_count' => $villasCount,
                'studios_count' => $studiosCount,
                'maisons_count' => $maisonsCount,
                
                // ✅ Données utilisateurs
                'total_hosts' => $totalHosts,
                'total_travelers' => $totalTravelers,
                'active_users' => $activeUsers,
                
                'chart_data' => [
                    'labels' => $chartLabels,
                    'revenue' => $chartRevenue,
                    'users' => $chartUsers,
                    'bookings' => $chartBookings,
                ]
            ];
            
            return response()->json(['success' => true, 'data' => $data]);
            
        } catch (\Exception $e) {
            Log::error('Report summary error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * ✅ Liste détaillée des propriétés
     */
    public function properties(Request $request)
    {
        try {
            $query = Property::with('user')->orderBy('created_at', 'desc');
            
            // Filtrage par période
            if ($request->has('period')) {
                $period = $request->get('period');
                if ($period === 'monthly') {
                    $query->whereMonth('created_at', now()->month);
                } elseif ($period === 'annual') {
                    $query->whereYear('created_at', now()->year);
                } elseif ($period === 'custom' && $request->has('start_date') && $request->has('end_date')) {
                    $query->whereBetween('created_at', [
                        Carbon::parse($request->start_date),
                        Carbon::parse($request->end_date)
                    ]);
                }
            }
            
            $properties = $query->get();
            
            $data = $properties->map(function ($property) {
                return [
                    'id' => $property->id,
                    'title' => $property->title,
                    'host_name' => $property->user->first_name . ' ' . $property->user->last_name,
                    'city' => $property->city,
                    'price_per_night' => $property->price_per_night,
                    'status' => $property->status,
                    'is_published' => $property->is_published,
                    'created_at' => $property->created_at,
                ];
            });
            
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
    
    /**
     * ✅ Liste détaillée des utilisateurs
     */
    public function users(Request $request)
    {
        try {
            $query = User::orderBy('created_at', 'desc');
            
            if ($request->has('period')) {
                $period = $request->get('period');
                if ($period === 'monthly') {
                    $query->whereMonth('created_at', now()->month);
                } elseif ($period === 'annual') {
                    $query->whereYear('created_at', now()->year);
                } elseif ($period === 'custom' && $request->has('start_date') && $request->has('end_date')) {
                    $query->whereBetween('created_at', [
                        Carbon::parse($request->start_date),
                        Carbon::parse($request->end_date)
                    ]);
                }
            }
            
            $users = $query->get();
            
            $data = $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'email' => $user->email,
                    'user_type' => $user->user_type,
                    'is_active' => $user->is_active,
                    'created_at' => $user->created_at,
                ];
            });
            
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
    
    /**
     * ✅ Liste détaillée des réservations
     */
    public function bookings(Request $request)
    {
        try {
            $query = Booking::with(['user', 'property'])->orderBy('created_at', 'desc');
            
            if ($request->has('period')) {
                $period = $request->get('period');
                if ($period === 'monthly') {
                    $query->whereMonth('created_at', now()->month);
                } elseif ($period === 'annual') {
                    $query->whereYear('created_at', now()->year);
                } elseif ($period === 'custom' && $request->has('start_date') && $request->has('end_date')) {
                    $query->whereBetween('created_at', [
                        Carbon::parse($request->start_date),
                        Carbon::parse($request->end_date)
                    ]);
                }
            }
            
            $bookings = $query->get();
            
            $data = $bookings->map(function ($booking) {
                return [
                    'id' => $booking->id,
                    'guest_name' => $booking->user->first_name . ' ' . $booking->user->last_name,
                    'property_title' => $booking->property->title,
                    'check_in' => $booking->check_in,
                    'check_out' => $booking->check_out,
                    'total_amount' => $booking->total_amount,
                    'status' => $booking->booking_status,
                    'created_at' => $booking->created_at,
                ];
            });
            
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}