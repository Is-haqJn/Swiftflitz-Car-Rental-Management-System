<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmailSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'mailer' => ['sometimes', 'string', 'in:smtp,mailgun,postmark,sendmail,log,array'],
            'host' => ['sometimes', 'string', 'max:255'],
            'port' => ['sometimes', 'integer', 'min:1', 'max:65535'],
            'encryption' => ['sometimes', 'string', 'in:tls,ssl,starttls'],
            'username' => ['sometimes', 'string', 'max:255'],
            'password' => ['sometimes', 'nullable', 'string', 'max:255'],
            'from_address' => ['sometimes', 'email', 'max:255'],
            'from_name' => ['sometimes', 'string', 'max:255'],
            'send_new_booking_notification' => ['sometimes', 'boolean'],
            'send_return_reminder' => ['sometimes', 'boolean'],
            'send_overdue_alert' => ['sometimes', 'boolean'],
            'send_quote_confirmation' => ['sometimes', 'boolean'],
            'notify_customers' => ['sometimes', 'boolean'],
            'notify_branch_managers' => ['sometimes', 'boolean'],
            'notify_admins' => ['sometimes', 'boolean'],
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
        ];
    }
}
