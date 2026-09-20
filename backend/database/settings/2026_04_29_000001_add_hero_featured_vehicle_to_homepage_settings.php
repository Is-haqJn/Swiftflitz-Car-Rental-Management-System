<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('homepage.hero_featured_vehicle_enabled', true);
        $this->migrator->add('homepage.hero_featured_vehicle_visibility', 'all');
        $this->migrator->add('homepage.hero_featured_vehicle_mode', 'custom');
        $this->migrator->add('homepage.hero_featured_vehicle_id', null);
        $this->migrator->add('homepage.hero_featured_vehicle_custom_title', 'Harley Davidson');
        $this->migrator->add('homepage.hero_featured_vehicle_custom_price', 'GHC800');
    }
};
