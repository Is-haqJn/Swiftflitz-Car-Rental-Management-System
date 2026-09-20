<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class SeoSettings extends Settings
{
    public string $meta_title;

    public string $meta_description;

    public ?string $meta_keywords;

    public ?string $og_image;

    public ?string $google_analytics_id;

    public ?string $google_tag_manager_id;

    public ?string $facebook_pixel_id;

    public string $robots;

    public static function group(): string
    {
        return 'seo';
    }
}
