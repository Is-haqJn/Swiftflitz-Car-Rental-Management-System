<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notification_settings', function (Blueprint $table) {
            $table->boolean('rental_cancelled')->default(true)->after('document_expiry_alert');
            $table->boolean('airport_booking')->default(true)->after('rental_cancelled');
            $table->boolean('airport_booking_cancelled')->default(true)->after('airport_booking');
            $table->boolean('airport_booking_status_changed')->default(true)->after('airport_booking_cancelled');
            $table->boolean('chauffeur_booking')->default(true)->after('airport_booking_status_changed');
            $table->boolean('chauffeur_booking_cancelled')->default(true)->after('chauffeur_booking');
            $table->boolean('chauffeur_booking_status_changed')->default(true)->after('chauffeur_booking_cancelled');
            $table->boolean('chauffeur_pickup_reminder')->default(true)->after('chauffeur_booking_status_changed');
            $table->boolean('driver_document_expiry')->default(true)->after('chauffeur_pickup_reminder');
            $table->boolean('email_rental_cancelled')->default(true)->after('email_document_expiry_alert');
            $table->boolean('email_airport_booking')->default(true)->after('email_rental_cancelled');
            $table->boolean('email_airport_booking_cancelled')->default(true)->after('email_airport_booking');
            $table->boolean('email_airport_booking_status_changed')->default(true)->after('email_airport_booking_cancelled');
            $table->boolean('email_chauffeur_booking')->default(true)->after('email_airport_booking_status_changed');
            $table->boolean('email_chauffeur_booking_cancelled')->default(true)->after('email_chauffeur_booking');
            $table->boolean('email_chauffeur_booking_status_changed')->default(true)->after('email_chauffeur_booking_cancelled');
            $table->boolean('email_chauffeur_pickup_reminder')->default(true)->after('email_chauffeur_booking_status_changed');
            $table->boolean('email_driver_document_expiry')->default(true)->after('email_chauffeur_pickup_reminder');
        });
    }

    public function down(): void
    {
        Schema::table('notification_settings', function (Blueprint $table) {
            $table->dropColumn([
                'rental_cancelled',
                'airport_booking',
                'airport_booking_cancelled',
                'airport_booking_status_changed',
                'chauffeur_booking',
                'chauffeur_booking_cancelled',
                'chauffeur_booking_status_changed',
                'chauffeur_pickup_reminder',
                'driver_document_expiry',
                'email_rental_cancelled',
                'email_airport_booking',
                'email_airport_booking_cancelled',
                'email_airport_booking_status_changed',
                'email_chauffeur_booking',
                'email_chauffeur_booking_cancelled',
                'email_chauffeur_booking_status_changed',
                'email_chauffeur_pickup_reminder',
                'email_driver_document_expiry',
            ]);
        });
    }
};
