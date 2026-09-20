<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->update('about.general_title', fn () => 'Who We Are');

        $this->migrator->update(
            'about.general_large_title',
            fn () => "Ghana's Trusted Car Rental Partner Since Day One"
        );

        $this->migrator->update(
            'about.general_description',
            fn () => 'At Swiftflitz, we make getting behind the wheel easy, affordable, and hassle-free. Whether you need a vehicle for a quick city trip, a cross-country business journey, or a chauffeur-driven ride, our diverse fleet and dedicated team are ready to serve you anywhere in Ghana. We pride ourselves on transparent pricing, well-maintained vehicles, and a customer-first service that keeps people coming back.'
        );

        $this->migrator->update('about.general_list_items', fn () => [
            'Diverse Fleet for Every Budget',
            '24/7 Roadside Assistance Nationwide',
            'Transparent Pricing - No Hidden Fees',
        ]);
    }
};
