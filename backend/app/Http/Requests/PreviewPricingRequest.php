<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PreviewPricingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'vehicle_id' => ['required', 'uuid', 'exists:vehicles,id'],
            'pickup_date' => ['required', 'date'],
            'return_date' => ['required', 'date', 'after:pickup_date'],
            'customer_id' => ['nullable', 'uuid', 'exists:customers,id'],
            'pickup_location_id' => ['nullable', 'uuid', 'exists:rental_locations,id'],
            'dropoff_location_id' => ['nullable', 'uuid', 'exists:rental_locations,id'],
            'addons' => ['nullable', 'array'],
            'addons.*.id' => ['required', 'uuid', 'exists:additional_charges,id'],
            'addons.*.quantity' => ['required', 'integer', 'min:1'],
            'coupon_code' => ['nullable', 'string'],
            'manual_discount' => ['nullable', 'numeric', 'min:0'],
            'manual_discount_reason' => ['nullable', 'string'],
            'skip_deposit' => ['nullable', 'boolean'],
            'branch_id' => ['nullable', 'uuid', 'exists:branches,id'],
            'young_driver' => ['nullable', 'boolean'],
        ];
    }
}
