<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class FooterSettings extends Settings
{
    public string $tagline;

    public string $copyright;

    public bool $footer_socials_enabled;

    public string $opening_hours_title;

    public array $opening_hours;

    public string $quick_links_title;

    public array $quick_links;

    public bool $footer_legal_enabled;

    public string $footer_legal_title;

    public static function group(): string
    {
        return 'footer';
    }
}
