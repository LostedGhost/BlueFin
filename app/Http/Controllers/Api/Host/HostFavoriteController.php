<?php

namespace App\Http\Controllers\Api\Host;

use App\Http\Controllers\Controller;
use App\Models\Favorite;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HostFavoriteController extends Controller
{
    /**
     * Get all favorites for host's properties
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Get all properties owned by the host
        $propertyIds = Property::where('user_id', $user->id)->pluck('id');
        
        // Get all favorites for these properties
        $favorites = Favorite::with(['user', 'property'])
            ->whereIn('property_id', $propertyIds)
            ->orderBy('created_at', 'desc')
            ->paginate(20);
        
        // Calculate statistics
        $stats = [
            'total_favorites' => Favorite::whereIn('property_id', $propertyIds)->count(),
            'unique_travelers' => Favorite::whereIn('property_id', $propertyIds)
                ->distinct('user_id')
                ->count('user_id'),
            'top_properties' => Favorite::whereIn('property_id', $propertyIds)
                ->select('property_id', DB::raw('count(*) as total'))
                ->groupBy('property_id')
                ->orderBy('total', 'desc')
                ->limit(5)
                ->get()
                ->map(function($item) {
                    $property = Property::find($item->property_id);
                    return [
                        'property_id' => $item->property_id,
                        'property_title' => $property?->title,
                        'total_favorites' => $item->total,
                    ];
                }),
            'favorites_by_list' => Favorite::whereIn('property_id', $propertyIds)
                ->select('list_name', DB::raw('count(*) as total'))
                ->groupBy('list_name')
                ->get(),
        ];
        
        return response()->json([
            'success' => true,
            'data' => $favorites,
            'stats' => $stats,
        ]);
    }

    /**
     * Get favorites grouped by property
     */
    public function getGroupedByProperty(Request $request)
    {
        $user = $request->user();
        
        $propertyIds = Property::where('user_id', $user->id)->pluck('id');
        
        $properties = Property::with(['favorites.user', 'coverPhoto'])
            ->whereIn('id', $propertyIds)
            ->withCount('favorites')
            ->orderBy('favorites_count', 'desc')
            ->get()
            ->map(function($property) {
                return [
                    'id' => $property->id,
                    'title' => $property->title,
                    'city' => $property->city,
                    'district' => $property->district,
                    'cover_photo' => $property->coverPhoto?->photo_url,
                    'favorites_count' => $property->favorites_count,
                    'favorites' => $property->favorites->map(function($favorite) {
                        return [
                            'id' => $favorite->id,
                            'user_id' => $favorite->user_id,
                            'user_name' => $favorite->user->full_name,
                            'user_photo' => $favorite->user->profile_photo_url,
                            'user_phone' => $favorite->user->phone,
                            'list_name' => $favorite->list_name,
                            'notes' => $favorite->notes,
                            'created_at' => $favorite->created_at->format('d/m/Y H:i'),
                        ];
                    }),
                ];
            });
        
        return response()->json([
            'success' => true,
            'data' => $properties,
            'total_properties' => $properties->count(),
            'total_favorites' => $properties->sum('favorites_count'),
        ]);
    }

    /**
     * Get travelers who favorited a specific property
     */
    public function getPropertyFavorites(Request $request, $propertyId)
    {
        $user = $request->user();
        
        // Verify host owns the property
        $property = Property::where('user_id', $user->id)
            ->findOrFail($propertyId);
        
        $favorites = Favorite::with(['user'])
            ->where('property_id', $propertyId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($favorite) {
                return [
                    'id' => $favorite->id,
                    'traveler' => [
                        'id' => $favorite->user->id,
                        'name' => $favorite->user->full_name,
                        'photo' => $favorite->user->profile_photo_url,
                        'phone' => $favorite->user->phone,
                        'email' => $favorite->user->email,
                        'member_since' => $favorite->user->created_at->format('d/m/Y'),
                    ],
                    'list_name' => $favorite->list_name,
                    'notes' => $favorite->notes,
                    'favorited_at' => $favorite->created_at->format('d/m/Y H:i'),
                ];
            });
        
        return response()->json([
            'success' => true,
            'data' => [
                'property' => [
                    'id' => $property->id,
                    'title' => $property->title,
                    'city' => $property->city,
                    'district' => $property->district,
                ],
                'favorites' => $favorites,
                'total' => $favorites->count(),
            ],
        ]);
    }

    /**
     * Get favorite statistics for host dashboard
     */
    public function getStatistics(Request $request)
    {
        $user = $request->user();
        
        $propertyIds = Property::where('user_id', $user->id)->pluck('id');
        
        $stats = [
            'total_favorites' => Favorite::whereIn('property_id', $propertyIds)->count(),
            'total_properties_with_favorites' => Favorite::whereIn('property_id', $propertyIds)
                ->distinct('property_id')
                ->count('property_id'),
            'unique_travelers' => Favorite::whereIn('property_id', $propertyIds)
                ->distinct('user_id')
                ->count('user_id'),
            'favorites_last_30_days' => Favorite::whereIn('property_id', $propertyIds)
                ->where('created_at', '>=', now()->subDays(30))
                ->count(),
            'favorites_last_7_days' => Favorite::whereIn('property_id', $propertyIds)
                ->where('created_at', '>=', now()->subDays(7))
                ->count(),
            'favorites_today' => Favorite::whereIn('property_id', $propertyIds)
                ->whereDate('created_at', today())
                ->count(),
        ];
        
        // Get weekly trend
        $weeklyTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $count = Favorite::whereIn('property_id', $propertyIds)
                ->whereDate('created_at', $date)
                ->count();
            $weeklyTrend[] = [
                'date' => $date->format('d/m'),
                'day' => $date->format('D'),
                'count' => $count,
            ];
        }
        
        $stats['weekly_trend'] = $weeklyTrend;
        
        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Export favorites to CSV
     */
    public function exportFavorites(Request $request)
    {
        $user = $request->user();
        
        $propertyIds = Property::where('user_id', $user->id)->pluck('id');
        
        $favorites = Favorite::with(['user', 'property'])
            ->whereIn('property_id', $propertyIds)
            ->orderBy('created_at', 'desc')
            ->get();
        
        $csvFileName = 'favorites_export_' . date('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $csvFileName . '"',
        ];
        
        $callback = function() use ($favorites) {
            $file = fopen('php://output', 'w');
            
            // Add headers
            fputcsv($file, [
                'ID',
                'Propriété',
                'Ville',
                'Quartier',
                'Voyageur',
                'Téléphone',
                'Email',
                'Liste',
                'Notes',
                'Date d\'ajout'
            ]);
            
            // Add data
            foreach ($favorites as $favorite) {
                fputcsv($file, [
                    $favorite->id,
                    $favorite->property->title,
                    $favorite->property->city,
                    $favorite->property->district,
                    $favorite->user->full_name,
                    $favorite->user->phone,
                    $favorite->user->email,
                    $favorite->list_name,
                    $favorite->notes,
                    $favorite->created_at->format('d/m/Y H:i'),
                ]);
            }
            
            fclose($file);
        };
        
        return response()->stream($callback, 200, $headers);
    }
}