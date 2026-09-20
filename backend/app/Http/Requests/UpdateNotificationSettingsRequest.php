<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'new_booking' => ['sometimes', 'boolean'],
            'return_reminder' => ['sometimes', 'boolean'],
            'overdue_alert' => ['sometimes', 'boolean'],
            'quote_request' => ['sometimes', 'boolean'],
            'vehicle_expiry' => ['sometimes', 'boolean'],
            'pickup_reminder' => ['sometimes', 'boolean'],
            'email_new_booking' => ['sometimes', 'boolean'],
            'email_return_reminder' => ['sometimes', 'boolean'],
            'email_overdue_alert' => ['sometimes', 'boolean'],
            'email_quote_request' => ['sometimes', 'boolean'],
            'email_vehicle_expiry' => ['sometimes', 'boolean'],
            'email_pickup_reminder' => ['sometimes', 'boolean'],
            'rental_status_change' => ['sometimes', 'boolean'],
            'email_rental_status_change' => ['sometimes', 'boolean'],
            'payment_confirmation' => ['sometimes', 'boolean'],
            'email_payment_confirmation' => ['sometimes', 'boolean'],
            'document_expiry_alert' => ['sometimes', 'boolean'],
            'email_document_expiry_alert' => ['sometimes', 'boolean'],
        ];
    }
}
