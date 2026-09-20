<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('overdue.overdue_start_type', 'grace_period');
        $this->migrator->add('overdue.grace_period_minutes', 30);
        $this->migrator->add('overdue.overdue_hourly_rate', 0.0);
        $this->migrator->add('overdue.prep_buffer_hours', 1);
        $this->migrator->add('overdue.overdue_threshold_hours', 24);
        $this->migrator->add('overdue.allow_overdue_waive', true);
        $this->migrator->add('overdue.full_day_late_return_waiver', false);
    }
};
