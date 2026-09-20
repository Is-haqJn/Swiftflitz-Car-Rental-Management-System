<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PublicNewCustomerBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:customers,email'],
            'phone' => ['required', 'string', 'max:50'],
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

    public function messages(): array
    {
        return [
            'email.unique' => 'This email is already registered. Please use the returning customer form.',
            'date_of_birth.before' => 'Date of birth must be in the past.',
        ];
    }
}
