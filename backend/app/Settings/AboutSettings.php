<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class AboutSettings extends Settings
{
    public string $hero_title;

    public string $hero_subtitle;

    public ?string $hero_image_url;

    public string $story_title;

    public string $story_content;

    public string $mission;

    public string $vision;

    public ?string $values;

    public string $general_title;

    public string $general_large_title;

    public string $general_description;

    /** @var string[] */
    public array $general_list_items;

    public int $banner_image_version;

    public ?string $banner_image_url;

    public int $general_bg_image_version;

    public ?string $general_bg_image_url;

    public int $general_overlay_image_version;

    public ?string $general_overlay_image_url;

    public bool $values_enabled;

    public string $values_title;

    public string $values_large_title;

    public int $values_bg_image_version;

    public ?string $values_bg_image_url;

    public array $values_cards;

    public bool $team_enabled;

    public string $team_title;

    public string $team_large_title;

    public array $team_members;

    public static function group(): string
    {
        return 'about';
    }
}
