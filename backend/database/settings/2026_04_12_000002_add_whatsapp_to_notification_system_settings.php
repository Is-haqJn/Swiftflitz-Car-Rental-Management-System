<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('notifications.whatsapp_new_booking', false);
        $this->migrator->add('notifications.whatsapp_return_reminder', false);
        $this->migrator->add('notifications.whatsapp_overdue_alert', false);
        $this->migrator->add('notifications.whatsapp_quote_request', false);
        $this->migrator->add('notifications.whatsapp_vehicle_expiry', false);
        $this->migrator->add('notifications.whatsapp_pickup_reminder', false);
        $this->migrator->add('notifications.whatsapp_rental_status_change', false);
        $this->migrator->add('notifications.whatsapp_payment_confirmation', false);
        $this->migrator->add('notifications.whatsapp_document_expiry_alert', false);
    }
};
