<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('cancellation.free_cancellation_window_hours', 24);
        $this->migrator->add('cancellation.no_show_grace_period_hours', 2);
        $this->migrator->add('cancellation.before_pickup_cancellation_fee', 0.0);
        $this->migrator->add('cancellation.modification_fee', 0.0);
        $this->migrator->add('cancellation.modification_free_window_hours', 24);
        $this->migrator->add('cancellation.after_pickup_cancellation_fee', 0.0);
    }
};
