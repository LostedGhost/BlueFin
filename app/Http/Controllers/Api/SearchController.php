<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class SearchController extends Controller
{
    /**
     * Search properties with full-text search
     */
    public function search(Request $request)
    {
        $query = $request->get('q');
        $city = $request->get('city');
        $district = $request->get('district');
        
        $properties = Property::where('status', 'active')
            ->when($query, function($q) use ($query) {
                $q->where(function($sub) use ($query) {
                    $sub->where('title', 'like', "%{$query}%")
                        ->orWhere('description', 'like', "%{$query}%");
                });
            })
            ->when($city, function($q) use ($city) {
                $q->where('city', 'like', "%{$city}%");
            })
            ->when($district, function($q) use ($district) {
                $q->where('district', 'like', "%{$district}%");
            })
            ->with('coverPhoto')
            ->limit(20)
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $properties,
            'query' => $query,
        ]);
    }
    
    /**
     * Autocomplete search (for search bar)
     */
    public function autocomplete(Request $request)
    {
        $query = $request->get('q');
        
        if (strlen($query) < 2) {
            return response()->json(['success' => true, 'data' => []]);
        }
        
        // Search cities
        $cities = Property::where('status', 'active')
            ->where('city', 'like', "%{$query}%")
            ->distinct()
            ->limit(5)
            ->pluck('city');
        
        // Search districts
        $districts = Property::where('status', 'active')
            ->where('district', 'like', "%{$query}%")
            ->distinct()
            ->limit(5)
            ->pluck('district');
        
        // Search property titles
        $properties = Property::where('status', 'active')
            ->where('title', 'like', "%{$query}%")
            ->with('coverPhoto')
            ->limit(5)
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => [
                'cities' => $cities,
                'districts' => $districts,
                'properties' => $properties,
            ]
        ]);
    }
    
    /**
     * Get popular destinations
     */
    public function popularDestinations(Request $request)
    {
        $destinations = Property::where('status', 'active')
            ->select('city', DB::raw('COUNT(*) as count'))
            ->groupBy('city')
            ->orderBy('count', 'desc')
            ->limit(10)
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $destinations
        ]);
    }
    
    /**
     * Get popular districts in a city
     */
    public function popularDistricts(Request $request, $city)
    {
        $districts = Property::where('status', 'active')
            ->where('city', $city)
            ->select('district', DB::raw('COUNT(*) as count'))
            ->groupBy('district')
            ->orderBy('count', 'desc')
            ->limit(10)
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $districts
        ]);
    }
    
    /**
     * Advanced search with all filters
     */
    public function advancedSearch(Request $request)
    {
        $query = Property::where('status', 'active')
            ->with(['user', 'coverPhoto']);
        
        // Location filters
        if ($request->has('city')) {
            $query->where('city', 'like', "%{$request->city}%");
        }
        
        if ($request->has('district')) {
            $query->where('district', 'like', "%{$request->district}%");
        }
        
        // Date filters
        if ($request->has('check_in') && $request->has('check_out')) {
            $checkIn = $request->check_in;
            $checkOut = $request->check_out;
            
            $query->whereDoesntHave('bookings', function($q) use ($checkIn, $checkOut) {
                $q->where('booking_status', 'confirmed')
                  ->where(function($q) use ($checkIn, $checkOut) {
                      $q->whereBetween('check_in', [$checkIn, $checkOut])
                        ->orWhereBetween('check_out', [$checkIn, $checkOut])
                        ->orWhere(function($q) use ($checkIn, $checkOut) {
                            $q->where('check_in', '<=', $checkIn)
                              ->where('check_out', '>=', $checkOut);
                        });
                  });
            });
        }
        
        // Guest count
        if ($request->has('guests')) {
            $query->where('max_guests', '>=', (int)$request->guests);
        }
        
        // Bedrooms
        if ($request->has('bedrooms')) {
            $query->where('bedrooms', '>=', (int)$request->bedrooms);
        }
        
        // Price range
        if ($request->has('min_price')) {
            $query->where('price_per_night', '>=', (int)$request->min_price);
        }
        
        if ($request->has('max_price')) {
            $query->where('price_per_night', '<=', (int)$request->max_price);
        }
        
        // Property type
        if ($request->has('property_type')) {
            $types = explode(',', $request->property_type);
            $query->whereIn('property_type', $types);
        }
        
        // Amenities
        $amenityFields = ['wifi', 'air_conditioning', 'generator', 'water_tank', 'parking', 'pool', 'kitchen', 'tv'];
        foreach ($amenityFields as $amenity) {
            if ($request->has("has_{$amenity}")) {
                $query->where("has_{$amenity}", true);
            }
        }
        
        // Certifications
        if ($request->has('bluefin_certified')) {
            $query->where('bluefin_certified', true);
        }
        
        // Instant booking
        if ($request->has('instant_booking')) {
            $query->where('instant_booking', true);
        }
        
        // Minimum rating
        if ($request->has('min_rating')) {
            $query->where('average_rating', '>=', (float)$request->min_rating);
        }
        
        // Sort
        $sortBy = $request->get('sort_by', 'recommended');
        switch ($sortBy) {
            case 'price_asc':
                $query->orderBy('price_per_night', 'asc');
                break;
            case 'price_desc':
                $query->orderBy('price_per_night', 'desc');
                break;
            case 'rating_desc':
                $query->orderBy('average_rating', 'desc');
                break;
            case 'newest':
                $query->orderBy('created_at', 'desc');
                break;
            default:
                $query->orderByRaw('bluefin_certified DESC, average_rating DESC');
        }
        
        $perPage = $request->get('per_page', 20);
        $results = $query->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => $results,
            'filters_used' => $request->all(),
        ]);
    }
    
    /**
     * Map search (returns simplified data for map display)
     */
    public function mapSearch(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ne_lat' => 'required|numeric|between:-90,90',
            'ne_lng' => 'required|numeric|between:-180,180',
            'sw_lat' => 'required|numeric|between:-90,90',
            'sw_lng' => 'required|numeric|between:-180,180',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $properties = Property::where('status', 'active')
            ->whereBetween('latitude', [$request->sw_lat, $request->ne_lat])
            ->whereBetween('longitude', [$request->sw_lng, $request->ne_lng])
            ->select('id', 'title', 'latitude', 'longitude', 'price_per_night', 'average_rating', 'bluefin_certified')
            ->with('coverPhoto')
            ->limit(200)
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $properties,
            'bounds' => [
                'ne' => ['lat' => $request->ne_lat, 'lng' => $request->ne_lng],
                'sw' => ['lat' => $request->sw_lat, 'lng' => $request->sw_lng],
            ]
        ]);
    }
}