<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('about.team_enabled', true);
        $this->migrator->add('about.team_title', 'Swiftflitz Team');
        $this->migrator->add('about.team_large_title', 'The Swiftflitz Team');
        $this->migrator->add('about.team_members', [
            [
                'name' => 'Kevin Martin',
                'position' => 'Sales Consultant',
                'image_url' => '/assets/images/team/1.jpg',
                'socials' => [
                    ['icon' => 'fa-brands fa-x-twitter', 'url' => 'https://www.x.com'],
                    ['icon' => 'fa-brands fa-facebook-f', 'url' => 'https://www.facebook.com'],
                    ['icon' => 'fa-brands fa-instagram', 'url' => 'https://www.instagram.com'],
                ],
            ],
            [
                'name' => 'Sarah Johnson',
                'position' => 'Fleet Manager',
                'image_url' => '/assets/images/team/2.jpg',
                'socials' => [
                    ['icon' => 'fa-brands fa-linkedin-in', 'url' => 'https://www.linkedin.com'],
                    ['icon' => 'fa-brands fa-instagram', 'url' => 'https://www.instagram.com'],
                ],
            ],
            [
                'name' => 'Michael Asante',
                'position' => 'Customer Relations',
                'image_url' => '/assets/images/team/3.jpg',
                'socials' => [
                    ['icon' => 'fa-brands fa-facebook-f', 'url' => 'https://www.facebook.com'],
                    ['icon' => 'fa-brands fa-whatsapp', 'url' => 'https://wa.me/'],
                ],
            ],
            [
                'name' => 'Abena Mensah',
                'position' => 'Operations Lead',
                'image_url' => '/assets/images/team/4.jpg',
                'socials' => [
                    ['icon' => 'fa-brands fa-linkedin-in', 'url' => 'https://www.linkedin.com'],
                    ['icon' => 'fa-brands fa-x-twitter', 'url' => 'https://www.x.com'],
                ],
            ],
        ]);
    }
};
