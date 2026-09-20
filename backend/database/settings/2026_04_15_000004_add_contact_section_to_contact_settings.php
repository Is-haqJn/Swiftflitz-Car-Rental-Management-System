<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('contact.contact_section_large_title', 'Get In Touch');
        $this->migrator->add('contact.contact_section_bg_image_version', 1);
        $this->migrator->add('contact.contact_info_items', [
            [
                'icon' => 'LuPhoneCall',
                'title' => 'Phone',
                'content' => '+233 XX XXX XXXX',
            ],
            [
                'icon' => 'LuMail',
                'title' => 'Email',
                'content' => 'info@swiftflitz.com',
            ],
            [
                'icon' => 'LuHouse',
                'title' => 'Address',
                'content' => '55/11 Ronin Tower, Accra',
            ],
        ]);
        $this->migrator->add('contact.contact_socials_enabled', true);
        $this->migrator->add('contact.contact_socials_title', 'Follow Us');
        $this->migrator->add('contact.contact_socials', [
            ['icon' => 'FaXTwitter', 'url' => 'https://www.x.com'],
            ['icon' => 'FaFacebook', 'url' => 'https://www.facebook.com'],
            ['icon' => 'FaInstagram', 'url' => 'https://www.instagram.com'],
            ['icon' => 'FaPinterest', 'url' => 'https://www.pinterest.com'],
        ]);
    }
};
