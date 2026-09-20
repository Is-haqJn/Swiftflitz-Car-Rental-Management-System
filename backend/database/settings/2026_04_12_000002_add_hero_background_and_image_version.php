<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        // Replace storage-based hero image URL with a version stamp.
        // The image is now overwritten in place at the fixed asset path.
        $this->migrator->delete('homepage.hero_image_url');
        $this->migrator->add('homepage.hero_image_version', 1);

        // Background watermark text (previously hardcoded "For Rent")
        $this->migrator->add('homepage.hero_background_text', 'For Rent');
    }
};
