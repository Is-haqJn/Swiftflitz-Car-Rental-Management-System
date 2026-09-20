<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicle_expenses', function (Blueprint $table) {
            $table->string('currency', 10)->nullable()->after('amount');
            $table->string('currency_symbol', 5)->nullable()->after('currency');
            $table->decimal('exchange_rate', 16, 6)->nullable()->after('currency_symbol');
        });
    }

    public function down(): void
    {
        Schema::table('vehicle_expenses', function (Blueprint $table) {
            $table->dropColumn(['currency', 'currency_symbol', 'exchange_rate']);
        });
    }
};
