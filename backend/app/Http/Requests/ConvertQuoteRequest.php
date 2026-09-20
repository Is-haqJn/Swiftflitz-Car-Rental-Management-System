<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ConvertQuoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'uuid', 'exists:customers,id'],
            'pickup_time' => ['nullable', 'string', 'date_format:H:i'],
            'return_time' => ['nullable', 'string', 'date_format:H:i'],
            'dropoff_location_id' => ['nullable', 'uuid', 'exists:rental_locations,id'],
            'amount_paid' => ['nullable', 'numeric', 'min:0'],
            'admin_notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
