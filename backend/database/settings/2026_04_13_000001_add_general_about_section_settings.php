<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('about.general_title', 'About Us');
        $this->migrator->add('about.general_large_title', 'We Have Many Provided Assistance To People And Companies In This Field');
        $this->migrator->add('about.general_description', 'We are dedicated to providing the best car rental experience with a wide selection of vehicles to suit every need and budget.');
        $this->migrator->add('about.general_list_items', ['All Type Vehicle Available', 'You Get 24/7 Roadside Assistance', 'We Are The Largest Provider']);
        $this->migrator->add('about.general_bg_image_version', 1);
        $this->migrator->add('about.general_overlay_image_version', 1);
    }
};
