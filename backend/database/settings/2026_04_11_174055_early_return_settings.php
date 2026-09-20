<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('early_return.early_return_refund_enabled', true);
        $this->migrator->add('early_return.early_return_charge_enabled', false);
        $this->migrator->add('early_return.early_return_charge_type', 'flat');
        $this->migrator->add('early_return.early_return_flat_rate', 0.0);
        $this->migrator->add('early_return.early_return_threshold_days', 2);
    }
};
