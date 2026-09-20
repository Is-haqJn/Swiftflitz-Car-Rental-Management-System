<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_locations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->string('name');
            $table->decimal('pickup_charge', 10, 2)->nullable();
            $table->decimal('dropoff_charge', 10, 2)->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_pickup')->default(true);
            $table->boolean('is_dropoff')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_locations');
    }
};
