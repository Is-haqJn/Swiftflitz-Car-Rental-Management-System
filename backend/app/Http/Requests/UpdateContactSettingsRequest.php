<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateContactSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'banner_title' => ['sometimes', 'string', 'max:255'],
            'contact_section_large_title' => ['sometimes', 'string', 'max:255'],
            'contact_socials_enabled' => ['sometimes', 'boolean'],
            'contact_socials_title' => ['sometimes', 'string', 'max:255'],
            'contact_socials' => ['sometimes', 'array'],
            'contact_socials.*.icon' => ['required_with:contact_socials', 'string', 'max:100'],
            'contact_socials.*.url' => ['required_with:contact_socials', 'string', 'max:500'],
            'address' => ['sometimes', 'string', 'max:500'],
            'phone' => ['sometimes', 'string', 'max:30'],
            'email' => ['sometimes', 'email', 'max:255'],
            'hours' => ['sometimes', 'nullable', 'string', 'max:255'],
            'map_enabled' => ['sometimes', 'boolean'],
            'map_embed_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'contact_branch_locations_enabled' => ['sometimes', 'boolean'],
            'contact_branch_locations_title' => ['sometimes', 'string', 'max:255'],
            'contact_branch_ids' => ['sometimes', 'array'],
            'contact_branch_ids.*' => ['string', 'exists:branches,id'],
            'whatsapp_number' => ['sometimes', 'nullable', 'string', 'max:30'],
        ];
    }
}
