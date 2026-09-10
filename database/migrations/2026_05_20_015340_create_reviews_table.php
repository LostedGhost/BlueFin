<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('property_id')->constrained()->onDelete('cascade');
            $table->integer('rating')->unsigned();
            $table->integer('cleanliness_rating')->unsigned();
            $table->integer('communication_rating')->unsigned();
            $table->integer('checkin_rating')->unsigned();
            $table->integer('accuracy_rating')->unsigned();
            $table->integer('location_rating')->unsigned();
            $table->integer('value_rating')->unsigned();
            $table->text('comment');
            $table->enum('review_type', ['guest', 'host'])->default('guest');
            $table->text('host_response')->nullable();
            $table->timestamps();
            
            $table->index('rating');
            $table->index('review_type');
        });
    }

    public function down()
    {
        Schema::dropIfExists('reviews');
    }
};