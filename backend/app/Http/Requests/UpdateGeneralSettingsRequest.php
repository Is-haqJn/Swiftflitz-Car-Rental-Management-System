<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGeneralSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'site_name' => ['sometimes', 'string', 'max:255'],
            'site_email' => ['sometimes', 'email', 'max:255'],
            'site_phone' => ['sometimes', 'string', 'max:50'],
            'site_address' => ['sometimes', 'string', 'max:500'],
            'currency' => ['sometimes', 'string', 'max:10'],
            'currency_symbol' => ['sometimes', 'string', 'max:10'],
            'timezone' => ['sometimes', 'string', 'timezone'],
            'logo_url' => ['sometimes', 'nullable', 'url', 'max:2048'],
            'favicon_url' => ['sometimes', 'nullable', 'url', 'max:2048'],
            'maintenance_mode' => ['sometimes', 'boolean'],
            'primary_color' => ['sometimes', 'nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'secondary_color' => ['sometimes', 'nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'secondary_color_2' => ['sometimes', 'nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'tertiary_color' => ['sometimes', 'nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'site_image_url' => ['sometimes', 'nullable', 'url', 'max:2048'],
            'storage_disk' => ['sometimes', 'string', 'in:media,s3'],
        ];
    }
}
