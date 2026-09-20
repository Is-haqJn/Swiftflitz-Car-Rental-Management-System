<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chauffeur_pickup_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('booking_id')->constrained('chauffeur_bookings')->cascadeOnDelete();
            $table->dateTime('confirmed_at');
            $table->text('pickup_location')->nullable();
            $table->integer('odometer_reading')->nullable();
            $table->boolean('customer_present')->default(true);
            $table->text('driver_notes')->nullable();
            $table->foreignUuid('confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chauffeur_pickup_logs');
    }
};
