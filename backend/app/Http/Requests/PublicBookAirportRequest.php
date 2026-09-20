<?php

namespace App\Http\Requests;

use App\Enums\AirportBookingDirection;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PublicBookAirportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'package_assignment_id' => ['required', 'uuid', 'exists:airport_package_assignments,id'],
            'direction' => ['required', 'string', Rule::in(AirportBookingDirection::list())],
            'terminal_location_id' => ['required', 'uuid', 'exists:airport_locations,id'],
            'area_location_id' => ['required', 'uuid', 'exists:airport_locations,id'],
            'scheduled_at' => ['required', 'date', 'after:now'],
            'passenger_count' => ['required', 'integer', 'min:1', 'max:4'],
            'customer_full_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['required', 'email'],
            'customer_phone' => ['required', 'string', 'max:20'],
            'specific_address' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'payment_method' => ['sometimes', 'nullable', 'string', 'in:paystack'],
            'payment_reference' => ['sometimes', 'nullable', 'string', 'max:255'],
            'coupon_code' => ['nullable', 'string', 'exists:discount_coupons,code'],
        ];
    }

    public function messages(): array
    {
        return [
            'scheduled_at.after' => 'The scheduled date and time must be in the future.',
            'passenger_count.max' => 'A maximum of 4 passengers is allowed per booking.',
        ];
    }
}
