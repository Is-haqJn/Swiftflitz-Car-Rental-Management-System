<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('notifications.email_quote_ready', true);
    }

    public function down(): void
    {
        $this->migrator->delete('notifications.email_quote_ready');
    }
};
