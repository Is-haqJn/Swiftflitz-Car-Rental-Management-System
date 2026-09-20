<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('homepage.show_counter_section', true);
        $this->migrator->add('homepage.counter_title', 'Find your car by car brand');
        $this->migrator->add('homepage.counter_large_title', 'Wide Range Of Commercial And Luxury Cars');
        $this->migrator->add('homepage.counter_cards', [
            ['icon_url' => 'assets/images/icons/rental.png', 'prefix' => '', 'number' => 4500, 'suffix' => '+', 'label' => 'Client Served'],
            ['icon_url' => 'assets/images/icons/man.png', 'prefix' => '', 'number' => 2750, 'suffix' => '+', 'label' => 'Happy Customers'],
            ['icon_url' => 'assets/images/icons/car-insurance.png', 'prefix' => '', 'number' => 600, 'suffix' => '+', 'label' => 'Vehicle In Stock Cars'],
            ['icon_url' => 'assets/images/icons/work-time.png', 'prefix' => '', 'number' => 12, 'suffix' => '+', 'label' => 'Years Experience'],
        ]);
    }
};
