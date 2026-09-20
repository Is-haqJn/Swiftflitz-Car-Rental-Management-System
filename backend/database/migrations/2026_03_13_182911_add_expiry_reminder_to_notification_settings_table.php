<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notification_settings', function (Blueprint $table) {
            $table->boolean('vehicle_expiry')->default(true)->after('quote_request');
            $table->boolean('pickup_reminder')->default(true)->after('vehicle_expiry');
            $table->boolean('email_vehicle_expiry')->default(true)->after('email_quote_request');
            $table->boolean('email_pickup_reminder')->default(true)->after('email_vehicle_expiry');
        });
    }

    public function down(): void
    {
        Schema::table('notification_settings', function (Blueprint $table) {
            $table->dropColumn([
                'vehicle_expiry',
                'pickup_reminder',
                'email_vehicle_expiry',
                'email_pickup_reminder',
            ]);
        });
    }
};
