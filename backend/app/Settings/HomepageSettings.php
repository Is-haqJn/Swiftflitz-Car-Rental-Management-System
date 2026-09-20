<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class HomepageSettings extends Settings
{
    public string $hero_title_beginning;

    /** @var string[] */
    public array $hero_title_words;

    public string $hero_title_highlight;

    public string $hero_title_ending;

    public ?string $hero_side_text;

    public string $hero_subtitle;

    public ?string $hero_description;

    public int $hero_image_version;

    public ?string $hero_background_text;

    public string $hero_cta_text;

    public string $hero_cta_url;

    public ?string $hero_secondary_cta_text;

    public ?string $hero_secondary_cta_url;

    public int $stats_cars;

    public int $stats_customers;

    public int $stats_years;

    public string $features_title;

    public string $features_subtitle;

    public ?string $features_description;

    public string $categories_title;

    public string $categories_large_title;

    public string $featured_title;

    public string $featured_large_title;

    public string $featured_empty_text;

    public bool $show_about_section;

    public string $why_title;

    public string $why_large_title;

    public int $why_bg_image_version;

    public array $why_cards;

    public bool $show_why_choose_us_section;

    public string $why_choose_us_visibility;

    public string $chauffeur_title;

    public string $chauffeur_large_title;

    public int $chauffeur_image_version;

    public string $chauffeur_cta_text;

    public string $chauffeur_cta_url;

    public bool $show_chauffeur_section;

    public string $chauffeur_visibility;

    public bool $show_pickup_process_section;

    public string $pickup_process_visibility;

    public string $pickup_process_title;

    public string $pickup_process_large_title;

    public int $pickup_process_bg_image_version;

    public int $pickup_process_bottom_image_version;

    public array $pickup_process_steps;

    public bool $show_counter_section;

    public string $counter_visibility;

    public string $counter_title;

    public string $counter_large_title;

    public array $counter_cards;

    public bool $hero_featured_vehicle_enabled;

    public string $hero_featured_vehicle_visibility;

    public string $hero_featured_vehicle_mode;

    public ?string $hero_featured_vehicle_id;

    public ?string $hero_featured_vehicle_custom_title;

    public ?string $hero_featured_vehicle_custom_price;

    public string $hero_featured_vehicle_url;

    public bool $show_testimonial_section;

    public string $testimonial_visibility;

    public string $testimonial_title;

    public string $testimonial_large_title;

    public bool $testimonial_show_images;

    public bool $testimonial_show_ratings;

    public array $testimonial_cards;

    public static function group(): string
    {
        return 'homepage';
    }
}
