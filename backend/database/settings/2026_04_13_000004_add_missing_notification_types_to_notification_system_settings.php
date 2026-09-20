<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        /* Airport Booking */
        $this->migrator->add('notifications.airport_booking', true);
        $this->migrator->add('notifications.email_airport_booking', true);
        $this->migrator->add('notifications.whatsapp_airport_booking', false);
        $this->migrator->add('notifications.sms_airport_booking', false);

        $this->migrator->add('notifications.airport_booking_cancelled', true);
        $this->migrator->add('notifications.email_airport_booking_cancelled', true);
        $this->migrator->add('notifications.whatsapp_airport_booking_cancelled', false);
        $this->migrator->add('notifications.sms_airport_booking_cancelled', false);

        $this->migrator->add('notifications.airport_booking_status_changed', true);
        $this->migrator->add('notifications.whatsapp_airport_booking_status_changed', false);
        $this->migrator->add('notifications.sms_airport_booking_status_changed', false);

        /* Chauffeur Booking */
        $this->migrator->add('notifications.chauffeur_booking', true);
        $this->migrator->add('notifications.email_chauffeur_booking', true);
        $this->migrator->add('notifications.whatsapp_chauffeur_booking', false);
        $this->migrator->add('notifications.sms_chauffeur_booking', false);

        $this->migrator->add('notifications.chauffeur_booking_cancelled', true);
        $this->migrator->add('notifications.email_chauffeur_booking_cancelled', true);
        $this->migrator->add('notifications.whatsapp_chauffeur_booking_cancelled', false);
        $this->migrator->add('notifications.sms_chauffeur_booking_cancelled', false);

        $this->migrator->add('notifications.chauffeur_booking_status_changed', true);
        $this->migrator->add('notifications.whatsapp_chauffeur_booking_status_changed', false);
        $this->migrator->add('notifications.sms_chauffeur_booking_status_changed', false);

        $this->migrator->add('notifications.chauffeur_pickup_reminder', true);
        $this->migrator->add('notifications.email_chauffeur_pickup_reminder', true);
        $this->migrator->add('notifications.whatsapp_chauffeur_pickup_reminder', false);
        $this->migrator->add('notifications.sms_chauffeur_pickup_reminder', false);

        /* Rental Cancellation */
        $this->migrator->add('notifications.rental_cancelled', true);
        $this->migrator->add('notifications.email_rental_cancelled', true);
        $this->migrator->add('notifications.whatsapp_rental_cancelled', false);
        $this->migrator->add('notifications.sms_rental_cancelled', false);

        /* Driver Document Expiry */
        $this->migrator->add('notifications.driver_document_expiry', true);
        $this->migrator->add('notifications.email_driver_document_expiry', true);
        $this->migrator->add('notifications.whatsapp_driver_document_expiry', false);
        $this->migrator->add('notifications.sms_driver_document_expiry', false);
    }
};
