<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('notifications.new_booking', true);
        $this->migrator->add('notifications.return_reminder', true);
        $this->migrator->add('notifications.overdue_alert', true);
        $this->migrator->add('notifications.quote_request', true);
        $this->migrator->add('notifications.vehicle_expiry', true);
        $this->migrator->add('notifications.pickup_reminder', true);
        $this->migrator->add('notifications.email_new_booking', true);
        $this->migrator->add('notifications.email_return_reminder', false);
        $this->migrator->add('notifications.email_overdue_alert', false);
        $this->migrator->add('notifications.email_quote_request', false);
        $this->migrator->add('notifications.email_vehicle_expiry', false);
        $this->migrator->add('notifications.email_pickup_reminder', false);
    }
};
