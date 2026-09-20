<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $adminTypes = [
            'rental_cancelled',
            'pickup_reminder',
            'return_reminder',
            'overdue_alert',
            'payment_confirmation',
            'rental_status_change',
            'airport_booking',
            'airport_booking_cancelled',
            'chauffeur_booking',
            'chauffeur_booking_cancelled',
            'chauffeur_pickup_reminder',
        ];

        foreach ($adminTypes as $type) {
            $this->migrator->add("notifications.whatsapp_admin_{$type}", false);
            $this->migrator->add("notifications.sms_admin_{$type}", false);
        }
    }
};
