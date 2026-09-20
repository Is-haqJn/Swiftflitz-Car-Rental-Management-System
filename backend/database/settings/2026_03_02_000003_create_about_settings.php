<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('about.hero_title', 'About Us');
        $this->migrator->add('about.hero_subtitle', 'Learn more about our story');
        $this->migrator->add('about.hero_image_url', null);
        $this->migrator->add('about.story_title', 'Our Story');
        $this->migrator->add('about.story_content', '');
        $this->migrator->add('about.mission', '');
        $this->migrator->add('about.vision', '');
        $this->migrator->add('about.values', null);
    }
};
