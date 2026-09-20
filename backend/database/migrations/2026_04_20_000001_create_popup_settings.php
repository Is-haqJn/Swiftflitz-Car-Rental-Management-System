<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

class CreatePopupSettings extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('popups.promo_enabled', false);
        $this->migrator->add('popups.promo_title', 'Special Offer');
        $this->migrator->add('popups.promo_description', 'Book now and save on your next rental.');
        $this->migrator->add('popups.promo_code', null);
        $this->migrator->add('popups.promo_button_label', 'Book Now');
        $this->migrator->add('popups.promo_button_url', '/listings');
        $this->migrator->add('popups.promo_image_url', null);
        $this->migrator->add('popups.promo_frequency', 'once_per_day');
        $this->migrator->add('popups.promo_delay_seconds', 3);

        $this->migrator->add('popups.announcement_enabled', false);
        $this->migrator->add('popups.announcement_title', 'Important Notice');
        $this->migrator->add('popups.announcement_body', 'Stay tuned for exciting updates.');
        $this->migrator->add('popups.announcement_frequency', 'once_per_day');
        $this->migrator->add('popups.announcement_delay_seconds', 2);
    }
}
