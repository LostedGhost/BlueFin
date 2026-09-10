<?php
// database/migrations/xxxx_add_missing_amenities_to_properties_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            // ==================== SALLE DE BAIN ====================
            $table->boolean('has_towels')->default(false);
            $table->boolean('has_toiletries')->default(false);
            $table->boolean('has_hair_dryer')->default(false);
            $table->boolean('has_hot_water')->default(true);
            $table->boolean('has_bathtub')->default(false);
            $table->boolean('has_shower')->default(true);
            
            // ==================== CHAMBRE ET LINGE ====================
            $table->boolean('has_bed_linen')->default(true);
            $table->boolean('has_pillows')->default(true);
            $table->boolean('has_blankets')->default(true);
            $table->boolean('has_hangers')->default(false);
            $table->boolean('has_closet')->default(false);
            $table->boolean('has_iron')->default(false);
            
            // ==================== CUISINE ET ÉQUIPEMENTS ====================
            $table->boolean('has_basic_kitchen_equipment')->default(false);
            $table->boolean('has_dishes_cutlery')->default(false);
            $table->boolean('has_coffee_maker')->default(false);
            $table->boolean('has_kettle')->default(false);
            $table->boolean('has_oven')->default(false);
            $table->boolean('has_microwave')->default(false);
            $table->boolean('has_freezer')->default(false);
            $table->boolean('has_refrigerator')->default(true);
            $table->boolean('has_dining_table')->default(false);
            $table->boolean('has_wine_glasses')->default(false);
            $table->boolean('has_toaster')->default(false);
            $table->boolean('has_blender')->default(false);
            
            // ==================== DIVERTISSEMENT ====================
            $table->boolean('has_smart_tv')->default(false);
            $table->boolean('has_streaming')->default(false);
            $table->boolean('has_bluetooth_speaker')->default(false);
            $table->boolean('has_books')->default(false);
            
            // ==================== SÉCURITÉ ====================
            $table->boolean('has_smoke_detector')->default(false);
            $table->boolean('has_first_aid_kit')->default(false);
            $table->boolean('has_fire_extinguisher')->default(false);
            
            // ==================== SERVICES ====================
            $table->boolean('has_ironing_service')->default(false);
            $table->boolean('has_free_parking')->default(false);
            $table->boolean('has_luggage_storage')->default(false);
            
            // ==================== EXTÉRIEUR ====================
            $table->boolean('has_balcony')->default(false);
            $table->boolean('has_garden')->default(false);
            $table->boolean('has_bbq')->default(false);
            $table->boolean('has_loungers')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->dropColumn([
                // Salle de bain
                'has_towels', 'has_toiletries', 'has_hair_dryer', 'has_hot_water',
                'has_bathtub', 'has_shower',
                // Chambre et linge
                'has_bed_linen', 'has_pillows', 'has_blankets', 'has_hangers',
                'has_closet', 'has_iron',
                // Cuisine
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
            ]);
        });
    }
};