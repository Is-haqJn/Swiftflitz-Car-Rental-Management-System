<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SendTestNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', 'string', Rule::in([
                'booking_confirmation',
                'overdue_alert',
                'return_reminder',
                'pickup_reminder',
                'vehicle_expiry',
                'quote_confirmation',
                'new_quote_request',
                'quote_ready',
            ])],
            'email' => ['required', 'email'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'type.in' => 'Invalid notification type. Must be one of: booking_confirmation, overdue_alert, return_reminder, pickup_reminder, vehicle_expiry, quote_confirmation, new_quote_request, quote_ready.',
        ];
    }
}
