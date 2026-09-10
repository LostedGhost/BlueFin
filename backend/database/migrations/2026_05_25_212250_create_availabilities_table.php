<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('availabilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->boolean('is_available')->default(true);
            $table->enum('status', ['available', 'booked', 'blocked'])->default('available');
            $table->decimal('special_price', 10, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            // Index pour optimiser les recherches
            $table->index(['property_id', 'date']);
            $table->unique(['property_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('availabilities');
    }
};