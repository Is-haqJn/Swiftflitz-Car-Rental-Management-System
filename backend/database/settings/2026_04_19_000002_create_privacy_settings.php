<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('privacy.banner_title', 'Privacy Policy');
        $this->migrator->add('privacy.banner_image_version', 1);
        $this->migrator->add('privacy.content', '');
    }
};
