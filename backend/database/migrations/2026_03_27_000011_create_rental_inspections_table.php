<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_inspections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('rental_id')->constrained('rentals')->cascadeOnDelete();
            $table->string('type'); // InspectionType: pickup|return|swap
            $table->foreignUuid('inspector_id')->nullable()->constrained('users')->nullOnDelete();

            // Vehicle condition
            $table->string('fuel_level')->nullable(); // empty|quarter|half|three_quarter|full
            $table->integer('mileage')->nullable();
            $table->text('condition_notes')->nullable();
            $table->boolean('damage_noted')->default(false);
            $table->json('photos')->nullable(); // array of media paths/URLs

            // Swap-specific fields
            $table->foreignUuid('swap_vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_inspections');
    }
};
