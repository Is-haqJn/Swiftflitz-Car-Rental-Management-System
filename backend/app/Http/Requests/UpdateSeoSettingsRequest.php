<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSeoSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'meta_title' => ['sometimes', 'string', 'max:255'],
            'meta_description' => ['sometimes', 'string', 'max:500'],
            'meta_keywords' => ['sometimes', 'nullable', 'string', 'max:500'],
            'og_image' => ['sometimes', 'nullable', 'url', 'max:2048'],
            'google_analytics_id' => ['sometimes', 'nullable', 'string', 'max:100'],
            'google_tag_manager_id' => ['sometimes', 'nullable', 'string', 'max:100'],
            'facebook_pixel_id' => ['sometimes', 'nullable', 'string', 'max:100'],
            'robots' => ['sometimes', 'string', Rule::in(['index, follow', 'noindex, nofollow', 'index, nofollow', 'noindex, follow'])],
        ];
    }
}
