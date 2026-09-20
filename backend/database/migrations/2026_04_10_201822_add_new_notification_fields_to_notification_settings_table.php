<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notification_settings', function (Blueprint $table): void {
            $table->boolean('rental_status_change')->default(true)->after('pickup_reminder');
            $table->boolean('payment_confirmation')->default(true)->after('rental_status_change');
            $table->boolean('document_expiry_alert')->default(true)->after('payment_confirmation');
            $table->boolean('email_rental_status_change')->default(true)->after('email_pickup_reminder');
            $table->boolean('email_payment_confirmation')->default(true)->after('email_rental_status_change');
            $table->boolean('email_document_expiry_alert')->default(true)->after('email_payment_confirmation');
        });
    }

    public function down(): void
    {
        Schema::table('notification_settings', function (Blueprint $table): void {
            $table->dropColumn([
                'rental_status_change',
                'payment_confirmation',
                'document_expiry_alert',
                'email_rental_status_change',
                'email_payment_confirmation',
                'email_document_expiry_alert',
            ]);
        });
    }
};
