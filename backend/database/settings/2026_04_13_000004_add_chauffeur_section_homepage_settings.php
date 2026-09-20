<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('homepage.chauffeur_title', 'Car Brands');
        $this->migrator->add('homepage.chauffeur_large_title', 'Explore Our Premium Brands');
        $this->migrator->add('homepage.chauffeur_image_version', 1);
        $this->migrator->add('homepage.chauffeur_cta_text', 'View All Brands');
        $this->migrator->add('homepage.chauffeur_cta_url', '/fleet');
    }
};
