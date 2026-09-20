<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fleet_vehicles', function (Blueprint $table) {
            $table->foreignUuid('default_driver_id')
                ->nullable()
                ->after('branch_id')
                ->constrained('drivers')
                ->nullOnDelete();

            $table->boolean('is_personal_vehicle')
                ->default(false)
                ->after('default_driver_id');
        });
    }

    public function down(): void
    {
        Schema::table('fleet_vehicles', function (Blueprint $table) {
            $table->dropForeign(['default_driver_id']);
            $table->dropColumn(['default_driver_id', 'is_personal_vehicle']);
        });
    }
};
