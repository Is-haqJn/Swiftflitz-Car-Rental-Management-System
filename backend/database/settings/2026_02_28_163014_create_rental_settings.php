<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('rental.min_rental_days', 1);
        $this->migrator->add('rental.max_rental_days', 365);
        $this->migrator->add('rental.booking_advance_days', 0);
        $this->migrator->add('rental.require_license_verification', true);
        $this->migrator->add('rental.allow_public_booking', true);
        $this->migrator->add('rental.auto_confirm_bookings', false);
        $this->migrator->add('rental.overdue_check_hour', 8);
        $this->migrator->add('rental.return_reminder_hours_before', '24');
    }
};
