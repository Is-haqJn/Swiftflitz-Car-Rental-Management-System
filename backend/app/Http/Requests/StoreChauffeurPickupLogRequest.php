<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreChauffeurPickupLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'confirmed_at' => ['nullable', 'date'],
            'pickup_location' => ['nullable', 'string', 'max:500'],
            'odometer_reading' => ['nullable', 'integer', 'min:0'],
            'customer_present' => ['boolean'],
            'driver_notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
