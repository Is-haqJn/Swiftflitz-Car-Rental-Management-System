<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePopupSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'promo_enabled' => ['sometimes', 'boolean'],
            'promo_title' => ['sometimes', 'string', 'max:100'],
            'promo_description' => ['sometimes', 'string', 'max:500'],
            'promo_code' => ['sometimes', 'nullable', 'string', 'max:50'],
            'promo_button_label' => ['sometimes', 'string', 'max:50'],
            'promo_button_url' => ['sometimes', 'string', 'max:500'],
            'promo_image_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'promo_frequency' => ['sometimes', 'string', Rule::in(['always', 'once_per_day'])],
            'promo_delay_seconds' => ['sometimes', 'integer', 'min:0', 'max:30'],

            'announcement_enabled' => ['sometimes', 'boolean'],
            'announcement_title' => ['sometimes', 'string', 'max:100'],
            'announcement_body' => ['sometimes', 'string', 'max:1000'],
            'announcement_frequency' => ['sometimes', 'string', Rule::in(['always', 'once_per_day'])],
            'announcement_delay_seconds' => ['sometimes', 'integer', 'min:0', 'max:30'],
        ];
    }
}
