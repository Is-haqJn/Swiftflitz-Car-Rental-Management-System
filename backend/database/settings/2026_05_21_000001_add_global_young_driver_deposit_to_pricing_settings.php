<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('pricing.global_young_driver_age_threshold', null);
        $this->migrator->add('pricing.global_young_driver_deposit', null);
    }
};
