<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->update('homepage.why_title', fn () => 'Why Choose Swiftflitz');

        $this->migrator->update(
            'homepage.why_large_title',
            fn () => 'The Smarter Way to Rent a Car in Ghana'
        );

        $this->migrator->update('homepage.why_cards', fn () => [
            [
                'image_url' => 'assets/images/icons/label.png',
                'title' => 'Unbeatable Value, Every Time',
                'description' => 'From daily commutes to long-haul trips, we offer competitive rates with zero surprise charges. What you see is what you pay - always.',
            ],
            [
                'image_url' => 'assets/images/icons/customer-support.png',
                'title' => 'A Fleet Built for Every Journey',
                'description' => 'From sleek sedans for business trips to spacious SUVs for family getaways, our well-maintained fleet has the right vehicle for wherever life takes you.',
            ],
            [
                'image_url' => 'assets/images/icons/parking-area.png',
                'title' => 'Pickup Your Way',
                'description' => 'Choose from multiple convenient pickup locations across Ghana, or let us come to you. Getting your vehicle should never be the hard part.',
            ],
        ]);
    }
};
