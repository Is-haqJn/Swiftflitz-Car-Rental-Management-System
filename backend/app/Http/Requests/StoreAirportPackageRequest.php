<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAirportPackageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'features' => ['required', 'array'],
            'features.*' => ['string'],
            'is_available_for_pickup' => ['required', 'boolean'],
            'is_available_for_dropoff' => ['required', 'boolean'],
            'auto_assign_vehicle' => ['required', 'boolean'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
