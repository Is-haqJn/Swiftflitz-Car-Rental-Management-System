<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('header.logo_url', null);
        $this->migrator->add('header.tagline', null);
        $this->migrator->add('header.phone', '');
        $this->migrator->add('header.email', '');
        $this->migrator->add('header.cta_text', 'Book Now');
        $this->migrator->add('header.cta_url', '/listing');
    }
};
