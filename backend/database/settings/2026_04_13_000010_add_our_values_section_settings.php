<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('about.values_enabled', true);
        $this->migrator->add('about.values_title', 'Our Values');
        $this->migrator->add('about.values_large_title', 'What we stand for');
        $this->migrator->add('about.values_bg_image_version', 1);
        $this->migrator->add('about.values_cards', [
            [
                'icon_url' => '',
                'title' => 'Safety first',
                'description' => 'Every vehicle in our fleet meets strict safety standards. Regular maintenance, pre-rental inspections give you total confidence on the road.',
            ],
            [
                'icon_url' => '',
                'title' => 'Reliability you can count on',
                'description' => 'Our streamlined booking process, punctual vehicle handovers ensure you are never left waiting or let down.',
            ],
            [
                'icon_url' => '',
                'title' => 'Transparent pricing',
                'description' => 'No hidden charges, no surprises at return. Our pricing is clear and upfront so you can plan your budget with confidence and focus entirely on your journey.',
            ],
            [
                'icon_url' => '',
                'title' => 'Customer-centered service',
                'description' => 'From the moment you book to the time you return the keys, our team is fully dedicated to making your experience smooth, pleasant, and completely hassle-free.',
            ],
        ]);
    }
};
