<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            
            // ==================== RELATIONS ====================
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('moderated_by')->nullable()->constrained('users')->onDelete('set null');
            
            // ==================== INFORMATIONS DE BASE ====================
            $table->string('title');
            $table->text('description');
            $table->string('slug')->unique();
            
            // ==================== TYPE DE PROPRIÉTÉ ====================
            $table->enum('property_type', [
                'appartement', 'chambre_habitant', 'villa', 'hotel', 
                'motel', 'auberge', 'maison_hotes', 'ecolodge', 
                'residence_hoteliere', 'immeuble_entier'
            ]);
            
            // ==================== LOCALISATION ====================
            $table->string('city');
            $table->string('district');
            $table->string('address')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('google_place_id')->nullable();
            
            // ==================== CAPACITÉ ET CHAMBRES ====================
            $table->integer('bedrooms')->default(0);
            $table->integer('beds')->default(0);
            $table->integer('bathrooms')->default(0);
            $table->integer('max_guests')->default(1);
            $table->integer('min_stay')->default(1);
            $table->integer('max_stay')->nullable();
            
            // ==================== TARIFICATION ====================
            $table->decimal('price_per_night', 12, 0);
            $table->decimal('weekly_discount', 5, 2)->default(0);
            $table->decimal('monthly_discount', 5, 2)->default(0);
            $table->decimal('cleaning_fee', 12, 0)->default(0);
            $table->decimal('service_fee_percentage', 5, 2)->default(15);
            $table->decimal('security_deposit', 12, 0)->default(0);
            $table->decimal('extra_guest_fee', 12, 0)->default(0);
            
            // ==================== POLITIQUES ====================
            $table->enum('cancellation_policy', ['flexible', 'moderate', 'strict', 'non_refundable'])->default('moderate');
            $table->boolean('instant_booking')->default(false);
            $table->boolean('self_checkin')->default(false);
            
            // ==================== ÉQUIPEMENTS SPÉCIFIQUES BÉNIN ====================
            $table->boolean('has_generator')->default(false);      // Groupe électrogène
            $table->boolean('has_water_tank')->default(false);     // Citerne d'eau
            $table->boolean('has_air_conditioning')->default(false); // Climatisation
            $table->boolean('has_wifi')->default(false);           // Wi-Fi
            $table->boolean('has_parking')->default(false);        // Parking
            $table->boolean('has_pool')->default(false);           // Piscine
            $table->boolean('has_kitchen')->default(false);        // Cuisine équipée
            $table->boolean('has_tv')->default(false);             // Télévision
            $table->boolean('has_security_guard')->default(false); // Gardien
            $table->boolean('has_breakfast')->default(false);      // Petit-déjeuner
            $table->boolean('has_restaurant')->default(false);     // Restaurant
            $table->boolean('has_bar')->default(false);            // Bar
            $table->boolean('has_gym')->default(false);            // Salle de sport
            $table->boolean('has_spa')->default(false);            // Spa
            $table->boolean('has_elevator')->default(false);       // Ascenseur
            $table->boolean('has_ev_charging')->default(false);    // Borne recharge électrique
            $table->boolean('has_laundry')->default(false);        // Buanderie
            $table->boolean('has_cctv')->default(false);           // Caméras de surveillance
            $table->boolean('has_electric_fence')->default(false); // Clôture électrique
            
            // ==================== SERVICES ====================
            $table->boolean('airport_shuttle')->default(false);    // Navette aéroport
            $table->boolean('housekeeping')->default(false);       // Ménage quotidien
            $table->boolean('room_service')->default(false);       // Service en chambre
            
            // ==================== ACCESSIBILITÉ ====================
            $table->boolean('wheelchair_accessible')->default(false);
            
            // ==================== CERTIFICATIONS ====================
            $table->boolean('bluefin_certified')->default(false);
            $table->boolean('superhost')->default(false);
            $table->timestamp('certified_at')->nullable();
            
            // ==================== LANGUES DE L'HÔTE ====================
            $table->json('host_languages')->nullable();
            
            // ==================== RÈGLES DE LA MAISON ====================
            $table->boolean('allows_pets')->default(false);
            $table->boolean('allows_smoking')->default(false);
            $table->boolean('allows_parties')->default(false);
            $table->boolean('allows_children')->default(true);
            $table->text('house_rules')->nullable();
            
            // ==================== DOCUMENTS ====================
            $table->string('property_document')->nullable();        // Document de propriété
            $table->string('insurance_certificate')->nullable();    // Assurance
            
            // ==================== STATUT DE L'ANNONCE ====================
            $table->enum('status', ['draft', 'pending', 'active', 'inactive', 'rejected', 'suspended'])->default('draft');
            $table->boolean('is_published')->default(false);
            $table->timestamp('published_at')->nullable();
            
            // ==================== MODÉRATION ====================
            $table->boolean('requires_review')->default(true);
            $table->timestamp('moderated_at')->nullable();
            $table->text('moderation_notes')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->integer('moderation_attempts')->default(0);
            
            // ==================== STATISTIQUES ====================
            $table->integer('views_count')->default(0);
            $table->integer('bookings_count')->default(0);
            $table->integer('favorites_count')->default(0);
            $table->decimal('average_rating', 3, 2)->default(0);
            $table->integer('reviews_count')->default(0);
            $table->decimal('total_revenue', 15, 0)->default(0);
            
            // ==================== CALENDRIER ET DISPONIBILITÉ ====================
            $table->json('seasonal_prices')->nullable();
            $table->json('blackout_dates')->nullable();
            $table->string('ical_url')->nullable();
            
            // ==================== SEO ====================
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->json('meta_keywords')->nullable();
            
            // ==================== MÉDIAS ====================
            $table->string('video_url')->nullable();
            $table->json('working_hours')->nullable();
            $table->string('checkin_instructions')->nullable();
            $table->string('checkout_instructions')->nullable();
            
            // ==================== TIMESTAMPS ====================
            $table->timestamps();
            $table->softDeletes();
            
            // ==================== INDEXES POUR OPTIMISATION ====================
            $table->index(['city', 'district']);
            $table->index('property_type');
            $table->index('status');
            $table->index('price_per_night');
            $table->index('average_rating');
            $table->index('bluefin_certified');
            $table->index('superhost');
            $table->index('instant_booking');
            $table->index(['user_id', 'status']);
            $table->index(['status', 'average_rating']);
            $table->index(['city', 'status', 'price_per_night']);
            $table->index('slug');
            $table->index('created_at');
            $table->index('moderated_at');
            $table->index('requires_review');
            $table->index(['latitude', 'longitude']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};