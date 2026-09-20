<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table): void {
            $table->string('currency_symbol', 10)->nullable()->after('currency');
            $table->decimal('exchange_rate', 10, 6)->nullable()->after('currency_symbol');
        });
    }

    public function down(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table): void {
            $table->dropColumn(['currency_symbol', 'exchange_rate']);
        });
    }
};
