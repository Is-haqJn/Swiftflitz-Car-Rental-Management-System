<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAirportPackageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'features' => ['sometimes', 'array'],
            'features.*' => ['string'],
            'is_available_for_pickup' => ['sometimes', 'boolean'],
            'is_available_for_dropoff' => ['sometimes', 'boolean'],
            'auto_assign_vehicle' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
