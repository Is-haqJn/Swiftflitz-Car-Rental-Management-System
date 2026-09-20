<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('airport_cancellation.free_cancellation_hours', 24);
        $this->migrator->add('airport_cancellation.cancellation_fee_type', 'flat');
        $this->migrator->add('airport_cancellation.cancellation_fee_amount', 0.0);
    }
};
