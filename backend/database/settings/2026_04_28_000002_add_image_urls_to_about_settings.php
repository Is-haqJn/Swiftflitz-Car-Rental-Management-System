<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('about.general_bg_image_url', null);
        $this->migrator->add('about.general_overlay_image_url', null);
        $this->migrator->add('about.values_bg_image_url', null);
    }
};
