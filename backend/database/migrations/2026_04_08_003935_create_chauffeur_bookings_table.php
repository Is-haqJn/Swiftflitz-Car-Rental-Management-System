<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chauffeur_bookings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('booking_reference')->unique();
            $table->foreignUuid('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignUuid('vehicle_id')->nullable()->constrained('fleet_vehicles')->nullOnDelete();
            $table->foreignUuid('driver_id')->nullable()->constrained('drivers')->nullOnDelete();
            $table->foreignUuid('chauffeur_customer_id')->constrained('chauffeur_customers');
            $table->foreignUuid('pickup_location_id')->nullable()->constrained('chauffeur_locations')->nullOnDelete();
            $table->dateTime('pickup_time');
            $table->dateTime('return_time');
            $table->dateTime('actual_pickup_time')->nullable();
            $table->dateTime('actual_return_time')->nullable();
            $table->decimal('base_price_snapshot', 10, 2);
            $table->decimal('pickup_charge_snapshot', 10, 2)->default(0.00);
            $table->decimal('vat_rate_snapshot', 5, 2)->default(0.00);
            $table->decimal('vat_amount', 10, 2)->default(0.00);
            $table->decimal('overtime_hours', 5, 2)->default(0.00);
            $table->decimal('overtime_charge', 10, 2)->default(0.00);
            $table->decimal('total_amount', 10, 2);
            $table->string('payment_status')->default('pending');
            $table->string('payment_method')->nullable();
            $table->string('payment_reference')->nullable();
            $table->string('booking_status')->default('pending');
            $table->decimal('cancellation_fee_applied', 10, 2)->nullable();
            $table->decimal('no_show_fee_applied', 10, 2)->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->foreignUuid('cancelled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('staff_notes')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chauffeur_bookings');
    }
};
