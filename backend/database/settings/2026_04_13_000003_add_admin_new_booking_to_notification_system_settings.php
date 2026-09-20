<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('notifications.whatsapp_admin_new_booking', false);
        $this->migrator->add('notifications.sms_admin_new_booking', false);
    }
};
