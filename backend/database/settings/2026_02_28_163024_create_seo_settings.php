<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('seo.meta_title', 'Swiftflitz - Car Rental');
        $this->migrator->add('seo.meta_description', 'Premium car rental service');
        $this->migrator->add('seo.meta_keywords', null);
        $this->migrator->add('seo.og_image', null);
        $this->migrator->add('seo.google_analytics_id', null);
        $this->migrator->add('seo.google_tag_manager_id', null);
        $this->migrator->add('seo.facebook_pixel_id', null);
        $this->migrator->add('seo.robots', 'index, follow');
    }
};
