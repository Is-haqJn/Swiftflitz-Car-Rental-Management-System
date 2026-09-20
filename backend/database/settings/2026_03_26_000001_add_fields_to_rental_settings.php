<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('rental.allow_online_booking', false);
        $this->migrator->add('rental.booking_requires_confirmation', true);
        $this->migrator->add('rental.booking_grace_period_hours', 2);
        $this->migrator->add('rental.vat_enabled', false);
        $this->migrator->add('rental.vat_rate', 15.0);
    }
};
