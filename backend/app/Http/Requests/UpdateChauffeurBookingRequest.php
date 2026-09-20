<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateChauffeurBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'pickup_location_id' => ['nullable', 'uuid', 'exists:rental_locations,id'],
            'pickup_time' => ['sometimes', 'date'],
            'return_time' => ['sometimes', 'date', 'after:pickup_time'],
            'staff_notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
