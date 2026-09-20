<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class HeaderSettings extends Settings
{
    public ?string $logo_url;

    public ?string $tagline;

    public string $phone;

    public string $email;

    public string $cta_text;

    public string $cta_url;

    public static function group(): string
    {
        return 'header';
    }
}
