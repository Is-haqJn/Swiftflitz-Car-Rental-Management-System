<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('whatsapp.app_secret', null);
        $this->migrator->add('whatsapp.webhook_verify_token', null);
    }
};
