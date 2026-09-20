<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
         * Widen all decimal(10,2) monetary columns to decimal(15,2).
         * decimal(10,2) max = 99,999,999.99 - insufficient for NGN branches
         * where values can exceed ₦100,000,000. decimal(15,2) = 9,999,999,999,999.99.
         *
         * All previously defined column attributes (nullable, default, unsigned)
         * are preserved as required by Laravel's ->change() modifier.
         */

        Schema::table('rentals', function (Blueprint $table) {
            $table->decimal('daily_rate', 15, 2)->change();
            $table->decimal('base_cost', 15, 2)->change();
            $table->decimal('extras_cost', 15, 2)->default('0.00')->change();
            $table->decimal('additional_charges', 15, 2)->default('0.00')->change();
            $table->decimal('location_charge', 15, 2)->default('0.00')->change();
            $table->decimal('subtotal', 15, 2)->change();
            $table->decimal('vat_amount', 15, 2)->nullable()->change();
            $table->decimal('total_cost', 15, 2)->change();
            $table->decimal('rule_discount_amount', 15, 2)->default('0.00')->change();
            $table->decimal('coupon_discount_amount', 15, 2)->default('0.00')->change();
            $table->decimal('manual_discount_amount', 15, 2)->default('0.00')->change();
            $table->decimal('total_discount_amount', 15, 2)->default('0.00')->change();
            $table->decimal('amount_paid', 15, 2)->default('0.00')->change();
            $table->decimal('security_deposit_amount', 15, 2)->nullable()->change();
            $table->decimal('deposit_paid', 15, 2)->default('0.00')->change();
            $table->decimal('deposit_refunded', 15, 2)->default('0.00')->change();
            $table->decimal('deposit_applied_to_balance', 15, 2)->default('0.00')->change();
            $table->decimal('overdue_fee', 15, 2)->nullable()->change();
            $table->decimal('late_pickup_fee', 15, 2)->nullable()->change();
            $table->decimal('vehicle_switch_fee', 15, 2)->nullable()->change();
            $table->decimal('early_return_refund', 15, 2)->default('0.00')->change();
            $table->decimal('early_return_charge', 15, 2)->nullable()->change();
            $table->decimal('estimated_repair_cost', 15, 2)->nullable()->change();
            $table->decimal('actual_repair_cost', 15, 2)->nullable()->change();
            $table->decimal('damage_balance_due', 15, 2)->nullable()->change();
            $table->decimal('cancellation_fee', 15, 2)->nullable()->change();
            $table->decimal('days_used_cost', 15, 2)->nullable()->change();
            $table->decimal('refund_amount', 15, 2)->nullable()->change();
            $table->decimal('cancellation_amount_owed', 15, 2)->nullable()->change();
            $table->decimal('cancellation_deposit_deduction', 15, 2)->nullable()->change();
            $table->decimal('cancellation_debt_paid', 15, 2)->nullable()->change();
        });

        Schema::table('airport_bookings', function (Blueprint $table) {
            $table->decimal('package_rate_snapshot', 15, 2)->change();
            $table->decimal('area_charge_snapshot', 15, 2)->default('0.00')->change();
            $table->decimal('vat_amount', 15, 2)->change();
            $table->decimal('coupon_discount_snapshot', 15, 2)->default('0.00')->change();
            $table->decimal('total_amount', 15, 2)->change();
            $table->decimal('cancellation_fee_applied', 15, 2)->nullable()->change();
        });

        Schema::table('chauffeur_bookings', function (Blueprint $table) {
            $table->decimal('base_price_snapshot', 15, 2)->change();
            $table->decimal('pickup_charge_snapshot', 15, 2)->default('0.00')->change();
            $table->decimal('vat_amount', 15, 2)->default('0.00')->change();
            $table->decimal('coupon_discount_snapshot', 15, 2)->default('0.00')->change();
            $table->decimal('overtime_charge', 15, 2)->default('0.00')->change();
            $table->decimal('total_amount', 15, 2)->change();
            $table->decimal('cancellation_fee_applied', 15, 2)->nullable()->change();
            $table->decimal('no_show_fee_applied', 15, 2)->nullable()->change();
        });

        Schema::table('payment_transactions', function (Blueprint $table) {
            /* amount is already decimal(12,2) - widen to decimal(15,2) for consistency */
            $table->decimal('amount', 15, 2)->change();
            $table->decimal('discount_amount', 15, 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->decimal('daily_rate', 10, 2)->change();
            $table->decimal('base_cost', 10, 2)->change();
            $table->decimal('extras_cost', 10, 2)->default('0.00')->change();
            $table->decimal('additional_charges', 10, 2)->default('0.00')->change();
            $table->decimal('location_charge', 10, 2)->default('0.00')->change();
            $table->decimal('subtotal', 10, 2)->change();
            $table->decimal('vat_amount', 10, 2)->nullable()->change();
            $table->decimal('total_cost', 10, 2)->change();
            $table->decimal('rule_discount_amount', 10, 2)->default('0.00')->change();
            $table->decimal('coupon_discount_amount', 10, 2)->default('0.00')->change();
            $table->decimal('manual_discount_amount', 10, 2)->default('0.00')->change();
            $table->decimal('total_discount_amount', 10, 2)->default('0.00')->change();
            $table->decimal('amount_paid', 10, 2)->default('0.00')->change();
            $table->decimal('security_deposit_amount', 10, 2)->nullable()->change();
            $table->decimal('deposit_paid', 10, 2)->default('0.00')->change();
            $table->decimal('deposit_refunded', 10, 2)->default('0.00')->change();
            $table->decimal('deposit_applied_to_balance', 10, 2)->default('0.00')->change();
            $table->decimal('overdue_fee', 10, 2)->nullable()->change();
            $table->decimal('late_pickup_fee', 10, 2)->nullable()->change();
            $table->decimal('vehicle_switch_fee', 10, 2)->nullable()->change();
            $table->decimal('early_return_refund', 10, 2)->default('0.00')->change();
            $table->decimal('early_return_charge', 10, 2)->nullable()->change();
            $table->decimal('estimated_repair_cost', 10, 2)->nullable()->change();
            $table->decimal('actual_repair_cost', 10, 2)->nullable()->change();
            $table->decimal('damage_balance_due', 10, 2)->nullable()->change();
            $table->decimal('cancellation_fee', 10, 2)->nullable()->change();
            $table->decimal('days_used_cost', 10, 2)->nullable()->change();
            $table->decimal('refund_amount', 10, 2)->nullable()->change();
            $table->decimal('cancellation_amount_owed', 10, 2)->nullable()->change();
            $table->decimal('cancellation_deposit_deduction', 10, 2)->nullable()->change();
            $table->decimal('cancellation_debt_paid', 10, 2)->nullable()->change();
        });

        Schema::table('airport_bookings', function (Blueprint $table) {
            $table->decimal('package_rate_snapshot', 10, 2)->change();
            $table->decimal('area_charge_snapshot', 10, 2)->default('0.00')->change();
            $table->decimal('vat_amount', 10, 2)->change();
            $table->decimal('coupon_discount_snapshot', 10, 2)->default('0.00')->change();
            $table->decimal('total_amount', 10, 2)->change();
            $table->decimal('cancellation_fee_applied', 10, 2)->nullable()->change();
        });

        Schema::table('chauffeur_bookings', function (Blueprint $table) {
            $table->decimal('base_price_snapshot', 10, 2)->change();
            $table->decimal('pickup_charge_snapshot', 10, 2)->default('0.00')->change();
            $table->decimal('vat_amount', 10, 2)->default('0.00')->change();
            $table->decimal('coupon_discount_snapshot', 10, 2)->default('0.00')->change();
            $table->decimal('overtime_charge', 10, 2)->default('0.00')->change();
            $table->decimal('total_amount', 10, 2)->change();
            $table->decimal('cancellation_fee_applied', 10, 2)->nullable()->change();
            $table->decimal('no_show_fee_applied', 10, 2)->nullable()->change();
        });

        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->decimal('amount', 12, 2)->change();
            $table->decimal('discount_amount', 10, 2)->nullable()->change();
        });
    }
};
