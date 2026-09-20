<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->string('currency', 10)->nullable()->after('total_cost');
            $table->string('currency_symbol', 5)->nullable()->after('currency');
            $table->decimal('exchange_rate', 16, 6)->nullable()->after('currency_symbol');
            $table->decimal('total_cost_global', 12, 2)->nullable()->after('exchange_rate');
        });
    }

    public function down(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->dropColumn(['currency', 'currency_symbol', 'exchange_rate', 'total_cost_global']);
        });
    }
};
