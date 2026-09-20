<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('services.facilities_title', 'Our Services');
        $this->migrator->add('services.facilities_large_title', 'What We Offer');
        $this->migrator->add('services.facilities_cards', [
            [
                'image_url' => 'assets/images/services-cards/car-rental.jpg',
                'title' => 'Car Rental',
                'description' => 'Choose from our wide range of vehicles and enjoy a seamless self-drive rental experience at competitive rates.',
                'button_text' => 'Book Now',
                'button_url' => '/listings',
            ],
            [
                'image_url' => 'assets/images/services-cards/chauffeur.jpg',
                'title' => 'Chauffeur Service',
                'description' => 'Travel in style and comfort with our professional chauffeur-driven vehicles for any occasion.',
                'button_text' => 'Book Now',
                'button_url' => '/chauffeur-services',
            ],
            [
                'image_url' => 'assets/images/services-cards/airport-transfer.jpg',
                'title' => 'Airport Transfer',
                'description' => 'Reliable and punctual airport transfers to and from all major airports, available 24/7.',
                'button_text' => 'Book Now',
                'button_url' => '/airport-transfer',
            ],
        ]);
    }
};
