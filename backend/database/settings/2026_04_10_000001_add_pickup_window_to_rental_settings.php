<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('rental.pickup_window_start', '08:00');
        $this->migrator->add('rental.pickup_window_end', '20:00');
    }
};
