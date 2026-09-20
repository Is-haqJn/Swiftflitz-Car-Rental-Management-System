<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('general.primary_color', null);
        $this->migrator->add('general.secondary_color', null);
        $this->migrator->add('general.secondary_color_2', null);
        $this->migrator->add('general.tertiary_color', null);
        $this->migrator->add('general.site_image_url', null);
    }
};
