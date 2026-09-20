<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('whatsapp.enabled', false);
        $this->migrator->add('whatsapp.api_key', null);
        $this->migrator->add('whatsapp.phone_number_id', null);
        $this->migrator->add('whatsapp.business_account_id', null);
        $this->migrator->add('whatsapp.send_new_booking', false);
        $this->migrator->add('whatsapp.send_return_reminder', false);
        $this->migrator->add('whatsapp.send_overdue_alert', false);
    }
};
