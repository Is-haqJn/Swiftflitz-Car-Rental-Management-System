<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('homepage.why_title', 'One step towards you');
        $this->migrator->add('homepage.why_large_title', "Let's Your Adventure Begin");
        $this->migrator->add('homepage.why_bg_image_version', 1);
        $this->migrator->add('homepage.why_cards', [
            [
                'image_url' => 'assets/images/icons/label.png',
                'title' => 'Deals For Every Budget',
                'description' => 'Incredible prices on every car, van, bike and package worldwide Book vehicles at incredible prices worldwide',
            ],
            [
                'image_url' => 'assets/images/icons/customer-support.png',
                'title' => '24/7 Road Assistance',
                'description' => 'We are ready to assist you and provide reliable support. Who Will keep you moving forward with confidence and mental peace.',
            ],
            [
                'image_url' => 'assets/images/icons/parking-area.png',
                'title' => 'Free Pick-Up & Drop-Off',
                'description' => 'Enjoy free pickup and drop-off services, which adds an extra layer of ease to your car rental experience.',
            ],
        ]);
        $this->migrator->add('homepage.show_why_choose_us_section', true);
    }
};
