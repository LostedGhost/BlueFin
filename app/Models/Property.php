<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Scout\Searchable;

class Property extends Model
{
    use HasFactory, SoftDeletes, Searchable;

    protected $table = 'properties';

    protected $fillable = [
        // ==================== RELATIONS ====================
        'user_id',
        
        // ==================== INFORMATIONS DE BASE ====================
        'title', 'description', 'slug',
        
        // ==================== TYPE ====================
        'property_type',
        
        // ==================== LOCALISATION ====================
        'city', 'district', 'address', 'latitude', 'longitude', 'google_place_id',
        
        // ==================== CAPACITÉ ====================
        'bedrooms', 'beds', 'bathrooms', 'max_guests', 'min_stay', 'max_stay',
        
        // ==================== TARIFICATION ====================
        'price_per_night', 'weekly_discount', 'monthly_discount',
        'cleaning_fee', 'service_fee_percentage', 'security_deposit', 'extra_guest_fee',
        
        // ==================== POLITIQUES ====================
        'cancellation_policy', 'instant_booking', 'self_checkin',
        
        // ==================== ÉQUIPEMENTS EXISTANTS ====================
        'has_generator', 'has_water_tank', 'has_air_conditioning', 'has_wifi',
        'has_parking', 'has_pool', 'has_kitchen', 'has_tv', 'has_security_guard',
        'has_breakfast', 'has_restaurant', 'has_bar', 'has_gym', 'has_spa',
        'has_elevator', 'has_ev_charging', 'has_laundry', 'has_cctv', 'has_electric_fence',
        
        // ==================== SERVICES ====================
        'airport_shuttle', 'housekeeping', 'room_service',
        
        // ==================== ACCESSIBILITÉ ====================
        'wheelchair_accessible',
        
        // ==================== CERTIFICATIONS ====================
        'bluefin_certified', 'superhost', 'certified_at',
        
        // ==================== LANGUES ====================
        'host_languages',
        
        // ==================== RÈGLES ====================
        'allows_pets', 'allows_smoking', 'allows_parties', 'allows_children', 'house_rules',
        
        // ==================== DOCUMENTS ====================
        'property_document', 'insurance_certificate',
        
        // ==================== STATUT ====================
        'status',
        
        // ==================== MODÉRATION ====================
        'requires_review', 'moderated_by', 'moderated_at', 'moderation_notes',
        'rejection_reason', 'moderation_attempts',
        
        // ==================== STATISTIQUES ====================
        'views_count', 'bookings_count', 'favorites_count',
        'average_rating', 'reviews_count', 'total_revenue',
        
        // ==================== CALENDRIER ====================
        'seasonal_prices', 'blackout_dates', 'ical_url',
        
        // ==================== SEO ====================
        'meta_title', 'meta_description', 'meta_keywords',
        
        // ==================== NOUVEAUX ÉQUIPEMENTS - SALLE DE BAIN ====================
        'has_towels', 'has_toiletries', 'has_hair_dryer', 'has_hot_water',
        'has_bathtub', 'has_shower',
        
        // ==================== NOUVEAUX ÉQUIPEMENTS - CHAMBRE ET LINGE ====================
        'has_bed_linen', 'has_pillows', 'has_blankets', 'has_hangers',
        'has_closet', 'has_iron',
        
        // ==================== NOUVEAUX ÉQUIPEMENTS - CUISINE ====================
        'has_basic_kitchen_equipment', 'has_dishes_cutlery', 'has_coffee_maker',
        'has_kettle', 'has_oven', 'has_microwave', 'has_freezer',
        'has_refrigerator', 'has_dining_table', 'has_wine_glasses',
        'has_toaster', 'has_blender',
        
        // ==================== NOUVEAUX ÉQUIPEMENTS - DIVERTISSEMENT ====================
        'has_smart_tv', 'has_streaming', 'has_bluetooth_speaker', 'has_books',
        
        // ==================== NOUVEAUX ÉQUIPEMENTS - SÉCURITÉ ====================
        'has_smoke_detector', 'has_first_aid_kit', 'has_fire_extinguisher',
        
        // ==================== NOUVEAUX SERVICES ====================
        'has_ironing_service', 'has_free_parking', 'has_luggage_storage',
        
        // ==================== NOUVEAUX ÉQUIPEMENTS - EXTÉRIEUR ====================
        'has_balcony', 'has_garden', 'has_bbq', 'has_loungers',
        
        'is_hotel_promoted',
    'is_featured',
    ];

    protected $casts = [
        
        'is_hotel_promoted' => 'boolean',
    'is_featured' => 'boolean',
    
        // Géolocalisation
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        
        // Dates
        'certified_at' => 'datetime',
        'moderated_at' => 'datetime',
        'deleted_at' => 'datetime',
        
        // JSON
        'host_languages' => 'array',
        'seasonal_prices' => 'array',
        'blackout_dates' => 'array',
        'meta_keywords' => 'array',
        
        // Boolean existants
        'bluefin_certified' => 'boolean',
        'superhost' => 'boolean',
        'instant_booking' => 'boolean',
        'self_checkin' => 'boolean',
        'requires_review' => 'boolean',
        'allows_pets' => 'boolean',
        'allows_smoking' => 'boolean',
        'allows_parties' => 'boolean',
        'allows_children' => 'boolean',
        'has_generator' => 'boolean',
        'has_water_tank' => 'boolean',
        'has_air_conditioning' => 'boolean',
        'has_wifi' => 'boolean',
        'has_parking' => 'boolean',
        'has_pool' => 'boolean',
        'has_kitchen' => 'boolean',
        'has_tv' => 'boolean',
        'has_security_guard' => 'boolean',
        'has_breakfast' => 'boolean',
        'has_restaurant' => 'boolean',
        'has_bar' => 'boolean',
        'has_gym' => 'boolean',
        'has_spa' => 'boolean',
        'has_elevator' => 'boolean',
        'has_ev_charging' => 'boolean',
        'has_laundry' => 'boolean',
        'has_cctv' => 'boolean',
        'has_electric_fence' => 'boolean',
        'airport_shuttle' => 'boolean',
        'housekeeping' => 'boolean',
        'room_service' => 'boolean',
        'wheelchair_accessible' => 'boolean',
        
        // ==================== NOUVEAUX BOOLEANS - SALLE DE BAIN ====================
        'has_towels' => 'boolean',
        'has_toiletries' => 'boolean',
        'has_hair_dryer' => 'boolean',
        'has_hot_water' => 'boolean',
        'has_bathtub' => 'boolean',
        'has_shower' => 'boolean',
        
        // ==================== NOUVEAUX BOOLEANS - CHAMBRE ET LINGE ====================
        'has_bed_linen' => 'boolean',
        'has_pillows' => 'boolean',
        'has_blankets' => 'boolean',
        'has_hangers' => 'boolean',
        'has_closet' => 'boolean',
        'has_iron' => 'boolean',
        
        // ==================== NOUVEAUX BOOLEANS - CUISINE ====================
        'has_basic_kitchen_equipment' => 'boolean',
        'has_dishes_cutlery' => 'boolean',
        'has_coffee_maker' => 'boolean',
        'has_kettle' => 'boolean',
        'has_oven' => 'boolean',
        'has_microwave' => 'boolean',
        'has_freezer' => 'boolean',
        'has_refrigerator' => 'boolean',
        'has_dining_table' => 'boolean',
        'has_wine_glasses' => 'boolean',
        'has_toaster' => 'boolean',
        'has_blender' => 'boolean',
        
        // ==================== NOUVEAUX BOOLEANS - DIVERTISSEMENT ====================
        'has_smart_tv' => 'boolean',
        'has_streaming' => 'boolean',
        'has_bluetooth_speaker' => 'boolean',
        'has_books' => 'boolean',
        
        // ==================== NOUVEAUX BOOLEANS - SÉCURITÉ ====================
        'has_smoke_detector' => 'boolean',
        'has_first_aid_kit' => 'boolean',
        'has_fire_extinguisher' => 'boolean',
        
        // ==================== NOUVEAUX SERVICES ====================
        'has_ironing_service' => 'boolean',
        'has_free_parking' => 'boolean',
        'has_luggage_storage' => 'boolean',
        
        // ==================== NOUVEAUX BOOLEANS - EXTÉRIEUR ====================
        'has_balcony' => 'boolean',
        'has_garden' => 'boolean',
        'has_bbq' => 'boolean',
        'has_loungers' => 'boolean',
    ];

    /**
     * Searchable configuration for Laravel Scout
     */
    public function toSearchableArray()
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'city' => $this->city,
            'district' => $this->district,
            'property_type' => $this->property_type,
            'price_per_night' => $this->price_per_night,
            'max_guests' => $this->max_guests,
            'bedrooms' => $this->bedrooms,
            'average_rating' => $this->average_rating,
            'bluefin_certified' => $this->bluefin_certified,
        ];
    }

    // ==================== RELATIONS ====================
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function moderator()
    {
        return $this->belongsTo(User::class, 'moderated_by');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function availability()
    {
        return $this->hasMany(Availability::class);
    }

    public function availabilities()
    {
        return $this->hasMany(Availability::class);
    }

    public function photos()
    {
        return $this->hasMany(PropertyPhoto::class)->orderBy('order');
    }

    public function coverPhoto()
    {
        return $this->hasOne(PropertyPhoto::class)->where('is_cover', true);
    }

    public function favorites()
    {
        return $this->belongsToMany(User::class, 'favorites')->withTimestamps();
    }

    // ==================== ACCESSORS ====================
    
    public function getAmenitiesListAttribute()
    {
        $amenities = [];
        $amenityFields = [
            // Équipements existants
            'has_wifi' => 'Wi-Fi',
            'has_air_conditioning' => 'Climatisation',
            'has_generator' => 'Groupe électrogène',
            'has_water_tank' => 'Citerne d\'eau',
            'has_parking' => 'Parking',
            'has_pool' => 'Piscine',
            'has_kitchen' => 'Cuisine équipée',
            'has_tv' => 'Télévision',
            'has_security_guard' => 'Gardien',
            'has_breakfast' => 'Petit-déjeuner',
            'has_restaurant' => 'Restaurant',
            'has_bar' => 'Bar',
            'has_gym' => 'Salle de sport',
            'has_spa' => 'Spa',
            'has_elevator' => 'Ascenseur',
            'has_laundry' => 'Buanderie',
            'has_cctv' => 'Caméras de surveillance',
            'has_electric_fence' => 'Clôture électrique',
            
            // Salle de bain
            'has_towels' => 'Serviettes',
            'has_toiletries' => 'Gel douche / Shampoing',
            'has_hair_dryer' => 'Sèche-cheveux',
            'has_hot_water' => 'Eau chaude',
            'has_bathtub' => 'Baignoire',
            'has_shower' => 'Douche',
            
            // Chambre et linge
            'has_bed_linen' => 'Draps',
            'has_pillows' => 'Oreillers',
            'has_blankets' => 'Couvertures',
            'has_hangers' => 'Cintres',
            'has_closet' => 'Espace de rangement',
            'has_iron' => 'Fer à repasser',
            
            // Cuisine
            'has_basic_kitchen_equipment' => 'Équipement de cuisine de base',
            'has_dishes_cutlery' => 'Vaisselle et couverts',
            'has_coffee_maker' => 'Cafetière',
            'has_kettle' => 'Bouilloire',
            'has_oven' => 'Four',
            'has_microwave' => 'Four à micro-ondes',
            'has_freezer' => 'Congélateur',
            'has_refrigerator' => 'Réfrigérateur',
            'has_dining_table' => 'Table à manger',
            'has_wine_glasses' => 'Verres à vin',
            'has_toaster' => 'Grille-pain',
            'has_blender' => 'Mixer / Blender',
            
            // Divertissement
            'has_smart_tv' => 'Smart TV',
            'has_streaming' => 'Netflix / Streaming',
            'has_bluetooth_speaker' => 'Enceinte Bluetooth',
            'has_books' => 'Livres / Magazines',
            
            // Sécurité
            'has_smoke_detector' => 'Détecteur de fumée',
            'has_first_aid_kit' => 'Trousse de secours',
            'has_fire_extinguisher' => 'Extincteur',
            
            // Services
            'has_ironing_service' => 'Service de repassage',
            'has_free_parking' => 'Parking gratuit',
            'has_luggage_storage' => 'Local à bagages',
            
            // Extérieur
            'has_balcony' => 'Balcon / Terrasse',
            'has_garden' => 'Jardin',
            'has_bbq' => 'Barbecue',
            'has_loungers' => 'Transats',
        ];
        
        foreach ($amenityFields as $field => $label) {
            if ($this->$field) {
                $amenities[] = $label;
            }
        }
        
        return $amenities;
    }

    public function getPricePerNightInEuroAttribute()
    {
        return round($this->price_per_night / 655.957, 2);
    }

    public function getPricePerNightInUsdAttribute()
    {
        return round($this->price_per_night / 600, 2);
    }

    public function getStatusLabelAttribute()
    {
        $labels = [
            'draft' => 'Brouillon',
            'pending' => 'En attente de validation',
            'active' => 'Publiée',
            'inactive' => 'Désactivée',
            'rejected' => 'Rejetée',
            'suspended' => 'Suspendue',
        ];
        
        return $labels[$this->status] ?? $this->status;
    }

    public function getStatusColorAttribute()
    {
        $colors = [
            'draft' => 'gray',
            'pending' => 'orange',
            'active' => 'green',
            'inactive' => 'red',
            'rejected' => 'red',
            'suspended' => 'darkred',
        ];
        
        return $colors[$this->status] ?? 'gray';
    }

    // ==================== SCOPES ====================
    
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeCertified($query)
    {
        return $query->where('bluefin_certified', true);
    }

    public function scopeByCity($query, $city)
    {
        return $query->where('city', 'like', "%{$city}%");
    }

    public function scopeByDistrict($query, $district)
    {
        return $query->where('district', 'like', "%{$district}%");
    }

    public function scopePriceRange($query, $min, $max)
    {
        return $query->whereBetween('price_per_night', [$min, $max]);
    }

    public function scopeRequiresModeration($query)
    {
        return $query->where('requires_review', true)->where('status', 'pending');
    }

    // ==================== METHODS ====================
    
    public function isAvailable($checkIn, $checkOut)
    {
        $dates = $this->availability()
            ->whereBetween('date', [$checkIn, $checkOut])
            ->where('status', '!=', 'available')
            ->count();

        return $dates === 0;
    }

    public function getAvailableDates($startDate, $endDate)
    {
        return $this->availabilities()
            ->where('date', '>=', $startDate)
            ->where('date', '<=', $endDate)
            ->where('is_available', true)
            ->pluck('date');
    }

    public function calculateTotalPrice($checkIn, $checkOut, $guests)
    {
        $checkInDate = \Carbon\Carbon::parse($checkIn);
        $checkOutDate = \Carbon\Carbon::parse($checkOut);
        $nights = $checkInDate->diffInDays($checkOutDate);
        
        $pricePerNight = $this->price_per_night;
        
        // Apply weekly discount (7+ nights)
        if ($nights >= 7) {
            $pricePerNight = $pricePerNight * (1 - $this->weekly_discount / 100);
        }
        
        // Apply monthly discount (28+ nights)
        if ($nights >= 28) {
            $pricePerNight = $pricePerNight * (1 - $this->monthly_discount / 100);
        }
        
        $subtotal = $pricePerNight * $nights;
        
        // Extra guest fee
        $extraGuests = max(0, $guests - ($this->max_guests - 1));
        $extraGuestTotal = $extraGuests * $this->extra_guest_fee * $nights;
        
        $serviceFee = ($subtotal + $extraGuestTotal) * ($this->service_fee_percentage / 100);
        
        return [
            'nights' => $nights,
            'price_per_night' => $pricePerNight,
            'subtotal' => $subtotal,
            'extra_guest_fee' => $extraGuestTotal,
            'service_fee' => $serviceFee,
            'cleaning_fee' => $this->cleaning_fee,
            'security_deposit' => $this->security_deposit,
            'total' => $subtotal + $extraGuestTotal + $serviceFee + $this->cleaning_fee,
        ];
    }

    public function updateAverageRating()
    {
        $average = $this->reviews()->where('is_approved', true)->avg('rating');
        $this->average_rating = round($average, 2);
        $this->reviews_count = $this->reviews()->where('is_approved', true)->count();
        $this->save();
        
        // Update host's average rating
        if ($this->user) {
            $this->user->updateStatistics();
        }
        
        return $this->average_rating;
    }

    public function incrementViews()
    {
        $this->increment('views_count');
    }

    public function incrementBookingsCount()
    {
        $this->increment('bookings_count');
    }

    public function updateTotalRevenue()
    {
        $total = $this->bookings()->where('booking_status', 'completed')->sum('total_amount');
        $this->total_revenue = $total;
        $this->save();
    }

    public function submitForModeration()
    {
        $this->status = 'pending';
        $this->requires_review = true;
        $this->moderation_attempts = $this->moderation_attempts + 1;
        $this->save();
    }

    public function approve($moderatorId, $notes = null)
    {
        $this->status = 'active';
        $this->requires_review = false;
        $this->moderated_by = $moderatorId;
        $this->moderated_at = now();
        $this->moderation_notes = $notes;
        $this->rejection_reason = null;
        $this->save();
    }

    public function reject($moderatorId, $reason, $notes = null)
    {
        $this->status = 'rejected';
        $this->requires_review = false;
        $this->moderated_by = $moderatorId;
        $this->moderated_at = now();
        $this->rejection_reason = $reason;
        $this->moderation_notes = $notes;
        $this->save();
    }

    public function canBeBooked()
    {
        return $this->status === 'active' && $this->user && $this->user->is_active && !$this->user->isSuspended;
    }

    public function generateSlug()
    {
        $slug = \Illuminate\Support\Str::slug($this->title . '-' . $this->city . '-' . $this->id);
        $this->slug = $slug;
        $this->save();
        
        return $slug;
    }
}