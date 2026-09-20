<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('homepage.featured_title', 'Choose your car');
        $this->migrator->add('homepage.featured_large_title', 'Our Featured Vehicles');
        $this->migrator->add('homepage.featured_empty_text', 'No featured vehicles at the moment.');
    }
};
