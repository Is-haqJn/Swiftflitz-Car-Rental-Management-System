<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {
            /* Composite index for revenue/dashboard queries filtering by status + paid_at */
            $table->index(['status', 'paid_at'], 'payment_transactions_status_paid_at_index');

            /* Composite index for branch-scoped revenue queries */
            $table->index(['branch_id', 'status', 'paid_at'], 'payment_transactions_branch_status_paid_at_index');

            /*
             * Unique index on (provider, provider_reference) to prevent duplicate
             * Hubtel checkoutId inserts. MySQL allows multiple NULLs in a unique
             * index so existing NULL provider_reference rows are unaffected.
             */
            $table->unique(['provider', 'provider_reference'], 'payment_transactions_provider_ref_unique');
        });
    }

    public function down(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->dropIndex('payment_transactions_status_paid_at_index');
            $table->dropIndex('payment_transactions_branch_status_paid_at_index');
            $table->dropUnique('payment_transactions_provider_ref_unique');
        });
    }
};
