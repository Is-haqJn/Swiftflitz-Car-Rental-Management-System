<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFaqSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'banner_title' => ['sometimes', 'string', 'max:255'],
            'faq_section_enabled' => ['sometimes', 'boolean'],
            'faq_section_large_title' => ['sometimes', 'string', 'max:255'],
            'faq_items' => ['sometimes', 'array'],
            'faq_items.*.question' => ['required_with:faq_items', 'string', 'max:500'],
            'faq_items.*.answer' => ['required_with:faq_items', 'string', 'max:2000'],
        ];
    }
}
