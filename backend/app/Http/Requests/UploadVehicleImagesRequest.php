<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadVehicleImagesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'images' => ['required', 'array', 'min:1', 'max:10'],
            'images.*' => [
                'required',
                'image',
                'mimes:jpeg,jpg,png,webp',
                'max:10240',
            ],
            'primary_index' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'images.required' => 'Please upload at least one image.',
            'images.max' => 'You can upload a maximum of 10 images at once.',
            'images.*.image' => 'Each file must be a valid image.',
            'images.*.mimes' => 'Images must be JPEG, PNG, or WebP format.',
            'images.*.max' => 'Each image must not exceed 10MB.',
        ];
    }
}
