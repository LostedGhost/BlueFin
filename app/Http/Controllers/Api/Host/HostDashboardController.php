<?php

namespace App\Http\Controllers\Api\Host;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\PropertyPhoto;
use App\Models\Availability;
use App\Models\PropertyView;
use App\Events\PropertySubmittedForApproval;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class HostDashboardController extends Controller
{
    /**
     * Get all properties for the host
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $properties = Property::with(['photos', 'coverPhoto'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10);
        
        // Add statistics for each property
        $properties->getCollection()->transform(function($property) {
            $property->stats = [
                'views_today' => PropertyView::where('property_id', $property->id)
                    ->whereDate('view_date', today())
                    ->count(),
                'views_this_month' => PropertyView::where('property_id', $property->id)
                    ->whereMonth('view_date', now()->month)
                    ->count(),
                'bookings_count' => $property->bookings()->where('booking_status', 'confirmed')->count(),
                'pending_bookings' => $property->bookings()->where('booking_status', 'pending')->count(),
                'total_revenue' => number_format($property->total_revenue, 0, ',', ' '),
            ];
            
            $property->status_label = $this->getStatusLabel($property->status);
            $property->status_color = $this->getStatusColor($property->status);
            $property->price_formatted = number_format($property->price_per_night, 0, ',', ' ');
            
            return $property;
        });
        
        // Statistics
        $stats = [
            'total' => Property::where('user_id', $user->id)->count(),
            'active' => Property::where('user_id', $user->id)->where('status', 'active')->count(),
            'pending' => Property::where('user_id', $user->id)->where('status', 'pending')->count(),
            'draft' => Property::where('user_id', $user->id)->where('status', 'draft')->count(),
            'rejected' => Property::where('user_id', $user->id)->where('status', 'rejected')->count(),
        ];
        
        return response()->json([
            'success' => true,
            'data' => $properties,
            'stats' => $stats,
        ]);
    }

    /**
     * Create a new property (draft)
     */
    public function store(Request $request)
    {
        $user = $request->user();
        
        // Check if host is verified
        if ($user->verification_status !== 'verified') {
            return response()->json([
                'success' => false,
                'message' => 'Vous devez vérifier votre identité avant de publier une annonce.',
                'verification_required' => true,
                'verification_status' => $user->verification_status,
            ], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string|min:50',
            'property_type' => 'required|in:appartement,chambre_habitant,villa,hotel,motel,auberge,maison_hotes,ecolodge,residence_hoteliere,immeuble_entier',
            'city' => 'required|string',
            'district' => 'required|string',
            'address' => 'nullable|string',
            'bedrooms' => 'required|integer|min:0',
            'beds' => 'required|integer|min:1',
            'bathrooms' => 'required|integer|min:1',
            'max_guests' => 'required|integer|min:1',
            'price_per_night' => 'required|numeric|min:5000',
            'cleaning_fee' => 'nullable|numeric|min:0',
            'min_stay' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();

        try {
            $property = Property::create(array_merge(
                $request->except(['photos']),
                [
                    'user_id' => $user->id,
                    'slug' => Str::slug($request->title . '-' . uniqid()),
                    'status' => 'draft',
                    'requires_review' => true,
                ]
            ));

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Brouillon créé avec succès. Complétez les informations et soumettez pour validation.',
                'data' => $property,
                'next_steps' => [
                    'add_photos' => true,
                    'add_amenities' => true,
                    'set_availability' => true,
                    'submit_for_review' => true,
                ],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get property details for editing
     */
    public function show(Request $request, $id)
    {
        $property = Property::with(['photos', 'availability' => function($q) {
                $q->where('date', '>=', now())->orderBy('date')->limit(90);
            }])
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);
        
        $property->price_formatted = number_format($property->price_per_night, 0, ',', ' ');
        $property->cleaning_fee_formatted = number_format($property->cleaning_fee, 0, ',', ' ');
        
        // Check completion status
        $completion = $this->getCompletionStatus($property);
        
        return response()->json([
            'success' => true,
            'data' => $property,
            'completion' => $completion,
            'can_submit' => $completion['percentage'] === 100 && $property->photos()->count() >= 3,
            'missing_fields' => $completion['missing'],
        ]);
    }

    /**
     * Update property
     */
    public function update(Request $request, $id)
    {
        $property = Property::where('user_id', $request->user()->id)
            ->findOrFail($id);
        
        // Don't allow editing if already submitted and pending
        if ($property->status === 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Cette annonce est déjà en cours de validation. Vous ne pouvez pas la modifier pour le moment.',
            ], 422);
        }
        
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string|min:50',
            'price_per_night' => 'sometimes|numeric|min:5000',
            'city' => 'sometimes|string',
            'district' => 'sometimes|string',
            'bedrooms' => 'sometimes|integer|min:0',
            'beds' => 'sometimes|integer|min:1',
            'bathrooms' => 'sometimes|integer|min:1',
            'max_guests' => 'sometimes|integer|min:1',
            'property_type' => 'sometimes|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $property->update($request->all());
        
        // Reset status to draft if it was rejected
        if ($property->status === 'rejected') {
            $property->update(['status' => 'draft', 'requires_review' => true]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Propriété mise à jour avec succès',
            'data' => $property,
        ]);
    }

    /**
     * Add photos to property
     */
    public function addPhotos(Request $request, $id)
    {
        $property = Property::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'photos' => 'required|array|min:1|max:20',
            'photos.*' => 'image|mimes:jpeg,png,jpg|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $uploadedPhotos = [];
        $currentOrder = $property->photos()->max('order') + 1;

        foreach ($request->file('photos') as $index => $photo) {
            $path = $photo->store('properties/' . $property->id, 'public');
            
            $propertyPhoto = PropertyPhoto::create([
                'property_id' => $property->id,
                'photo_path' => $path,
                'photo_url' => Storage::url($path),
                'order' => $currentOrder + $index,
                'is_cover' => $property->photos()->count() === 0 && $index === 0,
            ]);
            
            $uploadedPhotos[] = $propertyPhoto;
        }

        return response()->json([
            'success' => true,
            'message' => 'Photos ajoutées avec succès',
            'data' => $uploadedPhotos,
            'photos_count' => $property->photos()->count(),
            'minimum_photos_met' => $property->photos()->count() >= 3,
        ]);
    }

    /**
     * Delete photo
     */
    public function deletePhoto(Request $request, $propertyId, $photoId)
    {
        $property = Property::where('user_id', $request->user()->id)->findOrFail($propertyId);
        $photo = $property->photos()->findOrFail($photoId);
        
        Storage::disk('public')->delete($photo->photo_path);
        $photo->delete();

        // If deleted photo was cover, set new cover
        if ($photo->is_cover && $property->photos()->exists()) {
            $newCover = $property->photos()->first();
            $newCover->update(['is_cover' => true]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Photo supprimée',
        ]);
    }

    /**
     * Set cover photo
     */
    public function setCoverPhoto(Request $request, $propertyId, $photoId)
    {
        $property = Property::where('user_id', $request->user()->id)->findOrFail($propertyId);
        
        // Remove current cover
        $property->photos()->update(['is_cover' => false]);
        
        // Set new cover
        $photo = $property->photos()->findOrFail($photoId);
        $photo->update(['is_cover' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Photo de couverture mise à jour',
        ]);
    }

    /**
     * Update amenities
     */
    public function updateAmenities(Request $request, $id)
    {
        $property = Property::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $amenityFields = [
            'has_generator', 'has_water_tank', 'has_air_conditioning', 'has_wifi',
            'has_parking', 'has_pool', 'has_kitchen', 'has_tv', 'has_security_guard',
            'has_breakfast', 'has_restaurant', 'has_bar', 'has_gym', 'has_spa',
            'has_elevator', 'has_laundry', 'has_cctv', 'wheelchair_accessible',
            'allows_pets', 'allows_smoking', 'allows_children',
            'airport_shuttle', 'housekeeping', 'instant_booking', 'self_checkin',
        ];

        $data = $request->only($amenityFields);
        
        $property->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Équipements mis à jour',
            'data' => $property->amenities_list,
        ]);
    }

    /**
     * Submit property for admin review
     */
    public function submitForReview(Request $request, $id)
    {
        $property = Property::where('user_id', $request->user()->id)
            ->findOrFail($id);
        
        // Check if property is complete
        $completion = $this->getCompletionStatus($property);
        
        if ($completion['percentage'] < 100) {
            return response()->json([
                'success' => false,
                'message' => 'Veuillez compléter tous les champs requis avant soumission.',
                'missing_fields' => $completion['missing'],
                'completion_percentage' => $completion['percentage'],
            ], 422);
        }
        
        // Check minimum photos
        if ($property->photos()->count() < 3) {
            return response()->json([
                'success' => false,
                'message' => 'Vous devez ajouter au moins 3 photos.',
                'photos_count' => $property->photos()->count(),
                'photos_required' => 3,
            ], 422);
        }
        
        // Submit for review
        $property->update([
            'status' => 'pending',
            'requires_review' => true,
            'moderation_attempts' => $property->moderation_attempts + 1,
        ]);
        
        // Trigger event for admin notification
        event(new PropertySubmittedForApproval($property));
        
        // Notify host
        $this->notifyHostSubmission($property);
        
        return response()->json([
            'success' => true,
            'message' => 'Votre annonce a été soumise pour validation. Notre équipe l\'examinera dans les 24-48h.',
            'status' => $property->status,
            'estimated_time' => '24-48 heures',
        ]);
    }

    /**
     * Delete property (draft only)
     */
    public function destroy(Request $request, $id)
    {
        $property = Property::where('user_id', $request->user()->id)
            ->whereIn('status', ['draft', 'rejected'])
            ->findOrFail($id);
        
        // Delete photos
        foreach ($property->photos as $photo) {
            Storage::disk('public')->delete($photo->photo_path);
            $photo->delete();
        }
        
        // Delete availability
        $property->availability()->delete();
        
        $property->delete();

        return response()->json([
            'success' => true,
            'message' => 'Propriété supprimée',
        ]);
    }

    /**
     * Get completion status of property
     */
    private function getCompletionStatus($property)
    {
        $requiredFields = [
            'title' => 'Titre',
            'description' => 'Description',
            'property_type' => 'Type de propriété',
            'city' => 'Ville',
            'district' => 'Quartier',
            'bedrooms' => 'Nombre de chambres',
            'beds' => 'Nombre de lits',
            'bathrooms' => 'Nombre de salles de bain',
            'max_guests' => 'Nombre maximum de voyageurs',
            'price_per_night' => 'Prix par nuit',
        ];
        
        $completed = 0;
        $missing = [];
        
        foreach ($requiredFields as $field => $label) {
            if (!empty($property->$field)) {
                $completed++;
            } else {
                $missing[] = $label;
            }
        }
        
        $percentage = round(($completed / count($requiredFields)) * 100);
        
        return [
            'percentage' => $percentage,
            'completed' => $completed,
            'total' => count($requiredFields),
            'missing' => $missing,
        ];
    }

    private function getStatusLabel($status)
    {
        $labels = [
            'draft' => 'Brouillon',
            'pending' => 'En attente de validation',
            'active' => 'Publiée',
            'rejected' => 'Rejetée',
            'inactive' => 'Désactivée',
            'suspended' => 'Suspendue',
        ];
        return $labels[$status] ?? $status;
    }

    private function getStatusColor($status)
    {
        $colors = [
            'draft' => 'gray',
            'pending' => 'orange',
            'active' => 'green',
            'rejected' => 'red',
            'inactive' => 'gray',
            'suspended' => 'darkred',
        ];
        return $colors[$status] ?? 'gray';
    }

    private function notifyHostSubmission($property)
    {
        $this->notificationService->sendWhatsApp(
            $property->user->phone,
            "📋 *Annonce soumise pour validation* 📋\n\n"
            . "🏠 Titre: {$property->title}\n"
            . "📍 {$property->district}, {$property->city}\n"
            . "💰 Prix: " . number_format($property->price_per_night, 0, ',', ' ') . " FCFA/nuit\n\n"
            . "✅ Notre équipe examine votre annonce.\n"
            . "⏱ Délai estimé: 24-48 heures\n\n"
            . "Vous serez notifié dès qu'elle sera publiée!"
        );
    }
}