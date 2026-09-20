<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fleet_vehicle_services', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vehicle_id')->constrained('fleet_vehicles')->cascadeOnDelete();
            $table->string('service_type');
            $table->foreignUuid('package_id')->nullable()->constrained('airport_packages')->nullOnDelete();
            $table->foreignUuid('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->decimal('base_price', 10, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['vehicle_id', 'service_type', 'package_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fleet_vehicle_services');
    }
};
