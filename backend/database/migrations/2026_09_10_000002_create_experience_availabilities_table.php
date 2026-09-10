<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('experience_availabilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('experience_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->json('slots')->nullable();
            $table->boolean('is_available')->default(true);
            $table->timestamps();

            $table->unique(['experience_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('experience_availabilities');
    }
};
