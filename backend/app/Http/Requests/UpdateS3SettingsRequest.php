<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateS3SettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'aws_access_key_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'aws_secret_access_key' => ['sometimes', 'nullable', 'string', 'max:255'],
            'aws_default_region' => ['sometimes', 'nullable', 'string', 'max:50'],
            'aws_bucket' => ['sometimes', 'nullable', 'string', 'max:255'],
            'aws_url' => ['sometimes', 'nullable', 'url', 'max:2048'],
            'aws_endpoint' => ['sometimes', 'nullable', 'url', 'max:2048'],
            'use_path_style_endpoint' => ['sometimes', 'boolean'],
        ];
    }
}
