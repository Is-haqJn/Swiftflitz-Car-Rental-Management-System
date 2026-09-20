<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('general.site_name', 'Swiftflitz');
        $this->migrator->add('general.site_email', 'info@swiftflitz.com');
        $this->migrator->add('general.site_phone', '+233 531804962');
        $this->migrator->add('general.site_address', '');
        $this->migrator->add('general.currency', 'GHS');
        $this->migrator->add('general.currency_symbol', '₵');
        $this->migrator->add('general.timezone', 'Africa/Accra');
        $this->migrator->add('general.logo_url', null);
        $this->migrator->add('general.favicon_url', null);
    }
};
