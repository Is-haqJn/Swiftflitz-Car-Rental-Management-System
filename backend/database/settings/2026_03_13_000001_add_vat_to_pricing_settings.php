<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('pricing.vat_rate', 0.0);
        $this->migrator->add('pricing.apply_vat', false);
        $this->migrator->add('pricing.weekend_surcharge', 0.0);
        $this->migrator->add('pricing.apply_weekend_surcharge', false);
        $this->migrator->add('pricing.base_pricing_unit', 'day');
    }
};
