<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PublicPricingPreviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'pickup_date' => ['required', 'date'],
            'return_date' => ['required', 'date', 'after:pickup_date'],
            'addon_ids' => ['nullable', 'array'],
            'addon_ids.*' => ['uuid', 'exists:additional_charges,id'],
            'pickup_location_id' => ['nullable', 'uuid', 'exists:rental_locations,id'],
            'dropoff_location_id' => ['nullable', 'uuid', 'exists:rental_locations,id'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
        ];
    }
}
