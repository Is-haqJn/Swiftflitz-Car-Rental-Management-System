<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PublicDirectBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'session_id' => ['required', 'string'],
            'vehicle_id' => ['required', 'uuid', 'exists:vehicles,id'],
            'pickup_date' => ['required', 'date'],
            'return_date' => ['required', 'date', 'after:pickup_date'],
            'pickup_time' => ['nullable', 'string'],
            'return_time' => ['nullable', 'string'],
            'pickup_location_id' => ['nullable', 'uuid', 'exists:rental_locations,id'],
            'dropoff_location_id' => ['nullable', 'uuid', 'exists:rental_locations,id'],
            'addon_ids' => ['nullable', 'array'],
            'addon_ids.*' => ['uuid', 'exists:additional_charges,id'],
            'customer_notes' => ['nullable', 'string', 'max:2000'],
            'coupon_code' => ['nullable', 'string', 'exists:discount_coupons,code'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
        ];
    }
}
