<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('chauffeur.grace_period_minutes', 30);
        $this->migrator->add('chauffeur.cancellation_flat_fee', 0.0);
        $this->migrator->add('chauffeur.overtime_charge_per_hour', 0.0);
        $this->migrator->add('chauffeur.no_show_fee', 0.0);
    }
};
