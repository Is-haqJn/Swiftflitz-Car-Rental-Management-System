<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRentalSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'min_rental_days' => ['sometimes', 'integer', 'min:1'],
            'max_rental_days' => ['sometimes', 'integer', 'min:1'],
            'booking_advance_days' => ['sometimes', 'integer', 'min:0'],
            'require_license_verification' => ['sometimes', 'boolean'],
            'allow_public_booking' => ['sometimes', 'boolean'],
            'auto_confirm_bookings' => ['sometimes', 'boolean'],
            'overdue_check_hour' => ['sometimes', 'integer', 'min:0', 'max:23'],
            'return_reminder_hours_before' => ['sometimes', 'string', 'max:10'],
            'allow_online_booking' => ['sometimes', 'boolean'],
            'booking_requires_confirmation' => ['sometimes', 'boolean'],
            'booking_grace_period_hours' => ['sometimes', 'integer', 'min:0'],
            'vat_enabled' => ['sometimes', 'boolean'],
            'vat_rate' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'coupon_code_prefix' => ['sometimes', 'string', 'max:3', 'alpha'],
            'pickup_window_start' => ['sometimes', 'string', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
            'pickup_window_end' => ['sometimes', 'string', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
            'return_time_threshold' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:23'],
            'documents_required' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'overdue_check_hour.min' => 'Overdue check hour must be between 0 and 23.',
            'overdue_check_hour.max' => 'Overdue check hour must be between 0 and 23.',
        ];
    }
}
