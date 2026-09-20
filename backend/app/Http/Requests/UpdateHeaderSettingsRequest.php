<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateHeaderSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'logo_url' => ['sometimes', 'nullable', 'url', 'max:2048'],
            'tagline' => ['sometimes', 'nullable', 'string', 'max:255'],
            'phone' => ['sometimes', 'string', 'max:30'],
            'email' => ['sometimes', 'email', 'max:255'],
            'cta_text' => ['sometimes', 'string', 'max:100'],
            'cta_url' => ['sometimes', 'string', 'max:2048'],
        ];
    }
}
