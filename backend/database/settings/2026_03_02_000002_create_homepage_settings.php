<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('homepage.hero_title', 'Reliable Car Rental Services');
        $this->migrator->add('homepage.hero_subtitle', 'Drive in Style');
        $this->migrator->add('homepage.hero_description', null);
        $this->migrator->add('homepage.hero_image_url', null);
        $this->migrator->add('homepage.hero_cta_text', 'Rent A Car');
        $this->migrator->add('homepage.hero_cta_url', '/listing');
        $this->migrator->add('homepage.hero_secondary_cta_text', null);
        $this->migrator->add('homepage.hero_secondary_cta_url', null);
        $this->migrator->add('homepage.stats_cars', 0);
        $this->migrator->add('homepage.stats_customers', 0);
        $this->migrator->add('homepage.stats_years', 0);
        $this->migrator->add('homepage.features_title', 'Why Choose Us');
        $this->migrator->add('homepage.features_subtitle', 'Premium service you can count on');
        $this->migrator->add('homepage.features_description', null);
    }
};
