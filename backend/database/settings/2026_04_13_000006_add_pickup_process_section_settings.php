<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('homepage.show_pickup_process_section', true);
        $this->migrator->add('homepage.pickup_process_title', 'How it Work');
        $this->migrator->add('homepage.pickup_process_large_title', 'Following Working Steps');
        $this->migrator->add('homepage.pickup_process_bg_image_version', 1);
        $this->migrator->add('homepage.pickup_process_bottom_image_version', 1);
        $this->migrator->add('homepage.pickup_process_steps', [
            ['number' => '01', 'title' => 'Choose A Car', 'description' => 'Check out our range of cars and choose the car of your choice'],
            ['number' => '02', 'title' => 'Pick Up Date', 'description' => 'Check out our range of cars and choose the car of your choice'],
            ['number' => '03', 'title' => 'Confirm Your Booking', 'description' => 'Check out our range of cars and choose the car of your choice'],
            ['number' => '04', 'title' => 'Enjoy Driving', 'description' => 'Check out our range of cars and choose the car of your choice'],
        ]);
    }
};
