<?php

namespace App\Http\Controllers\Api\Host;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\PropertyPhoto;
use App\Models\Availability;
use App\Models\PropertyStat;
use App\Models\PropertyView;
use App\Services\NotificationService;
use App\Events\PropertySubmittedForApproval;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class HostPropertyController extends Controller
{
    /**
     * Get all properties for the host
     */
    public function index(Request $request)
    {
        $properties = Property::with(['photos', 'bookings' => function($q) {
                $q->where('booking_status', 'confirmed')
                  ->where('check_in', '>=', now());
            }])
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10);
        
        // Add statistics for each property
        foreach ($properties as $property) {
            $property->stats = [
                'views_today' => PropertyView::where('property_id', $property->id)
                    ->whereDate('view_date', today())
                    ->count(),
                'views_this_week' => PropertyView::where('property_id', $property->id)
                    ->where('view_date', '>=', now()->startOfWeek())
                    ->count(),
                'views_this_month' => PropertyView::where('property_id', $property->id)
                    ->where('view_date', '>=', now()->startOfMonth())
                    ->count(),
                'bookings_count' => $property->bookings()->where('booking_status', 'confirmed')->count(),
                'pending_approval' => $property->status === 'pending',
            ];
            
            $property->status_label = $this->getStatusLabel($property->status);
            $property->status_color = $this->getStatusColor($property->status);
        }
        
        return response()->json([
            'success' => true,
            'data' => $properties,
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
            'cleaning_fee' => 'numeric|min:0',
            'min_stay' => 'integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();

        try {
            // ⚠️ $request->except(['photos']) laissait passer tout champ
            // additionnel (bluefin_certified, is_hotel_promoted, superhost,
            // average_rating...) au-delà des champs validés ci-dessus.
            // Create property as draft
            $property = Property::create(array_merge(
                $validator->validated(),
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
        
        return response()->json([
            'success' => true,
            'data' => $property,
            'can_submit' => $this->canSubmitForReview($property),
            'missing_fields' => $this->getMissingFields($property),
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
            'description' => 'sometimes|string|min:50|max:10000',
            'price_per_night' => 'sometimes|numeric|min:5000|max:100000000',
            'city' => 'sometimes|string|max:100',
            'district' => 'sometimes|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // ⚠️ update($request->all()) laissait passer n'importe quel champ du
        // modèle (status, is_hotel_promoted, bluefin_certified, user_id, ...) —
        // seuls les champs réellement validés ci-dessus doivent être appliqués.
        $property->update($validator->validated());

        // Reset status to draft if it was rejected
        if ($property->status === 'rejected') {
            $property->update(['status' => 'draft', 'requires_review' => true]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Propriété mise à jour',
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
            'photos' => 'required|array|min:3|max:20',
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
     * Update amenities
     */
    // app/Http/Controllers/Api/Host/HostPropertyController.php

/**
 * Update amenities
 */
public function updateAmenities(Request $request, $id)
{
    $property = Property::where('user_id', $request->user()->id)
        ->findOrFail($id);

    // ✅ Tous les champs d'équipements
    $amenityFields = [
        // Équipements existants
        'has_generator', 'has_water_tank', 'has_air_conditioning', 'has_wifi',
        'has_parking', 'has_pool', 'has_kitchen', 'has_tv', 'has_security_guard',
        'has_breakfast', 'has_restaurant', 'has_bar', 'has_gym', 'has_spa',
        'has_elevator', 'has_ev_charging', 'has_laundry', 'has_cctv', 'has_electric_fence',
        
        // Salle de bain
        'has_towels', 'has_toiletries', 'has_hair_dryer', 'has_hot_water',
        'has_bathtub', 'has_shower',
        
        // Chambre et linge
        'has_bed_linen', 'has_pillows', 'has_blankets', 'has_hangers',
        'has_closet', 'has_iron',
        
        // Cuisine et équipements
        'has_basic_kitchen_equipment', 'has_dishes_cutlery', 'has_coffee_maker',
        'has_kettle', 'has_oven', 'has_microwave', 'has_freezer',
        'has_refrigerator', 'has_dining_table', 'has_wine_glasses',
        'has_toaster', 'has_blender',
        
        // Divertissement
        'has_smart_tv', 'has_streaming', 'has_bluetooth_speaker', 'has_books',
        
        // Sécurité
        'has_smoke_detector', 'has_first_aid_kit', 'has_fire_extinguisher',
        
        // Services
        'has_ironing_service', 'has_free_parking', 'has_luggage_storage',
        
        // Extérieur
        'has_balcony', 'has_garden', 'has_bbq', 'has_loungers',
    ];

    $validator = Validator::make($request->all(), array_fill_keys($amenityFields, 'sometimes|boolean'));
    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    $data = $validator->validated();

    $property->update($data);

    return response()->json([
        'success' => true,
        'message' => 'Équipements mis à jour',
        'data' => $property->amenities_list,
    ]);
}

    /**
     * Set availability calendar
     */
    public function setAvailability(Request $request, $id)
    {
        $property = Property::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'availability' => 'required|array',
            'availability.*.date' => 'required|date',
            'availability.*.is_available' => 'required|boolean',
            'availability.*.special_price' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        foreach ($request->availability as $item) {
            Availability::updateOrCreate(
                [
                    'property_id' => $property->id,
                    'date' => $item['date'],
                ],
                [
                    'is_available' => $item['is_available'],
                    'special_price' => $item['special_price'] ?? null,
                    'status' => $item['is_available'] ? 'available' : 'blocked',
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Calendrier mis à jour',
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
        $missingFields = $this->getMissingFields($property);
        
        if (!empty($missingFields)) {
            return response()->json([
                'success' => false,
                'message' => 'Veuillez compléter tous les champs requis avant soumission.',
                'missing_fields' => $missingFields,
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
        
        $property->delete();

        return response()->json([
            'success' => true,
            'message' => 'Propriété supprimée',
        ]);
    }

    /**
     * Check if property can be submitted for review
     */
    private function canSubmitForReview($property)
    {
        return empty($this->getMissingFields($property)) 
            && $property->photos()->count() >= 3
            && in_array($property->status, ['draft', 'rejected']);
    }

    /**
     * Get missing required fields
     */
    private function getMissingFields($property)
    {
        $required = [
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
        
        $missing = [];
        foreach ($required as $field => $label) {
            if (empty($property->$field)) {
                $missing[] = $label;
            }
        }
        
        return $missing;
    } 

    private function getStatusLabel($status)
    {
        return match($status) {
            'draft' => 'Brouillon',
            'pending' => 'En attente de validation',
            'active' => 'Publiée',
            'rejected' => 'Rejetée',
            'inactive' => 'Désactivée',
            default => $status,
        };
    }

    private function getStatusColor($status)
    {
        return match($status) {
            'draft' => 'gray',
            'pending' => 'orange',
            'active' => 'green',
            'rejected' => 'red',
            'inactive' => 'gray',
            default => 'gray',
        };
    }

    private function notifyHostSubmission($property)
    {
        $this->notificationService->sendWhatsApp(
            $property->user->phone,
            "📋 *Annonce soumise pour validation*\n\n"
            . "Titre: {$property->title}\n"
            . "Type: {$property->property_type}\n"
            . "📍 {$property->district}, {$property->city}\n\n"
            . "Notre équipe examine votre annonce.\n"
            . "Vous serez notifié dès qu'elle sera publiée.\n\n"
            . "⏱ Délai estimé: 24-48h"
        );
    }

    protected $notificationService;

public function __construct(NotificationService $notificationService)
{
    $this->notificationService = $notificationService;
}
}