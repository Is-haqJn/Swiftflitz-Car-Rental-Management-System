<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('homepage.categories_title', 'Categories');
        $this->migrator->add('homepage.categories_large_title', 'A Look At All Types Of Vehicles');
    }
};
