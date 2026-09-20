<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReorderVehicleImagesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'image_ids' => ['required', 'array', 'min:1'],
            'image_ids.*' => ['required', 'integer', 'exists:media,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'image_ids.required' => 'Please provide the image order.',
            'image_ids.*.exists' => 'One or more image IDs are invalid.',
        ];
    }
}
