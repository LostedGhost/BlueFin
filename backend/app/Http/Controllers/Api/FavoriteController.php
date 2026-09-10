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
        $listName = $request->get('list_name', 'default');
        
        $favorites = Favorite::with('property', 'property.photos')
            ->where('user_id', $request->user()->id)
            ->where('list_name', $listName)
            ->orderBy('created_at', 'desc')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $favorites,
            'list_name' => $listName
        ]);
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