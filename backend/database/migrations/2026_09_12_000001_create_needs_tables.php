<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * « Besoins » : demandes publiées par les voyageurs (ex. « villa à Ouidah,
 * 3 nuits, 4 personnes, 60 000 FCFA/nuit max »), auxquelles les hôtes de la
 * ville répondent. L'administration voit tout.
 *
 * Migration additive : deux nouvelles tables, rien d'existant n'est modifié.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('needs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['logement', 'experience', 'service'])->default('logement');
            $table->string('city', 100);
            $table->string('district', 100)->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->unsignedSmallInteger('guests')->default(1);
            $table->unsignedInteger('budget_max')->nullable();
            $table->text('details')->nullable();
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->string('closed_reason', 255)->nullable();
            $table->unsignedInteger('responses_count')->default(0);
            $table->timestamps();

            $table->index(['status', 'type']);
        });

        Schema::create('need_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('need_id')->constrained()->cascadeOnDelete();
            $table->foreignId('host_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('property_id')->nullable()->constrained()->nullOnDelete();
            $table->text('message');
            $table->timestamps();

            // Une réponse par hôte et par besoin (il peut la modifier).
            $table->unique(['need_id', 'host_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('need_responses');
        Schema::dropIfExists('needs');
    }
};
