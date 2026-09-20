<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->rename('whatsapp.api_key', 'whatsapp.access_token');
        $this->migrator->add('whatsapp.test_mode', false);
        $this->migrator->add('whatsapp.test_phone_number', null);
        $this->migrator->add('whatsapp.admin_only_mode', false);
        $this->migrator->add('whatsapp.admin_phone_number', null);
        $this->migrator->add('whatsapp.notify_customers', true);
        $this->migrator->add('whatsapp.send_pickup_reminder', false);
        $this->migrator->add('whatsapp.send_payment_confirmation', false);
    }
};
