<?php

namespace App\Http\Controllers\Api\Traveler;

use App\Http\Controllers\Controller;
use App\Models\Favorite;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TravelerFavoriteController extends Controller
{
    /**
     * Get all favorites for the traveler
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $listName = $request->get('list_name', 'default');
        
        $favorites = Favorite::with(['property', 'property.photos', 'property.user'])
            ->where('user_id', $user->id)
            ->where('list_name', $listName)
            ->orderBy('created_at', 'desc')
            ->get()
            ->filter(function($favorite) {
                // ✅ Filtrer les favoris dont la propriété n'existe plus
                return $favorite->property !== null;
            })
            ->map(function($favorite) {
                $property = $favorite->property;
                
                // ✅ Vérification supplémentaire
                if (!$property) {
                    return null;
                }
                
                return [
                    'id' => $favorite->id,
                    'property' => [
                        'id' => $property->id,
                        'title' => $property->title,
                        'city' => $property->city,
                        'district' => $property->district,
                        'price_per_night' => number_format($property->price_per_night, 0, ',', ' '),
                        'average_rating' => $property->average_rating ?? 0,
                        'reviews_count' => $property->reviews_count ?? 0,
                        'photo' => $property->coverPhoto?->photo_url,
                        'instant_booking' => $property->instant_booking ?? false,
                        'bluefin_certified' => $property->bluefin_certified ?? false,
                        'has_generator' => $property->has_generator ?? false,
                        'has_wifi' => $property->has_wifi ?? false,
                        'has_air_conditioning' => $property->has_air_conditioning ?? false,
                    ],
                    'notes' => $favorite->notes,
                    'added_at' => $favorite->created_at->diffForHumans(),
                ];
            })
            ->filter(); // ✅ Supprimer les entrées null
        
        // Get all lists
        $lists = Favorite::where('user_id', $user->id)
            ->distinct()
            ->pluck('list_name');
        
        return response()->json([
            'success' => true,
            'data' => [
                'current_list' => $listName,
                'lists' => $lists,
                'favorites' => $favorites,
                'total' => $favorites->count(),
            ],
        ]);
    }

    /**
     * Toggle favorite (add/remove)
     */
    public function toggle(Request $request, $propertyId)
    {
        $user = $request->user();
        
        $validator = Validator::make($request->all(), [
            'list_name' => 'string|max:255',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // ✅ Vérifier que la propriété existe avant d'ajouter aux favoris
        $property = Property::find($propertyId);
        
        if (!$property) {
            return response()->json([
                'success' => false,
                'message' => 'La propriété n\'existe pas.',
            ], 404);
        }
        
        $listName = $request->get('list_name', 'default');
        
        $favorite = Favorite::where('user_id', $user->id)
            ->where('property_id', $propertyId)
            ->where('list_name', $listName)
            ->first();
        
        if ($favorite) {
            $favorite->delete();
            return response()->json([
                'success' => true,
                'action' => 'removed',
                'message' => 'Propriété retirée des favoris',
            ]);
        } else {
            Favorite::create([
                'user_id' => $user->id,
                'property_id' => $propertyId,
                'list_name' => $listName,
                'notes' => $request->notes,
            ]);
            
            return response()->json([
                'success' => true,
                'action' => 'added',
                'message' => 'Propriété ajoutée aux favoris',
            ], 201);
        }
    }

    /**
     * Get all favorite lists
     */
    public function getLists(Request $request)
    {
        $lists = Favorite::where('user_id', $request->user()->id)
            ->distinct()
            ->pluck('list_name');
            
        return response()->json([
            'success' => true,
            'data' => $lists
        ]);
    }

    /**
     * Check if property is favorited
     */
    public function check(Request $request, $propertyId)
    {
        $user = $request->user();
        
        // ✅ Vérifier que la propriété existe
        $property = Property::find($propertyId);
        
        if (!$property) {
            return response()->json([
                'success' => false,
                'is_favorited' => false,
                'message' => 'La propriété n\'existe pas.',
            ], 404);
        }
        
        $isFavorited = Favorite::where('user_id', $user->id)
            ->where('property_id', $propertyId)
            ->exists();
        
        return response()->json([
            'success' => true,
            'is_favorited' => $isFavorited,
        ]);
    }

    /**
     * Create a new favorite list
     */
    public function createList(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'list_name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Vérifier si la liste existe déjà pour cet utilisateur
        $existingList = Favorite::where('user_id', $request->user()->id)
            ->where('list_name', $request->list_name)
            ->exists();
        
        if ($existingList) {
            return response()->json([
                'success' => false,
                'message' => 'Une liste avec ce nom existe déjà.',
            ], 422);
        }
        
        // List is virtual - created when first favorite is added
        return response()->json([
            'success' => true,
            'message' => 'Liste créée',
            'list_name' => $request->list_name,
        ]);
    }

    /**
     * Delete a favorite list
     */
    public function deleteList(Request $request, $listName)
    {
        $user = $request->user();
        
        if ($listName === 'default') {
            return response()->json([
                'success' => false,
                'message' => 'La liste par défaut ne peut pas être supprimée',
            ], 422);
        }
        
        Favorite::where('user_id', $user->id)
            ->where('list_name', $listName)
            ->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Liste supprimée',
        ]);
    }

    /**
     * Move favorite to another list
     */
    public function moveToList(Request $request, $favoriteId)
    {
        $validator = Validator::make($request->all(), [
            'new_list_name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $user = $request->user();
        
        $favorite = Favorite::where('user_id', $user->id)
            ->findOrFail($favoriteId);
        
        $favorite->update([
            'list_name' => $request->new_list_name,
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Favori déplacé vers ' . $request->new_list_name,
        ]);
    }

    /**
     * Update notes for a favorite
     */
    public function updateNotes(Request $request, $favoriteId)
    {
        $validator = Validator::make($request->all(), [
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $user = $request->user();
        
        $favorite = Favorite::where('user_id', $user->id)
            ->findOrFail($favoriteId);
        
        $favorite->update([
            'notes' => $request->notes,
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Notes mises à jour',
            'notes' => $favorite->notes,
        ]);
    }
}