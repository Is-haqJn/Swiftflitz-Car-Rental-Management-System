<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAirportBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'passenger_name' => ['sometimes', 'string', 'max:255'],
            'passenger_phone' => ['sometimes', 'string', 'max:20'],
            'passenger_count' => ['sometimes', 'integer', 'min:1', 'max:4'],
            'flight_number' => ['sometimes', 'nullable', 'string', 'max:20'],
            'airline' => ['sometimes', 'nullable', 'string', 'max:100'],
            'specific_address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'staff_notes' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
