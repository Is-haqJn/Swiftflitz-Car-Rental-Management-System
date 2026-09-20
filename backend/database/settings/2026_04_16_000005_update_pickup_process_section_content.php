<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->update('homepage.pickup_process_title', fn () => 'How It Works');
        $this->migrator->update('homepage.pickup_process_large_title', fn () => 'Your Ride in 4 Simple Steps');
        $this->migrator->update('homepage.pickup_process_steps', fn () => [
            [
                'number' => '01',
                'title' => 'Browse & Pick a Vehicle',
                'description' => 'Explore our diverse fleet and select the vehicle that fits your trip - whether it\'s a saloon, SUV, or van.',
            ],
            [
                'number' => '02',
                'title' => 'Set Your Dates & Location',
                'description' => 'Choose your preferred pickup date, time, and location. We have multiple spots across Ghana for your convenience.',
            ],
            [
                'number' => '03',
                'title' => 'Confirm & Pay Securely',
                'description' => 'Review your booking summary, apply any discount codes, and complete your secure payment in minutes.',
            ],
            [
                'number' => '04',
                'title' => 'Hit the Road',
                'description' => 'Your vehicle will be ready and waiting. Pick it up, sign off, and enjoy the drive - we handle the rest.',
            ],
        ]);
    }
};
