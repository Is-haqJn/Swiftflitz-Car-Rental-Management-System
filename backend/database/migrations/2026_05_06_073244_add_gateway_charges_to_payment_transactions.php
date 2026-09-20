<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->decimal('gateway_charges', 15, 2)->nullable()->after('gateway_amount');
            $table->decimal('customer_amount', 15, 2)->nullable()->after('gateway_charges');
        });
    }

    public function down(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->dropColumn(['gateway_charges', 'customer_amount']);
        });
    }
};
