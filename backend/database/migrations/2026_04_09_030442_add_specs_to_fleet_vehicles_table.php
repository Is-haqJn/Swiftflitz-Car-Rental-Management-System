<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fleet_vehicles', function (Blueprint $table) {
            $table->string('transmission')->nullable()->after('seats');
            $table->string('fuel_type')->nullable()->after('transmission');
            $table->string('engine')->nullable()->after('fuel_type');
        });
    }

    public function down(): void
    {
        Schema::table('fleet_vehicles', function (Blueprint $table) {
            $table->dropColumn(['transmission', 'fuel_type', 'engine']);
        });
    }
};
