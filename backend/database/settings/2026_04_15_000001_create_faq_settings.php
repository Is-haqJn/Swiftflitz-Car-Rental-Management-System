<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('faq.banner_title', "FAQ's");
        $this->migrator->add('faq.banner_image_version', 1);
    }
};
