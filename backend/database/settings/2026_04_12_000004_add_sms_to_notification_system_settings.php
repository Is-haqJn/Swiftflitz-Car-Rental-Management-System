<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('notifications.sms_new_booking', false);
        $this->migrator->add('notifications.sms_return_reminder', false);
        $this->migrator->add('notifications.sms_overdue_alert', false);
        $this->migrator->add('notifications.sms_quote_request', false);
        $this->migrator->add('notifications.sms_vehicle_expiry', false);
        $this->migrator->add('notifications.sms_pickup_reminder', false);
        $this->migrator->add('notifications.sms_rental_status_change', false);
        $this->migrator->add('notifications.sms_payment_confirmation', false);
        $this->migrator->add('notifications.sms_document_expiry_alert', false);
    }
};
