<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateHomepageSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'hero_title_beginning' => ['sometimes', 'string', 'max:100'],
            'hero_title_words' => ['sometimes', 'array'],
            'hero_title_words.*' => ['string', 'max:50'],
            'hero_title_highlight' => ['sometimes', 'string', 'max:100'],
            'hero_title_ending' => ['sometimes', 'string', 'max:100'],
            'hero_side_text' => ['sometimes', 'nullable', 'string', 'max:100'],
            'hero_subtitle' => ['sometimes', 'string', 'max:255'],
            'hero_description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'hero_background_text' => ['sometimes', 'nullable', 'string', 'max:100'],
            'hero_cta_text' => ['sometimes', 'string', 'max:100'],
            'hero_cta_url' => ['sometimes', 'string', 'max:2048'],
            'hero_secondary_cta_text' => ['sometimes', 'nullable', 'string', 'max:100'],
            'hero_secondary_cta_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'hero_featured_vehicle_enabled' => ['sometimes', 'boolean'],
            'hero_featured_vehicle_visibility' => ['sometimes', 'string', 'in:all,desktop_only,mobile_only'],
            'hero_featured_vehicle_mode' => ['sometimes', 'string', 'in:custom,random,specific'],
            'hero_featured_vehicle_id' => ['sometimes', 'nullable', 'string', 'exists:vehicles,id'],
            'hero_featured_vehicle_custom_title' => ['sometimes', 'nullable', 'string', 'max:100'],
            'hero_featured_vehicle_custom_price' => ['sometimes', 'nullable', 'string', 'max:50'],
            'hero_featured_vehicle_url' => ['sometimes', 'string', 'max:2048'],
            'stats_cars' => ['sometimes', 'integer', 'min:0'],
            'stats_customers' => ['sometimes', 'integer', 'min:0'],
            'stats_years' => ['sometimes', 'integer', 'min:0'],
            'features_title' => ['sometimes', 'string', 'max:255'],
            'features_subtitle' => ['sometimes', 'string', 'max:255'],
            'features_description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'categories_title' => ['sometimes', 'string', 'max:255'],
            'categories_large_title' => ['sometimes', 'string', 'max:255'],
            'featured_title' => ['sometimes', 'string', 'max:255'],
            'featured_large_title' => ['sometimes', 'string', 'max:255'],
            'featured_empty_text' => ['sometimes', 'nullable', 'string', 'max:500'],
            'show_about_section' => ['sometimes', 'boolean'],
            'why_title' => ['sometimes', 'string', 'max:255'],
            'why_large_title' => ['sometimes', 'string', 'max:255'],
            'why_bg_image_version' => ['sometimes', 'integer'],
            'why_cards' => ['sometimes', 'array'],
            'why_cards.*.image_url' => ['sometimes', 'nullable', 'string', 'max:500'],
            'why_cards.*.title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'why_cards.*.description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'show_why_choose_us_section' => ['sometimes', 'boolean'],
            'why_choose_us_visibility' => ['sometimes', 'string', 'in:all,desktop_only,mobile_only'],
            'chauffeur_title' => ['sometimes', 'string', 'max:255'],
            'chauffeur_large_title' => ['sometimes', 'string', 'max:255'],
            'chauffeur_image_version' => ['sometimes', 'integer'],
            'chauffeur_cta_text' => ['sometimes', 'string', 'max:100'],
            'chauffeur_cta_url' => ['sometimes', 'string', 'max:2048'],
            'show_chauffeur_section' => ['sometimes', 'boolean'],
            'chauffeur_visibility' => ['sometimes', 'string', 'in:all,desktop_only,mobile_only'],
            'show_pickup_process_section' => ['sometimes', 'boolean'],
            'pickup_process_visibility' => ['sometimes', 'string', 'in:all,desktop_only,mobile_only'],
            'pickup_process_title' => ['sometimes', 'string', 'max:255'],
            'pickup_process_large_title' => ['sometimes', 'string', 'max:255'],
            'pickup_process_bg_image_version' => ['sometimes', 'integer'],
            'pickup_process_bottom_image_version' => ['sometimes', 'integer'],
            'pickup_process_steps' => ['sometimes', 'array'],
            'pickup_process_steps.*.number' => ['sometimes', 'nullable', 'string', 'max:10'],
            'pickup_process_steps.*.title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'pickup_process_steps.*.description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'show_counter_section' => ['sometimes', 'boolean'],
            'counter_visibility' => ['sometimes', 'string', 'in:all,desktop_only,mobile_only'],
            'counter_title' => ['sometimes', 'string', 'max:255'],
            'counter_large_title' => ['sometimes', 'string', 'max:255'],
            'counter_cards' => ['sometimes', 'array'],
            'counter_cards.*.icon_url' => ['sometimes', 'nullable', 'string', 'max:500'],
            'counter_cards.*.prefix' => ['sometimes', 'nullable', 'string', 'max:20'],
            'counter_cards.*.number' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'counter_cards.*.suffix' => ['sometimes', 'nullable', 'string', 'max:20'],
            'counter_cards.*.label' => ['sometimes', 'nullable', 'string', 'max:255'],
            'show_testimonial_section' => ['sometimes', 'boolean'],
            'testimonial_visibility' => ['sometimes', 'string', 'in:all,desktop_only,mobile_only'],
            'testimonial_title' => ['sometimes', 'string', 'max:255'],
            'testimonial_large_title' => ['sometimes', 'string', 'max:255'],
            'testimonial_show_images' => ['sometimes', 'boolean'],
            'testimonial_show_ratings' => ['sometimes', 'boolean'],
            'testimonial_cards' => ['sometimes', 'array'],
            'testimonial_cards.*.image_url' => ['sometimes', 'nullable', 'string', 'max:500'],
            'testimonial_cards.*.name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'testimonial_cards.*.position' => ['sometimes', 'nullable', 'string', 'max:255'],
            'testimonial_cards.*.details' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'testimonial_cards.*.rating' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:5'],
        ];
    }
}
