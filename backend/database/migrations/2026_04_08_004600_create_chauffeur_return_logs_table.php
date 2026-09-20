<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chauffeur_return_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('booking_id')->constrained('chauffeur_bookings')->cascadeOnDelete();
            $table->dateTime('returned_at');
            $table->integer('odometer_reading')->nullable();
            $table->text('condition_notes')->nullable();
            $table->integer('overtime_minutes')->default(0);
            $table->foreignUuid('logged_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chauffeur_return_logs');
    }
};
