<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $table): void {
            $table->tinyInteger('young_driver_age_threshold')->nullable()->after('security_deposit');
            $table->decimal('young_driver_deposit', 15, 2)->nullable()->after('young_driver_age_threshold');
        });
    }

    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table): void {
            $table->dropColumn(['young_driver_age_threshold', 'young_driver_deposit']);
        });
    }
};
