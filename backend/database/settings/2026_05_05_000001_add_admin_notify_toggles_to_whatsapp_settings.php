<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('whatsapp.notify_admins', false);
        $this->migrator->add('whatsapp.send_admin_rental_cancelled', false);
        $this->migrator->add('whatsapp.send_admin_pickup_reminder', false);
        $this->migrator->add('whatsapp.send_admin_return_reminder', false);
        $this->migrator->add('whatsapp.send_admin_overdue_alert', false);
        $this->migrator->add('whatsapp.send_admin_payment_confirmation', false);
        $this->migrator->add('whatsapp.send_admin_rental_status_change', false);
        $this->migrator->add('whatsapp.send_admin_airport_booking', false);
        $this->migrator->add('whatsapp.send_admin_airport_booking_cancelled', false);
        $this->migrator->add('whatsapp.send_admin_chauffeur_booking', false);
        $this->migrator->add('whatsapp.send_admin_chauffeur_booking_cancelled', false);
        $this->migrator->add('whatsapp.send_admin_chauffeur_pickup_reminder', false);
    }
};
