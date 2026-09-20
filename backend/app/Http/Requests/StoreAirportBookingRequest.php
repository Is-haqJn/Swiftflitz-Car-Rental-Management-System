<?php

namespace App\Http\Requests;

use App\Enums\AirportAssignmentMode;
use App\Enums\AirportBookingDirection;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAirportBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Booking details
            'branch_id' => ['required', 'uuid', 'exists:branches,id'],
            'direction' => ['required', 'string', Rule::in(AirportBookingDirection::list())],
            'package_assignment_id' => ['required', 'uuid', 'exists:airport_package_assignments,id'],
            'terminal_location_id' => ['required', 'uuid', 'exists:airport_locations,id'],
            'area_location_id' => ['required', 'uuid', 'exists:airport_locations,id'],
            'scheduled_at' => ['required', 'date', 'after:now'],
            'passenger_name' => ['nullable', 'string', 'max:255'],
            'passenger_phone' => ['nullable', 'string', 'max:20'],
            'passenger_count' => ['required', 'integer', 'min:1', 'max:4'],
            'specific_address' => ['nullable', 'string', 'max:500'],
            'flight_number' => ['nullable', 'string', 'max:20'],
            'airline' => ['nullable', 'string', 'max:100'],
            'assignment_mode' => ['nullable', 'string', Rule::in(AirportAssignmentMode::list())],
            'staff_notes' => ['nullable', 'string'],

            // Customer details
            'customer_full_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['required', 'email'],
            'customer_phone' => ['required', 'string', 'max:20'],

            // Optional payment
            'payment_method' => ['nullable', 'string', Rule::in(['cash', 'mobile_money', 'bank_transfer', 'offline_transfer'])],
            'payment_reference' => ['nullable', 'string', 'max:255'],

            // Optional coupon
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
