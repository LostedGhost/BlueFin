<?php

namespace App\Http\Controllers\Api\Host;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\PropertyView;
use App\Models\Booking;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HostStatisticsController extends Controller
{
    /**
     * Get host statistics overview
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $propertyIds = Property::where('user_id', $user->id)->pluck('id');
        
        // Date ranges
        $today = today();
        $thisWeek = now()->startOfWeek();
        $thisMonth = now()->startOfMonth();
        $lastMonth = now()->subMonth()->startOfMonth();
        $thisYear = now()->startOfYear();
        
        // ==================== VISITES ====================
        $views = [
            'today' => PropertyView::whereIn('property_id', $propertyIds)->whereDate('view_date', $today)->count(),
            'this_week' => PropertyView::whereIn('property_id', $propertyIds)->where('view_date', '>=', $thisWeek)->count(),
            'this_month' => PropertyView::whereIn('property_id', $propertyIds)->where('view_date', '>=', $thisMonth)->count(),
            'last_month' => PropertyView::whereIn('property_id', $propertyIds)->whereBetween('view_date', [$lastMonth, $lastMonth->copy()->endOfMonth()])->count(),
            'total' => PropertyView::whereIn('property_id', $propertyIds)->count(),
        ];
        
        $viewsGrowth = $views['last_month'] > 0 
            ? (($views['this_month'] - $views['last_month']) / $views['last_month']) * 100 
            : ($views['this_month'] > 0 ? 100 : 0);
        
        // ==================== VISITEURS UNIQUES ====================
        $uniqueVisitors = [
            'this_month' => PropertyView::whereIn('property_id', $propertyIds)
                ->where('view_date', '>=', $thisMonth)
                ->distinct('ip_address')
                ->count('ip_address'),
            'total' => PropertyView::whereIn('property_id', $propertyIds)
                ->distinct('ip_address')
                ->count('ip_address'),
        ];
        
        // ==================== RÉSERVATIONS ====================
        $bookings = [
            'this_month' => Booking::whereIn('property_id', $propertyIds)
                ->where('booking_status', 'confirmed')
                ->where('created_at', '>=', $thisMonth)
                ->count(),
            'last_month' => Booking::whereIn('property_id', $propertyIds)
                ->where('booking_status', 'confirmed')
                ->whereBetween('created_at', [$lastMonth, $lastMonth->copy()->endOfMonth()])
                ->count(),
            'total' => Booking::whereIn('property_id', $propertyIds)
                ->where('booking_status', 'confirmed')
                ->count(),
            'pending' => Booking::whereIn('property_id', $propertyIds)
                ->where('booking_status', 'pending')
                ->count(),
            'cancelled' => Booking::whereIn('property_id', $propertyIds)
                ->where('booking_status', 'cancelled')
                ->count(),
        ];
        
        $bookingsGrowth = $bookings['last_month'] > 0 
            ? (($bookings['this_month'] - $bookings['last_month']) / $bookings['last_month']) * 100 
            : ($bookings['this_month'] > 0 ? 100 : 0);
        
        // ==================== REVENUS ====================
        $revenue = [
            'this_month' => Booking::whereIn('property_id', $propertyIds)
                ->where('booking_status', 'completed')
                ->where('check_out', '>=', $thisMonth)
                ->sum('total_amount'),
            'last_month' => Booking::whereIn('property_id', $propertyIds)
                ->where('booking_status', 'completed')
                ->whereBetween('check_out', [$lastMonth, $lastMonth->copy()->endOfMonth()])
                ->sum('total_amount'),
            'this_year' => Booking::whereIn('property_id', $propertyIds)
                ->where('booking_status', 'completed')
                ->where('check_out', '>=', $thisYear)
                ->sum('total_amount'),
            'total' => Booking::whereIn('property_id', $propertyIds)
                ->where('booking_status', 'completed')
                ->sum('total_amount'),
        ];
        
        $serviceFee = $revenue['this_month'] * 0.15;
        $netRevenue = $revenue['this_month'] - $serviceFee;
        
        $revenueGrowth = $revenue['last_month'] > 0 
            ? (($revenue['this_month'] - $revenue['last_month']) / $revenue['last_month']) * 100 
            : ($revenue['this_month'] > 0 ? 100 : 0);
        
        // ==================== TAUX DE CONVERSION ====================
        $conversionRate = $views['this_month'] > 0 
            ? round(($bookings['this_month'] / $views['this_month']) * 100, 2) 
            : 0;
        
        // ==================== TAUX D'OCCUPATION ====================
        $occupancyRate = $this->calculateOccupancyRate($propertyIds);
        
        // ==================== AVIS ET ÉVALUATIONS ====================
        $reviews = [
            'average_rating' => round(Review::whereIn('property_id', $propertyIds)
                ->where('review_type', 'guest')
                ->avg('rating') ?? 0, 1),
            'total_count' => Review::whereIn('property_id', $propertyIds)
                ->where('review_type', 'guest')
                ->count(),
            'five_stars' => Review::whereIn('property_id', $propertyIds)
                ->where('review_type', 'guest')
                ->where('rating', 5)
                ->count(),
            'four_stars' => Review::whereIn('property_id', $propertyIds)
                ->where('review_type', 'guest')
                ->where('rating', 4)
                ->count(),
            'three_stars' => Review::whereIn('property_id', $propertyIds)
                ->where('review_type', 'guest')
                ->where('rating', 3)
                ->count(),
            'two_stars' => Review::whereIn('property_id', $propertyIds)
                ->where('review_type', 'guest')
                ->where('rating', 2)
                ->count(),
            'one_star' => Review::whereIn('property_id', $propertyIds)
                ->where('review_type', 'guest')
                ->where('rating', 1)
                ->count(),
        ];
        
        // ==================== PERFORMANCE PAR PROPRIÉTÉ ====================
        $topProperty = Property::where('user_id', $user->id)
            ->withCount(['bookings' => function($q) {
                $q->where('booking_status', 'confirmed');
            }])
            ->orderBy('bookings_count', 'desc')
            ->first();
        
        return response()->json([
            'success' => true,
            'data' => [
                'views' => [
                    'this_month' => $views['this_month'],
                    'growth' => round($viewsGrowth, 1),
                    'total' => $views['total'],
                ],
                'unique_visitors' => $uniqueVisitors['this_month'],
                'bookings' => [
                    'this_month' => $bookings['this_month'],
                    'growth' => round($bookingsGrowth, 1),
                    'total' => $bookings['total'],
                    'pending' => $bookings['pending'],
                    'cancelled' => $bookings['cancelled'],
                ],
                'revenue' => [
                    'this_month' => $revenue['this_month'],
                    'formatted' => number_format($revenue['this_month'], 0, ',', ' '),
                    'service_fee' => number_format($serviceFee, 0, ',', ' '),
                    'net' => number_format($netRevenue, 0, ',', ' '),
                    'growth' => round($revenueGrowth, 1),
                    'this_year' => number_format($revenue['this_year'], 0, ',', ' '),
                    'total' => number_format($revenue['total'], 0, ',', ' '),
                ],
                'conversion_rate' => $conversionRate,
                'occupancy_rate' => $occupancyRate,
                'reviews' => $reviews,
                'top_property' => $topProperty ? [
                    'id' => $topProperty->id,
                    'title' => $topProperty->title,
                    'bookings' => $topProperty->bookings_count,
                ] : null,
            ],
        ]);
    }

    /**
     * Get daily statistics chart
     */
    public function dailyStats(Request $request)
    {
        $user = $request->user();
        $propertyIds = Property::where('user_id', $user->id)->pluck('id');
        
        $days = $request->get('days', 30);
        $startDate = now()->subDays($days);
        
        $dailyStats = [];
        $currentDate = clone $startDate;
        
        while ($currentDate <= now()) {
            $dateStr = $currentDate->format('Y-m-d');
            
            $views = PropertyView::whereIn('property_id', $propertyIds)
                ->whereDate('view_date', $dateStr)
                ->count();
            
            $bookings = Booking::whereIn('property_id', $propertyIds)
                ->where('booking_status', 'confirmed')
                ->whereDate('created_at', $dateStr)
                ->count();
            
            $revenue = Booking::whereIn('property_id', $propertyIds)
                ->where('booking_status', 'completed')
                ->whereDate('check_out', $dateStr)
                ->sum('total_amount');
            
            $dailyStats[] = [
                'date' => $dateStr,
                'day' => $currentDate->format('d M'),
                'views' => $views,
                'bookings' => $bookings,
                'revenue' => $revenue,
            ];
            
            $currentDate->addDay();
        }
        
        return response()->json([
            'success' => true,
            'data' => $dailyStats,
        ]);
    }

    /**
     * Get statistics per property
     */
    public function propertyStats(Request $request)
    {
        $user = $request->user();
        $properties = Property::where('user_id', $user->id)->get();
        
        $stats = [];
        foreach ($properties as $property) {
            $viewsThisMonth = PropertyView::where('property_id', $property->id)
                ->whereMonth('view_date', now()->month)
                ->count();
            
            $bookings = Booking::where('property_id', $property->id)
                ->where('booking_status', 'confirmed')
                ->count();
            
            $revenue = Booking::where('property_id', $property->id)
                ->where('booking_status', 'completed')
                ->sum('total_amount');
            
            $averageRating = Review::where('property_id', $property->id)
                ->where('review_type', 'guest')
                ->avg('rating') ?? 0;
            
            $occupancyRate = $this->calculatePropertyOccupancyRate($property->id);
            
            $stats[] = [
                'property' => [
                    'id' => $property->id,
                    'title' => $property->title,
                    'city' => $property->city,
                    'district' => $property->district,
                    'status' => $property->status,
                    'status_label' => $this->getStatusLabel($property->status),
                    'published_at' => $property->published_at,
                    'price_per_night' => number_format($property->price_per_night, 0, ',', ' '),
                ],
                'stats' => [
                    'views_this_month' => $viewsThisMonth,
                    'total_bookings' => $bookings,
                    'total_revenue' => number_format($revenue, 0, ',', ' '),
                    'average_rating' => round($averageRating, 1),
                    'occupancy_rate' => $occupancyRate,
                ],
            ];
        }
        
        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Get detailed views statistics for a property
     */
    public function viewsDetails(Request $request, $propertyId)
    {
        $user = $request->user();
        $property = Property::where('user_id', $user->id)->findOrFail($propertyId);
        
        // Views by date (last 30 days)
        $viewsByDate = PropertyView::where('property_id', $propertyId)
            ->select(DB::raw('DATE(view_date) as date'), DB::raw('COUNT(*) as count'))
            ->where('view_date', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->get();
        
        // Top referrers
        $referrers = PropertyView::where('property_id', $propertyId)
            ->whereNotNull('referrer')
            ->select('referrer', DB::raw('COUNT(*) as count'))
            ->groupBy('referrer')
            ->orderBy('count', 'desc')
            ->limit(10)
            ->get();
        
        // Devices breakdown
        $devices = PropertyView::where('property_id', $propertyId)
            ->select(
                DB::raw("CASE 
                    WHEN user_agent LIKE '%iPhone%' OR user_agent LIKE '%Android%' OR user_agent LIKE '%Mobile%' THEN 'Mobile'
                    WHEN user_agent LIKE '%iPad%' OR user_agent LIKE '%Tablet%' THEN 'Tablet'
                    ELSE 'Desktop'
                END as device_type"),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('device_type')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => [
                'property' => [
                    'id' => $property->id,
                    'title' => $property->title,
                ],
                'views_by_date' => $viewsByDate,
                'top_referrers' => $referrers,
                'devices' => $devices,
                'total_views' => PropertyView::where('property_id', $propertyId)->count(),
                'total_unique' => PropertyView::where('property_id', $propertyId)->distinct('ip_address')->count('ip_address'),
            ],
        ]);
    }

    /**
     * Export statistics as CSV
     */
    public function exportStats(Request $request)
    {
        $user = $request->user();
        $propertyIds = Property::where('user_id', $user->id)->pluck('id');
        
        $startDate = $request->get('start_date', now()->subMonths(6)->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());
        
        $dailyData = [];
        $currentDate = now()->parse($startDate);
        $end = now()->parse($endDate);
        
        while ($currentDate <= $end) {
            $dateStr = $currentDate->format('Y-m-d');
            
            $views = PropertyView::whereIn('property_id', $propertyIds)
                ->whereDate('view_date', $dateStr)
                ->count();
            
            $bookings = Booking::whereIn('property_id', $propertyIds)
                ->where('booking_status', 'confirmed')
                ->whereDate('created_at', $dateStr)
                ->count();
            
            $revenue = Booking::whereIn('property_id', $propertyIds)
                ->where('booking_status', 'completed')
                ->whereDate('check_out', $dateStr)
                ->sum('total_amount');
            
            $dailyData[] = [
                'date' => $dateStr,
                'views' => $views,
                'bookings' => $bookings,
                'revenue' => $revenue,
            ];
            
            $currentDate->addDay();
        }
        
        // Generate CSV
        $csv = "Date,Vues,Réservations,Chiffre d'affaires (FCFA)\n";
        foreach ($dailyData as $data) {
            $csv .= sprintf(
                "%s,%d,%d,%d\n",
                $data['date'],
                $data['views'],
                $data['bookings'],
                $data['revenue']
            );
        }
        
        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="statistiques_' . now()->format('Y-m-d') . '.csv"',
        ]);
    }

    private function calculateOccupancyRate($propertyIds)
    {
        if ($propertyIds->isEmpty()) {
            return 0;
        }
        
        $totalProperties = $propertyIds->count();
        $daysInMonth = now()->daysInMonth;
        
        $bookedDays = Booking::whereIn('property_id', $propertyIds)
            ->where('booking_status', 'confirmed')
            ->where(function($q) {
                $q->whereBetween('check_in', [now()->startOfMonth(), now()->endOfMonth()])
                  ->orWhereBetween('check_out', [now()->startOfMonth(), now()->endOfMonth()]);
            })
            ->get()
            ->sum(function($booking) {
                $start = $booking->check_in->max(now()->startOfMonth());
                $end = $booking->check_out->min(now()->endOfMonth());
                return max(0, $start->diffInDays($end));
            });
        
        $totalDays = $totalProperties * $daysInMonth;
        
        return $totalDays > 0 ? round(($bookedDays / $totalDays) * 100, 1) : 0;
    }

    private function calculatePropertyOccupancyRate($propertyId)
    {
        $daysInMonth = now()->daysInMonth;
        
        $bookedDays = Booking::where('property_id', $propertyId)
            ->where('booking_status', 'confirmed')
            ->where(function($q) {
                $q->whereBetween('check_in', [now()->startOfMonth(), now()->endOfMonth()])
                  ->orWhereBetween('check_out', [now()->startOfMonth(), now()->endOfMonth()]);
            })
            ->get()
            ->sum(function($booking) {
                $start = $booking->check_in->max(now()->startOfMonth());
                $end = $booking->check_out->min(now()->endOfMonth());
                return max(0, $start->diffInDays($end));
            });
        
        return $daysInMonth > 0 ? round(($bookedDays / $daysInMonth) * 100, 1) : 0;
    }

    private function getStatusLabel($status)
    {
        $labels = [
            'draft' => 'Brouillon',
            'pending' => 'En attente',
            'active' => 'Publiée',
            'rejected' => 'Rejetée',
            'inactive' => 'Désactivée',
        ];
        return $labels[$status] ?? $status;
    }
}