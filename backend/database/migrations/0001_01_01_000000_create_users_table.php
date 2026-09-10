<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            
            // Identifiants de base
            $table->string('email')->unique();
            $table->string('phone')->unique();
            $table->string('password');
            
            // Informations personnelles
            $table->string('first_name');
            $table->string('last_name');
            $table->string('profile_photo')->nullable();
            $table->text('bio')->nullable();
            $table->json('languages')->nullable();
            $table->string('country')->default('Benin');
            $table->string('city')->nullable();
            $table->string('address')->nullable();
            $table->date('birth_date')->nullable();
            
            // Type d'utilisateur
            $table->enum('user_type', ['voyageur', 'hote', 'admin'])->default('voyageur');
            
            // Rôle admin spécifique
            $table->enum('admin_role', ['super_admin', 'moderator', 'finance_admin', 'support'])->nullable();
            $table->json('admin_permissions')->nullable();
            
            // Vérification d'identité
            $table->enum('verification_status', ['pending', 'verified', 'rejected'])->default('pending');
            $table->string('identity_document')->nullable();
            $table->enum('identity_document_type', ['cni', 'passeport', 'permis'])->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->onDelete('set null');
            
            // Statut du compte
            $table->boolean('is_active')->default(true);
            $table->timestamp('suspended_until')->nullable();
            $table->text('suspension_reason')->nullable();
            
            // Vérifications email et téléphone
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('phone_verified_at')->nullable();
            
            // Préférences de notifications
            $table->boolean('receive_email_notifications')->default(true);
            $table->boolean('receive_whatsapp_notifications')->default(true);
            $table->boolean('receive_sms_notifications')->default(false);
            $table->boolean('receive_push_notifications')->default(true);
            
            // Activité
            $table->timestamp('last_login_at')->nullable();
            $table->timestamp('last_admin_activity')->nullable();
            $table->ipAddress('last_login_ip')->nullable();
            $table->string('last_login_device')->nullable();
            
            // Statistiques utilisateur
            $table->integer('total_bookings')->default(0);
            $table->integer('total_reviews')->default(0);
            $table->decimal('average_rating_as_host', 3, 2)->default(0);
            $table->decimal('average_rating_as_guest', 3, 2)->default(0);
            $table->integer('total_properties')->default(0);
            
            // Stripe Connect pour les hôtes
            $table->string('stripe_account_id')->nullable();
            $table->boolean('stripe_onboarding_completed')->default(false);
            
            // Pour remember token et timestamps
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes pour optimisation
            $table->index(['email', 'phone']);
            $table->index('user_type');
            $table->index('verification_status');
            $table->index('is_active');
            $table->index('admin_role');
            $table->index('created_at');
            $table->index(['user_type', 'verification_status']);
            $table->index(['first_name', 'last_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};