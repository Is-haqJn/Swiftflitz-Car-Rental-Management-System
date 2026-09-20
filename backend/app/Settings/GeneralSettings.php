<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class GeneralSettings extends Settings
{
    public string $site_name;

    public string $site_email;

    public string $site_phone;

    public string $site_address;

    public string $currency;

    public string $currency_symbol;

    public string $timezone;

    public ?string $logo_url;

    public ?string $favicon_url;

    public bool $maintenance_mode;

    public ?string $maintenance_bypass_token;

    public ?string $primary_color;

    public ?string $secondary_color;

    public ?string $secondary_color_2;

    public ?string $tertiary_color;

    public ?string $site_image_url;

    public string $storage_disk;

    public static function group(): string
    {
        return 'general';
    }
}
