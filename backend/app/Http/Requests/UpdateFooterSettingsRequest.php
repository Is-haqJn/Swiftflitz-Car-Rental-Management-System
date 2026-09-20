<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFooterSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tagline' => ['sometimes', 'string', 'max:255'],
            'copyright' => ['sometimes', 'string', 'max:255'],
            'footer_socials_enabled' => ['sometimes', 'boolean'],
            'opening_hours_title' => ['sometimes', 'string', 'max:255'],
            'opening_hours' => ['sometimes', 'array'],
            'opening_hours.*.days' => ['required_with:opening_hours', 'string', 'max:255'],
            'opening_hours.*.time' => ['required_with:opening_hours', 'string', 'max:255'],
            'quick_links_title' => ['sometimes', 'string', 'max:255'],
            'quick_links' => ['sometimes', 'array'],
            'quick_links.*.name' => ['required_with:quick_links', 'string', 'max:255'],
            'quick_links.*.url' => ['required_with:quick_links', 'string', 'max:500'],
            'footer_legal_enabled' => ['sometimes', 'boolean'],
            'footer_legal_title' => ['sometimes', 'string', 'max:255'],
        ];
    }
}
