<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_reference')->unique();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('property_id')->constrained()->onDelete('cascade');
            $table->date('check_in');
            $table->date('check_out');
            $table->integer('guests_count');
            $table->integer('nights_count');
            $table->decimal('subtotal', 10, 0);
            $table->decimal('service_fee', 10, 0);
            $table->decimal('cleaning_fee', 10, 0);
            $table->decimal('total_amount', 10, 0);
            $table->enum('payment_method', ['mobile_money', 'card', 'bank_transfer']);
            $table->enum('payment_status', ['pending', 'paid', 'failed', 'refunded'])->default('pending');
            $table->enum('booking_status', [
                'pending', 'confirmed', 'cancelled', 'completed', 'refunded'
            ])->default('pending');
            $table->text('guest_notes')->nullable();
            $table->text('host_notes')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->json('guest_details')->nullable();
            $table->string('qr_code')->nullable();
            $table->timestamps();
            
            $table->index('booking_reference');
            $table->index(['check_in', 'check_out']);
            $table->index('booking_status');
            $table->index('payment_status');
        });
    }

    public function down()
    {
        Schema::dropIfExists('bookings');
    }
};