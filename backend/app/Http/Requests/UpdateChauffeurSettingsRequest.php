<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateChauffeurSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'grace_period_minutes' => ['sometimes', 'integer', 'min:0', 'max:120'],
            'cancellation_flat_fee' => ['sometimes', 'numeric', 'min:0'],
            'overtime_charge_per_hour' => ['sometimes', 'numeric', 'min:0'],
            'no_show_fee' => ['sometimes', 'numeric', 'min:0'],
            'standard_return_time' => ['sometimes', 'string', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
            'booking_window_start' => ['sometimes', 'string', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
            'booking_window_end' => ['sometimes', 'string', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
        ];
    }
}
