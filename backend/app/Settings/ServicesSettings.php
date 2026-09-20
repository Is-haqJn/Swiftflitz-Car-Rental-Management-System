<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class ServicesSettings extends Settings
{
    public string $banner_title;

    public int $banner_image_version;

    public ?string $banner_image_url;

    public string $facilities_title;

    public string $facilities_large_title;

    public array $facilities_cards;

    public bool $why_choose_us_enabled;

    public int $why_choose_us_bg_image_version;

    public ?string $why_choose_us_bg_image_url;

    public string $why_choose_us_title;

    public string $why_choose_us_large_title;

    public array $why_choose_us_cards;

    public ?string $listings_banner_image_url;

    public ?string $airport_transfer_banner_image_url;

    public ?string $chauffeur_banner_image_url;

    public static function group(): string
    {
        return 'services';
    }
}
