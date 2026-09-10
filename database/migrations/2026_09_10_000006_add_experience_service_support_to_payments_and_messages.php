<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Un paiement peut désormais régler une réservation de logement, d'expérience
        // ou de service — un seul des trois FK est rempli à la fois, booking_id
        // devient donc nullable (nécessite doctrine/dbal, ajouté au projet).
        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('booking_id')->nullable()->change();
            $table->foreignId('experience_booking_id')->nullable()->after('booking_id')
                ->constrained('experience_bookings')->onDelete('cascade');
            $table->foreignId('service_booking_id')->nullable()->after('experience_booking_id')
                ->constrained('service_bookings')->onDelete('cascade');
        });

        // Messagerie hôte↔voyageur ciblée par expérience/service (avant même
        // qu'une réservation existe), en plus du booking_id déjà nullable.
        Schema::table('messages', function (Blueprint $table) {
            $table->foreignId('experience_id')->nullable()->after('booking_id')
                ->constrained('experiences')->onDelete('cascade');
            $table->foreignId('service_id')->nullable()->after('experience_id')
                ->constrained('services')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('experience_booking_id');
            $table->dropConstrainedForeignId('service_booking_id');
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->dropConstrainedForeignId('experience_id');
            $table->dropConstrainedForeignId('service_id');
        });
    }
};
