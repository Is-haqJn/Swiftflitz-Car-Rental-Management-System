<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->decimal('exchange_rate', 16, 6)->nullable()->after('currency_symbol');
            $table->boolean('show_converted_price')->default(true)->after('exchange_rate');
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn(['exchange_rate', 'show_converted_price']);
        });
    }
};
