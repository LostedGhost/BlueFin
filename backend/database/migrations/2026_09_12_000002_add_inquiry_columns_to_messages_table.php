<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Conversations avant réservation (« Discutez avec l'hôte ») : le logement
 * concerné est rattaché au message.
 *
 * La base de production possède déjà `property_id` (ajoutée hors
 * migrations) : chaque colonne n'est créée que si elle manque, la migration
 * est donc sans effet là-bas et additive ailleurs.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('messages', 'property_id')) {
            Schema::table('messages', function (Blueprint $table) {
                $table->foreignId('property_id')->nullable()->after('booking_id')->constrained()->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        // Volontairement vide : en production la colonne préexistait à cette
        // migration, la supprimer effacerait des données qu'elle n'a pas créées.
    }
};
