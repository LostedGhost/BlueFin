<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Favorite;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FavoriteController extends Controller
{
    /**
     * Get user's favorites
     */
    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'list_name' => 'nullable|string|max:255',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $listName = $request->get('list_name', 'default');

        // Réponse explicite, champ par champ : l'ancienne renvoyait l'annonce
        // complète (justificatifs, chiffre d'affaires, lien iCal privé…).
        // Même format pour voyageurs et hôtes (route commune).
        $favorites = Favorite::with(['property.coverPhoto'])
            ->where('user_id', $request->user()->id)
            ->where('list_name', $listName)
            ->orderBy('created_at', 'desc')
            ->get()
            ->filter(fn ($favorite) => $favorite->property !== null)
            ->map(fn ($favorite) => self::present($favorite))
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'current_list' => $listName,
                'favorites' => $favorites,
                'total' => $favorites->count(),
            ],
            'list_name' => $listName,
        ]);
    }

    /** Favori présenté pour l'application (aucun champ interne de l'annonce). */
    public static function present(Favorite $favorite): array
    {
        $property = $favorite->property;

        return [
            'id' => $favorite->id,
            'property' => [
                'id' => $property->id,
                'title' => $property->title,
                'city' => $property->city,
                'district' => $property->district,
                'property_type' => $property->property_type,
                'price_per_night' => (int) $property->price_per_night,
                'average_rating' => (float) ($property->average_rating ?? 0),
                'reviews_count' => (int) ($property->reviews_count ?? 0),
                'bluefin_certified' => (bool) ($property->bluefin_certified ?? false),
                'cover_photo' => $property->coverPhoto ? ['full_url' => $property->coverPhoto->full_url] : null,
            ],
            'notes' => $favorite->notes,
            'created_at' => $favorite->created_at?->toIso8601String(),
        ];
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
     * Toggle favorite (add/remove)
     */
    public function toggle(Request $request, $propertyId)
    {
        $validator = Validator::make($request->all(), [
            'list_name' => 'string|max:255',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $property = Property::findOrFail($propertyId);
        $listName = $request->get('list_name', 'default');
        
        $favorite = Favorite::where('user_id', $request->user()->id)
            ->where('property_id', $propertyId)
            ->where('list_name', $listName)
            ->first();
        
        if ($favorite) {
            $favorite->delete();
            return response()->json([
                'success' => true,
                'action' => 'removed',
                'message' => 'Retiré des favoris'
            ]);
        } else {
            Favorite::create([
                'user_id' => $request->user()->id,
                'property_id' => $propertyId,
                'list_name' => $listName,
            ]);
            
            return response()->json([
                'success' => true,
                'action' => 'added',
                'message' => 'Ajouté aux favoris'
            ], 201);
        }
    }
    
    /**
     * Check if property is favorited
     */
    public function check(Request $request, $propertyId)
    {
        Property::findOrFail($propertyId);

        $isFavorited = Favorite::where('user_id', $request->user()->id)
            ->where('property_id', $propertyId)
            ->exists();
        
        return response()->json([
            'success' => true,
            'is_favorited' => $isFavorited
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
        
        // Just check if name is valid, list is created when adding first property
        return response()->json([
            'success' => true,
            'message' => 'Liste créée',
            'list_name' => $request->list_name
        ]);
    }
    
    /**
     * Delete a favorite list
     */
    public function deleteList(Request $request, $listName)
    {
        // La liste 'default' ne doit jamais pouvoir être supprimée en bloc —
        // même garde-fou que TravelerFavoriteController::deleteList.
        if ($listName === 'default') {
            return response()->json([
                'success' => false,
                'message' => 'La liste par défaut ne peut pas être supprimée.',
            ], 422);
        }

        Favorite::where('user_id', $request->user()->id)
            ->where('list_name', $listName)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Liste supprimée'
        ]);
    }
    
    /**
     * Add note to favorite
     */
    public function addNote(Request $request, $favoriteId)
    {
        $validator = Validator::make($request->all(), [
            'notes' => 'string|max:500',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $favorite = Favorite::where('user_id', $request->user()->id)
            ->findOrFail($favoriteId);
        
        $favorite->update(['notes' => $request->notes]);
        
        return response()->json([
            'success' => true,
            'message' => 'Note ajoutée',
            'data' => $favorite
        ]);
    }
}