<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->update('homepage.counter_title', fn () => 'Trusted by Ghanaians');
        $this->migrator->update('homepage.counter_large_title', fn () => 'Our Numbers Speak for Themselves');
        $this->migrator->update('homepage.counter_cards', fn () => [
            [
                'icon_url' => 'assets/images/icons/rental.png',
                'prefix' => '',
                'number' => 1200,
                'suffix' => '+',
                'label' => 'Rentals Completed',
            ],
            [
                'icon_url' => 'assets/images/icons/man.png',
                'prefix' => '',
                'number' => 850,
                'suffix' => '+',
                'label' => 'Happy Customers',
            ],
            [
                'icon_url' => 'assets/images/icons/car-insurance.png',
                'prefix' => '',
                'number' => 40,
                'suffix' => '+',
                'label' => 'Vehicles in Fleet',
            ],
            [
                'icon_url' => 'assets/images/icons/work-time.png',
                'prefix' => '',
                'number' => 5,
                'suffix' => '+',
                'label' => 'Years in Business',
            ],
        ]);
    }
};
