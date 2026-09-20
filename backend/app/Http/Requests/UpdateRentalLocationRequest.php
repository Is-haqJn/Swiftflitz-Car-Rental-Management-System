<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRentalLocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            'pickup_charge' => 'nullable|numeric|min:0',
            'dropoff_charge' => 'nullable|numeric|min:0',
            'is_default' => 'boolean',
            'is_pickup' => 'boolean',
            'is_dropoff' => 'boolean',
            'is_chauffeur' => 'boolean',
            'is_active' => 'boolean',
        ];
    }
}
