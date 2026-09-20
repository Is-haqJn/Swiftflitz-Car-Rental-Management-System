<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class PrivacySettings extends Settings
{
    public string $banner_title;

    public int $banner_image_version;

    public string $content;

    public static function group(): string
    {
        return 'privacy';
    }
}
