<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->update('about.team_members', fn () => [
            [
                'name' => 'Joyce James',
                'position' => 'Founder',
                'image_url' => '/assets/images/team/1.jpg',
                'socials' => [
                    ['icon' => 'fa-brands fa-x-twitter', 'url' => 'https://www.x.com'],
                    ['icon' => 'fa-brands fa-facebook-f', 'url' => 'https://www.facebook.com'],
                    ['icon' => 'fa-brands fa-instagram', 'url' => 'https://www.instagram.com'],
                ],
            ],
            [
                'name' => 'Miracle James',
                'position' => 'Executive Manager',
                'image_url' => '/assets/images/team/2.jpg',
                'socials' => [
                    ['icon' => 'fa-brands fa-linkedin-in', 'url' => 'https://www.linkedin.com'],
                    ['icon' => 'fa-brands fa-instagram', 'url' => 'https://www.instagram.com'],
                ],
            ],
            [
                'name' => 'Ansong-Frimpong Phillips',
                'position' => 'Operations Coordinator',
                'image_url' => '/assets/images/team/3.jpg',
                'socials' => [
                    ['icon' => 'fa-brands fa-facebook-f', 'url' => 'https://www.facebook.com'],
                    ['icon' => 'fa-brands fa-whatsapp', 'url' => 'https://wa.me/'],
                ],
            ],
            [
                'name' => 'Augustus Mensah',
                'position' => 'Sales Executive',
                'image_url' => '/assets/images/team/4.jpg',
                'socials' => [
                    ['icon' => 'fa-brands fa-linkedin-in', 'url' => 'https://www.linkedin.com'],
                    ['icon' => 'fa-brands fa-x-twitter', 'url' => 'https://www.x.com'],
                ],
            ],
        ]);
    }
};
