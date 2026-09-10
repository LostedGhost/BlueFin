<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('property_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->onDelete('cascade');
            $table->string('photo_path');
            $table->string('photo_url');
            $table->string('thumbnail_path')->nullable();
            $table->string('thumbnail_url')->nullable();
            $table->integer('order')->default(0);
            $table->boolean('is_cover')->default(false);
            $table->boolean('is_approved')->default(true);
            $table->string('caption')->nullable();
            $table->timestamps();
            
            $table->index(['property_id', 'order']);
            $table->index('is_cover');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_photos');
    }
};