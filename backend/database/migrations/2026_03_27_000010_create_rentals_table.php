<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rentals', function (Blueprint $table) {
            /* Identity */
            $table->uuid('id')->primary();
            $table->string('reference')->unique(); // RF-YYYY-XXXXX

            /* Ownership */
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignUuid('vehicle_id')->constrained('vehicles')->cascadeOnDelete();
            $table->foreignUuid('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignUuid('manager_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('source')->default('website'); // RentalSource enum

            /* Status */
            $table->string('status')->default('pending');          // RentalStatus enum
            $table->string('payment_status')->default('pending');  // RentalPaymentStatus enum

            /* Scheduling */
            $table->date('pickup_date');
            $table->string('pickup_time')->default('09:00');
            $table->date('return_date');
            $table->string('return_time')->default('17:00');
            $table->dateTime('actual_pickup_date')->nullable();
            $table->dateTime('actual_return_date')->nullable();

            /* Location */
            $table->string('pickup_location')->nullable();
            $table->string('dropoff_location')->nullable();
            $table->foreignUuid('pickup_location_id')->nullable()->constrained('rental_locations')->nullOnDelete();
            $table->foreignUuid('dropoff_location_id')->nullable()->constrained('rental_locations')->nullOnDelete();

            /* Pricing Snapshot */
            $table->integer('rental_days');
            $table->decimal('daily_rate', 10, 2);
            $table->decimal('base_cost', 10, 2);
            $table->decimal('extras_cost', 10, 2)->default(0);
            $table->decimal('additional_charges', 10, 2)->default(0);
            $table->decimal('location_charge', 10, 2)->default(0);
            $table->decimal('subtotal', 10, 2);
            $table->decimal('vat_amount', 10, 2)->nullable();
            $table->decimal('total_cost', 10, 2);

            /* Discounts */
            $table->decimal('rule_discount_amount', 10, 2)->default(0);
            $table->decimal('coupon_discount_amount', 10, 2)->default(0);
            $table->decimal('manual_discount_amount', 10, 2)->default(0);
            $table->string('manual_discount_reason')->nullable();
            $table->foreignUuid('manual_discount_by')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('total_discount_amount', 10, 2)->default(0);

            /* JSON Snapshots */
            $table->json('applied_charges_breakdown')->nullable();
            $table->json('coupon_applied')->nullable();

            /* Payment */
            $table->decimal('amount_paid', 10, 2)->default(0.00);

            /* Security Deposit */
            $table->decimal('security_deposit_amount', 10, 2)->nullable();
            $table->string('security_deposit_status')->nullable(); // pending|held|refunded|forfeited|uncollected
            $table->boolean('skip_security_deposit')->default(false);
            $table->dateTime('deposit_collected_at')->nullable();
            $table->uuid('deposit_collected_by')->nullable(); // no FK - audit only
            $table->decimal('deposit_paid', 10, 2)->default(0);
            $table->decimal('deposit_refunded', 10, 2)->default(0);
            $table->dateTime('deposit_refunded_at')->nullable();
            $table->boolean('deposit_waived')->default(false);
            $table->foreignUuid('deposit_waived_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('deposit_waiver_reason')->nullable();

            /* Fees */
            $table->decimal('overdue_fee', 10, 2)->nullable();
            $table->decimal('late_pickup_fee', 10, 2)->nullable();

            /* Overdue */
            $table->boolean('is_overdue')->default(false);
            $table->integer('overdue_minutes')->nullable();
            $table->boolean('overdue_waived')->default(false);
            $table->string('overdue_waiver_reason')->nullable();
            $table->foreignUuid('overdue_waived_by')->nullable()->constrained('users')->nullOnDelete();

            /* Early Return */
            $table->boolean('is_early_return')->default(false);
            $table->integer('actual_rental_days')->nullable();
            $table->decimal('early_return_refund', 10, 2)->default(0);
            $table->text('early_return_reason')->nullable();

            /* Settlement (two-track) */
            $table->string('settlement_status')->nullable();        // pending|settled
            $table->string('damage_settlement_status')->nullable(); // pending|settled|forfeited

            /* Damage */
            $table->boolean('has_damage')->default(false);
            $table->decimal('estimated_repair_cost', 10, 2)->nullable();
            $table->decimal('actual_repair_cost', 10, 2)->nullable();

            /* Notes */
            $table->text('customer_notes')->nullable();
            $table->text('admin_notes')->nullable();

            /* Cancellation */
            $table->text('cancellation_reason')->nullable();
            $table->decimal('cancellation_fee', 10, 2)->nullable();
            $table->decimal('days_used_cost', 10, 2)->nullable();
            $table->decimal('refund_amount', 10, 2)->nullable();
            $table->string('cancelled_by_type')->nullable(); // customer|business
            $table->foreignUuid('cancelled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('cancelled_at')->nullable();
            $table->string('refund_status')->nullable(); // pending|approved|waived - generic refund review

            /* Timestamps */
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rentals');
    }
};
