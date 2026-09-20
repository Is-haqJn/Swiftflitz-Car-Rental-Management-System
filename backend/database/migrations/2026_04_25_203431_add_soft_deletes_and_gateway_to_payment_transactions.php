<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->decimal('gateway_amount', 15, 2)->nullable()->after('amount');
            $table->string('gateway_currency', 10)->nullable()->after('gateway_amount');
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn(['gateway_amount', 'gateway_currency']);
        });
    }
};
