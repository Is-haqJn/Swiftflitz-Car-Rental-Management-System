<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAboutSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'hero_title' => ['sometimes', 'string', 'max:255'],
            'hero_subtitle' => ['sometimes', 'string', 'max:255'],
            'hero_image_url' => ['sometimes', 'nullable', 'url', 'max:2048'],
            'story_title' => ['sometimes', 'string', 'max:255'],
            'story_content' => ['sometimes', 'string', 'max:5000'],
            'mission' => ['sometimes', 'string', 'max:2000'],
            'vision' => ['sometimes', 'string', 'max:2000'],
            'values' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'general_title' => ['sometimes', 'string', 'max:255'],
            'general_large_title' => ['sometimes', 'string', 'max:500'],
            'general_description' => ['sometimes', 'string', 'max:2000'],
            'general_list_items' => ['sometimes', 'array'],
            'general_list_items.*' => ['string', 'max:255'],
            'values_enabled' => ['sometimes', 'boolean'],
            'values_title' => ['sometimes', 'string', 'max:255'],
            'values_large_title' => ['sometimes', 'string', 'max:500'],
            'values_cards' => ['sometimes', 'array'],
            'values_cards.*.icon_url' => ['nullable', 'string', 'max:2048'],
            'values_cards.*.title' => ['required_with:values_cards', 'string', 'max:255'],
            'values_cards.*.description' => ['required_with:values_cards', 'string', 'max:2000'],
            'team_enabled' => ['sometimes', 'boolean'],
            'team_title' => ['sometimes', 'string', 'max:255'],
            'team_large_title' => ['sometimes', 'string', 'max:500'],
            'team_members' => ['sometimes', 'array'],
            'team_members.*.name' => ['required_with:team_members', 'string', 'max:255'],
            'team_members.*.position' => ['required_with:team_members', 'string', 'max:255'],
            'team_members.*.image_url' => ['nullable', 'string', 'max:2048'],
            'team_members.*.socials' => ['sometimes', 'array'],
            'team_members.*.socials.*.icon' => ['sometimes', 'nullable', 'string', 'max:100'],
            'team_members.*.socials.*.url' => ['sometimes', 'nullable', 'string', 'max:2048'],
        ];
    }
}
