<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('services.why_choose_us_enabled', true);
        $this->migrator->add('services.why_choose_us_bg_image_version', 1);
        $this->migrator->add('services.why_choose_us_title', 'WHY SWIFTFLITZ');
        $this->migrator->add('services.why_choose_us_large_title', 'The Swiftflitz Difference');
        $this->migrator->add('services.why_choose_us_cards', [
            [
                'number' => '01',
                'title' => 'Wide Fleet Selection',
                'description' => 'From economy cars to luxury SUVs for every budget and occasion.',
            ],
            [
                'number' => '02',
                'title' => 'Transparent Pricing',
                'description' => 'No hidden fees - what you see is what you pay, every time.',
            ],
            [
                'number' => '03',
                'title' => '24/7 Support',
                'description' => 'Our team is always available whenever you need us, day or night.',
            ],
            [
                'number' => '04',
                'title' => 'Fast & Easy Booking',
                'description' => 'Reserve your vehicle online in under 3 minutes with instant confirmation.',
            ],
        ]);
    }
};
