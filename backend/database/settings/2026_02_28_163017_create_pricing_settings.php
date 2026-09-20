<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('pricing.default_daily_rate', 100.0);
        $this->migrator->add('pricing.weekly_discount_percentage', 10.0);
        $this->migrator->add('pricing.monthly_discount_percentage', 20.0);
        $this->migrator->add('pricing.show_prices_on_website', true);
        $this->migrator->add('pricing.deposit_percentage', 20.0);
        $this->migrator->add('pricing.charge_deposit', false);
    }
};
