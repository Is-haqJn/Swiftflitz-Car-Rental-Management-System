<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('category_id')->constrained('categories')->nullOnDelete();
            $table->string('name');
            $table->string('make');
            $table->string('model');
            $table->year('year');
            $table->string('license_plate')->unique();
            $table->string('vin')->unique()->nullable();
            $table->string('color');
            $table->unsignedTinyInteger('seats');
            $table->enum('fuel_type', ['petrol', 'diesel', 'electric', 'hybrid'])->default('petrol');
            $table->string('engine_size')->nullable();
            $table->unsignedInteger('mileage')->default(0);
            $table->enum('transmission', ['manual', 'automatic'])->default('automatic');
            $table->json('features')->nullable();
            $table->decimal('daily_rate')->nullable();
            $table->decimal('weekly_rate')->nullable();
            $table->decimal('monthly_rate')->nullable();
            $table->boolean('price_visible')->default(false);
            $table->string('status');
            $table->string('condition_notes')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->timestamp('created_at')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
