<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('services.banner_title', 'SERVICES');
        $this->migrator->add('services.banner_image_version', 1);
    }
};
