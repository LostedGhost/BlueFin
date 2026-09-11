<?php

namespace App\Http\Controllers\Api;

use App\Services\PhotoStorage;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\PropertyPhoto;
use App\Events\PropertySubmittedForApproval;
use App\Models\Availability;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PropertyController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * List properties with filters
     */
    public function index(Request $request)
    {
        $query = Property::with(['user', 'coverPhoto', 'photos'])
            ->where('status', 'active');

        // Search by destination (city or district)
        if ($request->has('destination') && $request->destination) {
            $query->where(function($q) use ($request) {
                $q->where('city', 'like', "%{$request->destination}%")
                  ->orWhere('district', 'like', "%{$request->destination}%");
            });
        }

        // ✅ Filtrer par hôtels promus
        if ($request->has('is_hotel_promoted') && $request->is_hotel_promoted) {
            $query->where('is_hotel_promoted', true);
        }

        // ✅ Filtrer par propriétés à la une
        if ($request->has('is_featured') && $request->is_featured) {
            $query->where('is_featured', true);
        }

        // Filter by dates
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

        // Filter by guests
        if ($request->has('guests')) {
            $query->where('max_guests', '>=', (int)$request->guests);
        }

        // Filter by bedrooms
        if ($request->has('bedrooms')) {
            $query->where('bedrooms', '>=', (int)$request->bedrooms);
        }

        // Filter by price range
        if ($request->has('min_price')) {
            $query->where('price_per_night', '>=', (int)$request->min_price);
        }
        if ($request->has('max_price')) {
            $query->where('price_per_night', '<=', (int)$request->max_price);
        }

        // Filter by property type
        if ($request->has('property_type')) {
            $types = explode(',', $request->property_type);
            $query->whereIn('property_type', $types);
        }

        // Filter by amenities
        $amenityFields = ['wifi', 'air_conditioning', 'generator', 'water_tank', 'parking', 'pool', 'kitchen', 'tv', 'security_guard', 'breakfast'];
        foreach ($amenityFields as $amenity) {
            if ($request->has("has_{$amenity}") && $request->{"has_{$amenity}"}) {
                $query->where("has_{$amenity}", true);
            }
        }

        // Filter by certifications
        if ($request->has('bluefin_certified')) {
            $query->where('bluefin_certified', true);
        }

        if ($request->has('superhost')) {
            $query->where('superhost', true);
        }

        // Filter by instant booking
        if ($request->has('instant_booking')) {
            $query->where('instant_booking', true);
        }

        // Filter by rating
        if ($request->has('min_rating')) {
            $query->where('average_rating', '>=', (float)$request->min_rating);
        }

        // Sort results
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
            case 'popular':
                $query->orderBy('views_count', 'desc');
                break;
            default:
                $query->orderByRaw('bluefin_certified DESC, average_rating DESC');
        }

        $perPage = $request->get('per_page', 20);
        $properties = $query->paginate($perPage);

        // Add price conversions
        $properties->getCollection()->transform(function($property) {
            $property->price_per_night_eur = $property->price_per_night_in_euro;
            $property->price_per_night_usd = $property->price_per_night_in_usd;
            return $property;
        });

        return response()->json([
            'success' => true,
            'data' => $properties,
            'filters' => $request->all(),
        ]);
    }

    /**
     * Create a new property listing
     */
    public function store(Request $request)
    {
        // ⚠️ Cette route (générique, group auth:sanctum) n'exigeait aucun rôle
        // hôte ni vérification d'identité — contrairement à
        // HostPropertyController::store — un simple voyageur pouvait publier
        // une annonce en la contournant.
        if ($request->user()->user_type !== 'hote' || $request->user()->verification_status !== 'verified') {
            return response()->json([
                'success' => false,
                'message' => 'Vous devez être un hôte vérifié pour publier une annonce.',
                'verification_required' => true,
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'property_type' => 'required|in:appartement,chambre_habitant,villa,hotel,motel,auberge,maison_hotes,ecolodge,residence_hoteliere,immeuble_entier',
            'city' => 'required|string',
            'district' => 'required|string',
            'address' => 'nullable|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'bedrooms' => 'required|integer|min:0',
            'beds' => 'required|integer|min:1',
            'bathrooms' => 'required|integer|min:1',
            'max_guests' => 'required|integer|min:1',
            'price_per_night' => 'required|numeric|min:0',
            'cleaning_fee' => 'nullable|numeric|min:0',
            'min_stay' => 'integer|min:1',
            'cancellation_policy' => 'in:flexible,moderate,strict,non_refundable',
            'instant_booking' => 'boolean',
            'photos' => 'required|array|min:3',
            'photos.*' => 'image|mimes:jpeg,png,jpg|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();

        try {
            // ⚠️ $request->except('photos') laissait passer tout champ
            // additionnel du payload (ex. status, bluefin_certified,
            // is_hotel_promoted, average_rating...) au-delà de ceux validés.
            $data = $validator->validated();
            unset($data['photos']);
            if (!isset($data['cleaning_fee'])) {
                $data['cleaning_fee'] = 0;
            }
            
            $property = Property::create(array_merge(
                $data,
                [
                    'user_id' => $request->user()->id,
                    'status' => 'pending'
                ]
            ));

            // Upload photos
            foreach ($request->file('photos') as $index => $photo) {
                $stored = app(PhotoStorage::class)->upload($photo, 'properties/' . $property->id);
                
                PropertyPhoto::create([
                    'property_id' => $property->id,
                    'photo_path' => $stored['path'],
                    'photo_url' => $stored['url'],
                    'order' => $index,
                    'is_cover' => $index === 0,
                ]);
            }

            // Create availability for next 12 months
            $this->createAvailability($property);

            event(new PropertySubmittedForApproval($property));
            
            DB::commit();

            // Notify admin for approval
            $this->notifyAdminNewProperty($property);

            return response()->json([
                'success' => true,
                'message' => 'Propriété créée avec succès. En attente de vérification.',
                'data' => $property->load('photos'),
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
     * Get property details
     */
    public function show($id)
    {
        try {
            \Log::info('=== SHOW PROPERTY ===', ['id' => $id]);
            
            $property = Property::with([
                'user',
                'reviews' => function($q) {
                    $q->where('is_approved', true)->latest()->limit(10);
                },
                'photos',
                'coverPhoto'
            ])->findOrFail($id);
            
            \Log::info('Property found', [
                'title' => $property->title,
                'photos_count' => $property->photos->count()
            ]);
            
            foreach ($property->photos as $photo) {
                $photo->full_url = $photo->full_url;
            }
            
            $property->incrementViews();
            $property->average_rating = $property->reviews()->where('is_approved', true)->avg('rating') ?? 0;
            $property->price_per_night_eur = $property->price_per_night_in_euro;
            $property->price_per_night_usd = $property->price_per_night_in_usd;
            
            $similar = Property::where('city', $property->city)
                ->where('id', '!=', $property->id)
                ->where('status', 'active')
                ->with('coverPhoto')
                ->limit(6)
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $property,
                'similar' => $similar,
            ]);
            
        } catch (\Exception $e) {
            \Log::error('SHOW PROPERTY ERROR: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update property
     */
    public function update(Request $request, $id)
    {
        // ⚠️ La condition précédente (orWhereHas sur le propriétaire admin) ne
        // référençait jamais l'utilisateur courant : elle rendait modifiable par
        // N'IMPORTE QUEL utilisateur authentifié toute propriété appartenant à un
        // compte admin. Seul le propriétaire lui-même, ou un requérant admin,
        // doit pouvoir passer cette route.
        $requester = $request->user();
        $query = Property::query();
        if ($requester->user_type !== 'admin') {
            $query->where('user_id', $requester->id);
        }
        $property = $query->findOrFail($id);

        // Un hôte ne doit jamais pouvoir s'auto-approuver, se certifier ou se
        // promouvoir en hôtel via cette route "édition" — seuls le statut de
        // base (draft/pending) et les champs de contenu sont modifiables ici ;
        // status=active, is_hotel_promoted, is_featured/bluefin_certified
        // restent réservés au workflow de modération admin.
        $allowedStatuses = $requester->user_type === 'admin'
            ? 'draft,pending,active,inactive,rejected,suspended'
            : 'draft,pending';

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string|max:10000',
            'price_per_night' => 'sometimes|numeric|min:5000|max:100000000',
            'cleaning_fee' => 'sometimes|numeric|min:0|max:1000000',
            'min_stay' => 'sometimes|integer|min:1|max:365',
            'status' => 'sometimes|in:' . $allowedStatuses,
            'has_generator' => 'sometimes|boolean',
            'has_water_tank' => 'sometimes|boolean',
            'has_air_conditioning' => 'sometimes|boolean',
            'has_wifi' => 'sometimes|boolean',
            'is_hotel_promoted' => 'sometimes|boolean',
            'is_featured' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        if ($requester->user_type !== 'admin') {
            unset($data['is_hotel_promoted'], $data['is_featured']);
        }

        $property->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Propriété mise à jour',
            'data' => $property
        ]);
    }

    /**
     * Delete property
     */
    public function destroy(Request $request, $id)
    {
        $property = Property::where('user_id', $request->user()->id)
            ->findOrFail($id);
        
        foreach ($property->photos as $photo) {
            if ($photo->photo_path && Storage::disk('public')->exists($photo->photo_path)) {
                Storage::disk('public')->delete($photo->photo_path);
            }
            $photo->delete();
        }
        
        $property->delete();

        return response()->json([
            'success' => true,
            'message' => 'Propriété supprimée'
        ]);
    }

    /**
     * Check property availability
     */
    public function checkAvailability(Request $request, $id)
    {
        $property = Property::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'check_in' => 'required|date|after_or_equal:today',
            'check_out' => 'required|date|after:check_in',
            'guests' => 'integer|min:1|max:' . $property->max_guests,
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $isAvailable = $property->isAvailable($request->check_in, $request->check_out);
        $priceDetails = $property->calculateTotalPrice(
            $request->check_in, 
            $request->check_out, 
            $request->get('guests', 1)
        );

        $unavailableDates = Availability::where('property_id', $property->id)
            ->whereBetween('date', [$request->check_in, $request->check_out])
            ->where('status', '!=', 'available')
            ->pluck('date')
            ->toArray();

        return response()->json([
            'success' => true,
            'available' => $isAvailable,
            'price_details' => $priceDetails,
            'unavailable_dates' => $unavailableDates,
            'property' => [
                'id' => $property->id,
                'title' => $property->title,
                'max_guests' => $property->max_guests,
            ]
        ]);
    }

    /**
     * Upload photos for property
     */
    public function uploadPhotos(Request $request, $id)
    {
        $property = Property::where('user_id', $request->user()->id)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'photos' => 'required|array',
            'photos.*' => 'image|mimes:jpeg,png,jpg|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $uploadedPhotos = [];
        $currentOrder = $property->photos()->max('order') + 1;

        foreach ($request->file('photos') as $index => $photo) {
            $stored = app(PhotoStorage::class)->upload($photo, 'properties/' . $property->id);
            
            $propertyPhoto = PropertyPhoto::create([
                'property_id' => $property->id,
                'photo_path' => $stored['path'],
                'photo_url' => $stored['url'],
                'order' => $currentOrder + $index,
                'is_cover' => $property->photos()->count() === 0 && $index === 0,
            ]);
            
            $uploadedPhotos[] = $propertyPhoto;
        }

        return response()->json([
            'success' => true,
            'message' => 'Photos ajoutées',
            'data' => $uploadedPhotos
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

        if ($photo->is_cover && $property->photos()->exists()) {
            $newCover = $property->photos()->first();
            $newCover->update(['is_cover' => true]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Photo supprimée'
        ]);
    }

    /**
     * Set cover photo
     */
    public function setCoverPhoto(Request $request, $propertyId, $photoId)
    {
        $property = Property::where('user_id', $request->user()->id)->findOrFail($propertyId);
        
        $property->photos()->update(['is_cover' => false]);
        
        $photo = $property->photos()->findOrFail($photoId);
        $photo->update(['is_cover' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Photo de couverture mise à jour'
        ]);
    }

    /**
     * Create availability for next months
     */
    private function createAvailability($property)
    {
        $startDate = now();
        $endDate = now()->addMonths(12);
        
        $dates = [];
        $currentDate = clone $startDate;
        
        while ($currentDate <= $endDate) {
            $dates[] = [
                'property_id' => $property->id,
                'date' => $currentDate->format('Y-m-d'),
                'is_available' => true,
                'status' => 'available',
                'created_at' => now(),
                'updated_at' => now(),
            ];
            $currentDate->addDay();
        }
        
        foreach (array_chunk($dates, 100) as $chunk) {
            Availability::insert($chunk);
        }
    }

    private function notifyAdminNewProperty($property)
    {
        $admins = \App\Models\User::where('user_type', 'admin')->get();
        
        foreach ($admins as $admin) {
            if ($admin->phone) {
                $this->notificationService->sendWhatsApp(
                    $admin->phone,
                    "🏠 Nouvelle propriété en attente de vérification\n\n"
                    . "Titre: {$property->title}\n"
                    . "Type: {$property->property_type}\n"
                    . "Ville: {$property->city}\n"
                    . "Hôte: {$property->user->full_name}\n\n"
                    . "Vérifiez dans le panel admin."
                );
            }
        }
    }
}