<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TestSmsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', 'regex:/^\+?[0-9]{7,15}$/'],
            'type' => ['nullable', 'string', 'in:connection_test,new_booking,rental_cancelled,pickup_reminder,return_reminder,overdue_alert,payment_confirmation,rental_status_change,admin_new_booking,airport_booking,airport_booking_cancelled,airport_booking_status_changed,chauffeur_booking,chauffeur_booking_cancelled,chauffeur_booking_status_changed,chauffeur_pickup_reminder,driver_document_expiry,vehicle_expiry'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.regex' => 'Enter a valid phone number (e.g. 0551234567 or +233551234567).',
        ];
    }
}
