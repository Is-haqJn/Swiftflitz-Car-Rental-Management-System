<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('category_id')->constrained('categories');
            $table->string('name');
            $table->string('make');
            $table->string('model');
            $table->year('year');
            $table->date('roadworthy_expiry_date');
            $table->date('insurance_expiry_date');
            $table->string('license_plate')->unique();
            $table->string('vin')->unique()->nullable();
            $table->boolean('has_insurance')->default(false);
            $table->boolean('has_roadworthy')->default(false);
            $table->string('color');
            $table->unsignedTinyInteger('seats');
            $table->enum('fuel_type', ['petrol', 'diesel', 'electric', 'hybrid'])->default('petrol');
            $table->string('engine_size')->nullable();
            $table->unsignedInteger('odometer')->default(0);
            $table->enum('transmission', ['manual', 'automatic'])->default('automatic');
            $table->json('features')->nullable();
            $table->decimal('daily_rate');
            $table->boolean('price_visible')->default(false);
            $table->string('status')->default('available');
            $table->string('condition_notes')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
