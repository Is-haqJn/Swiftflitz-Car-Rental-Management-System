<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuoteRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function messages(): array
    {
        return [
            'date_of_birth.before' => 'You must be 18 or older to rent a vehicle.',
        ];
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'vehicle_id' => ['nullable', 'uuid', 'exists:vehicles,id'],
            'vehicle_preference' => ['nullable', 'string', 'max:500'],
            'pickup_date' => ['nullable', 'date', 'after_or_equal:today'],
            'return_date' => ['nullable', 'date', 'after:pickup_date'],
            'pickup_location_id' => ['nullable', 'uuid', 'exists:rental_locations,id'],
            'message' => ['nullable', 'string', 'max:2000'],
            'admin_notes' => ['nullable', 'string', 'max:2000'],
            'branch_id' => ['nullable', 'uuid', 'exists:branches,id'],
            'date_of_birth' => ['nullable', 'date', 'before:' . now()->subYears(18)->format('Y-m-d')],
        ];
    }
}
