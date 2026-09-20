<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class PopupSettings extends Settings
{
    // Promo Popup
    public bool $promo_enabled;
    public string $promo_title;
    public string $promo_description;
    public ?string $promo_code;
    public string $promo_button_label;
    public string $promo_button_url;
    public ?string $promo_image_url;
    public string $promo_frequency;
    public int $promo_delay_seconds;

    // Announcement Popup
    public bool $announcement_enabled;
    public string $announcement_title;
    public string $announcement_body;
    public string $announcement_frequency;
    public int $announcement_delay_seconds;

    public static function group(): string
    {
        return 'popups';
    }
}
