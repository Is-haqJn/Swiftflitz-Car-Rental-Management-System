<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('sms.hubtel_sms_client_id', null);
        $this->migrator->add('sms.hubtel_sms_client_secret', null);
        $this->migrator->add('sms.hubtel_sms_sender_id', null);
    }
};
