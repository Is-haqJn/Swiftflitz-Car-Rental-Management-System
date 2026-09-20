<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        /* WhatsApp per-type toggles */
        $this->migrator->add('whatsapp.send_airport_booking', false);
        $this->migrator->add('whatsapp.send_airport_booking_cancelled', false);
        $this->migrator->add('whatsapp.send_airport_booking_status_changed', false);
        $this->migrator->add('whatsapp.send_chauffeur_booking', false);
        $this->migrator->add('whatsapp.send_chauffeur_booking_cancelled', false);
        $this->migrator->add('whatsapp.send_chauffeur_booking_status_changed', false);
        $this->migrator->add('whatsapp.send_chauffeur_pickup_reminder', false);
        $this->migrator->add('whatsapp.send_rental_cancelled', false);
        $this->migrator->add('whatsapp.send_driver_document_expiry', false);

        /* SMS per-type toggles */
        $this->migrator->add('sms.send_airport_booking', false);
        $this->migrator->add('sms.send_airport_booking_cancelled', false);
        $this->migrator->add('sms.send_airport_booking_status_changed', false);
        $this->migrator->add('sms.send_chauffeur_booking', false);
        $this->migrator->add('sms.send_chauffeur_booking_cancelled', false);
        $this->migrator->add('sms.send_chauffeur_booking_status_changed', false);
        $this->migrator->add('sms.send_chauffeur_pickup_reminder', false);
        $this->migrator->add('sms.send_rental_cancelled', false);
        $this->migrator->add('sms.send_driver_document_expiry', false);
    }
};
