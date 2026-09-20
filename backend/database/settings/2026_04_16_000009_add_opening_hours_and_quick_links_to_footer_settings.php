<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('footer.opening_hours_title', 'Opening Hours');
        $this->migrator->add('footer.opening_hours', [
            ['days' => 'Monday - Friday', 'time' => '09:00 AM - 09:00 PM'],
            ['days' => 'Saturday', 'time' => '09:00 AM - 07:00 PM'],
            ['days' => 'Sunday', 'time' => 'Closed'],
        ]);
        $this->migrator->add('footer.quick_links_title', 'Quick Links');
        $this->migrator->add('footer.quick_links', [
            ['name' => 'About Us', 'url' => '/about'],
            ['name' => "FAQ's", 'url' => '/faqs'],
            ['name' => 'Services', 'url' => '/services'],
            ['name' => 'Team', 'url' => '/team'],
            ['name' => 'Contact', 'url' => '/contact'],
        ]);
    }
};
