<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->delete('pricing.apply_vat');
        $this->migrator->delete('pricing.vat_rate');

        $this->migrator->add('pricing.payment_strict_mode', false);
        $this->migrator->add('pricing.online_deposit_enabled', false);
        $this->migrator->add('pricing.online_deposit_percentage', 30.0);
        $this->migrator->add('pricing.balance_due_window_hours', 48);
        $this->migrator->add('pricing.allow_deposit_waive', true);
    }
};
