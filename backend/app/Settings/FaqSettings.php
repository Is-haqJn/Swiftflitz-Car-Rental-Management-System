<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class FaqSettings extends Settings
{
    public string $banner_title;

    public int $banner_image_version;

    public ?string $banner_image_url;

    public bool $faq_section_enabled;

    public int $faq_section_bg_image_version;

    public ?string $faq_section_bg_image_url;

    public string $faq_section_large_title;

    public array $faq_items;

    public static function group(): string
    {
        return 'faq';
    }
}
