<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('sms.admin_only_phone_number', null);
        $this->migrator->add('sms.mirror_mode', false);
    }
};
