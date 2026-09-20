<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateServicesSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'banner_title' => ['sometimes', 'string', 'max:255'],
            'facilities_title' => ['sometimes', 'string', 'max:255'],
            'facilities_large_title' => ['sometimes', 'string', 'max:255'],
            'facilities_cards' => ['sometimes', 'array'],
            'facilities_cards.*.image_url' => ['sometimes', 'nullable', 'string', 'max:500'],
            'facilities_cards.*.title' => ['required_with:facilities_cards', 'string', 'max:255'],
            'facilities_cards.*.description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'facilities_cards.*.button_text' => ['sometimes', 'nullable', 'string', 'max:100'],
            'facilities_cards.*.button_url' => ['sometimes', 'nullable', 'string', 'max:500'],
            'why_choose_us_enabled' => ['sometimes', 'boolean'],
            'why_choose_us_title' => ['sometimes', 'string', 'max:255'],
            'why_choose_us_large_title' => ['sometimes', 'string', 'max:255'],
            'why_choose_us_cards' => ['sometimes', 'array'],
            'why_choose_us_cards.*.number' => ['sometimes', 'nullable', 'string', 'max:10'],
            'why_choose_us_cards.*.title' => ['required_with:why_choose_us_cards', 'string', 'max:255'],
            'why_choose_us_cards.*.description' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }
}
