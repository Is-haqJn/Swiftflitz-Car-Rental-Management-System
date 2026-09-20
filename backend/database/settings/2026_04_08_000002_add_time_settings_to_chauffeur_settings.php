<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('chauffeur.standard_return_time', '20:00');
        $this->migrator->add('chauffeur.booking_window_start', '08:00');
        $this->migrator->add('chauffeur.booking_window_end', '20:00');
    }
};
