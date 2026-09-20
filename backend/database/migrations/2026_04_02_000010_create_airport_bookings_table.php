<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('airport_bookings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('booking_reference')->unique();
            $table->foreignUuid('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignUuid('airport_id')->constrained('airports')->cascadeOnDelete();
            $table->string('direction');
            $table->foreignUuid('package_id')->constrained('airport_packages');
            $table->foreignUuid('package_assignment_id')->constrained('airport_package_assignments');
            $table->foreignUuid('vehicle_id')->nullable()->constrained('fleet_vehicles')->nullOnDelete();
            $table->foreignUuid('driver_id')->nullable()->constrained('drivers')->nullOnDelete();
            $table->foreignUuid('airport_customer_id')->constrained('airport_customers');
            $table->string('passenger_name');
            $table->string('passenger_phone');
            $table->tinyInteger('passenger_count');
            $table->string('flight_number')->nullable();
            $table->string('airline')->nullable();
            $table->dateTime('scheduled_at');
            $table->foreignUuid('terminal_location_id')->constrained('airport_locations');
            $table->foreignUuid('area_location_id')->constrained('airport_locations');
            $table->text('specific_address')->nullable();
            $table->decimal('package_rate_snapshot', 10, 2);
            $table->decimal('area_charge_snapshot', 10, 2)->default(0.00);
            $table->decimal('vat_rate_snapshot', 5, 2);
            $table->decimal('vat_amount', 10, 2);
            $table->decimal('total_amount', 10, 2);
            $table->string('payment_status')->default('pending');
            $table->string('payment_method')->nullable();
            $table->string('payment_reference')->nullable();
            $table->string('booking_status')->default('pending');
            $table->string('booking_source')->default('staff');
            $table->string('assignment_mode')->default('manual');
            $table->decimal('cancellation_fee_applied', 10, 2)->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->foreignUuid('cancelled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('staff_notes')->nullable();
            $table->foreignUuid('created_by')->constrained('users');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('airport_bookings');
    }
};
