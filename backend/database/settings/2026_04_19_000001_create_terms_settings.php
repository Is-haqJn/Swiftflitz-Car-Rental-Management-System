<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('terms.banner_title', 'Terms & Conditions');
        $this->migrator->add('terms.banner_image_version', 1);
        $this->migrator->add('terms.content', '');
    }
};
