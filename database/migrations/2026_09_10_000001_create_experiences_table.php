<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('experiences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('host_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('moderated_by')->nullable()->constrained('users')->onDelete('set null');

            $table->string('name');
            $table->text('description');
            $table->string('slug')->unique();
            $table->string('location');
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();

            $table->decimal('price', 12, 0);
            $table->integer('total_places')->default(1);
            $table->string('duration')->nullable();
            $table->json('steps')->nullable();
            $table->json('images')->nullable();

            $table->enum('status', ['draft', 'pending', 'active', 'inactive', 'rejected', 'suspended'])->default('draft');
            $table->boolean('is_published')->default(false);
            $table->timestamp('published_at')->nullable();

            $table->boolean('requires_review')->default(true);
            $table->timestamp('moderated_at')->nullable();
            $table->text('moderation_notes')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->unsignedInteger('moderation_attempts')->default(0);

            $table->unsignedInteger('views_count')->default(0);
            $table->unsignedInteger('bookings_count')->default(0);
            $table->decimal('average_rating', 3, 2)->default(0);
            $table->unsignedInteger('reviews_count')->default(0);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['host_id', 'status']);
            $table->index('status');
            $table->index('location');
            $table->index('price');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('experiences');
    }
};
