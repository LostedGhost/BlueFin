<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('favorites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('property_id')->constrained()->onDelete('cascade');
            $table->string('list_name')->default('default');
            $table->timestamps();
            
            $table->unique(['user_id', 'property_id', 'list_name']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('favorites');
    }
};