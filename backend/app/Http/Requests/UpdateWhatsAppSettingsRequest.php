<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWhatsAppSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'enabled' => ['sometimes', 'boolean'],
            'access_token' => ['sometimes', 'nullable', 'string', 'max:500'],
            'phone_number_id' => ['sometimes', 'nullable', 'string', 'max:100'],
            'business_account_id' => ['sometimes', 'nullable', 'string', 'max:100'],
            'test_mode' => ['sometimes', 'boolean'],
            'test_phone_number' => ['sometimes', 'nullable', 'string', 'max:30', 'required_if:test_mode,true'],
            'admin_only_mode' => ['sometimes', 'boolean'],
            'admin_phone_number' => ['sometimes', 'nullable', 'string', 'max:30'],
            'admin_only_phone_number' => ['sometimes', 'nullable', 'string', 'max:30'],
            'mirror_mode' => ['sometimes', 'boolean'],
            'notify_customers' => ['sometimes', 'boolean'],
            'notify_branch_managers' => ['sometimes', 'boolean'],
            'notify_admins' => ['sometimes', 'boolean'],
            'send_new_booking' => ['sometimes', 'boolean'],
            'send_return_reminder' => ['sometimes', 'boolean'],
            'send_overdue_alert' => ['sometimes', 'boolean'],
            'send_pickup_reminder' => ['sometimes', 'boolean'],
            'send_payment_confirmation' => ['sometimes', 'boolean'],
            'send_admin_new_booking' => ['sometimes', 'boolean'],
            'send_admin_rental_cancelled' => ['sometimes', 'boolean'],
            'send_admin_pickup_reminder' => ['sometimes', 'boolean'],
            'send_admin_return_reminder' => ['sometimes', 'boolean'],
            'send_admin_overdue_alert' => ['sometimes', 'boolean'],
            'send_admin_payment_confirmation' => ['sometimes', 'boolean'],
            'send_admin_rental_status_change' => ['sometimes', 'boolean'],
            'send_admin_airport_booking' => ['sometimes', 'boolean'],
            'send_admin_airport_booking_cancelled' => ['sometimes', 'boolean'],
            'send_admin_chauffeur_booking' => ['sometimes', 'boolean'],
            'send_admin_chauffeur_booking_cancelled' => ['sometimes', 'boolean'],
            'send_admin_chauffeur_pickup_reminder' => ['sometimes', 'boolean'],
            'send_airport_booking' => ['sometimes', 'boolean'],
            'send_airport_booking_cancelled' => ['sometimes', 'boolean'],
            'send_airport_booking_status_changed' => ['sometimes', 'boolean'],
            'send_chauffeur_booking' => ['sometimes', 'boolean'],
            'send_chauffeur_booking_cancelled' => ['sometimes', 'boolean'],
            'send_chauffeur_booking_status_changed' => ['sometimes', 'boolean'],
            'send_chauffeur_pickup_reminder' => ['sometimes', 'boolean'],
            'send_rental_cancelled' => ['sometimes', 'boolean'],
            'send_driver_document_expiry' => ['sometimes', 'boolean'],
            'send_rental_status_change' => ['sometimes', 'boolean'],
            'send_vehicle_expiry' => ['sometimes', 'boolean'],
            'send_quote_request' => ['sometimes', 'boolean'],
            'send_document_expiry_alert' => ['sometimes', 'boolean'],
            'app_secret' => ['sometimes', 'nullable', 'string', 'max:500'],
            'webhook_verify_token' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}
