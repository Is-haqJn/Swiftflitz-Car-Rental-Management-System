<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('whatsapp.admin_only_phone_number', null);
        $this->migrator->add('whatsapp.mirror_mode', false);
    }
};
