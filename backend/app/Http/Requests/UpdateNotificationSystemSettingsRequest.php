<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationSystemSettingsRequest extends FormRequest
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
            'email_quote_confirmation' => ['sometimes', 'boolean'],
            'email_quote_ready' => ['sometimes', 'boolean'],
            'rental_status_change' => ['sometimes', 'boolean'],
            'email_rental_status_change' => ['sometimes', 'boolean'],
            'payment_confirmation' => ['sometimes', 'boolean'],
            'email_payment_confirmation' => ['sometimes', 'boolean'],
            'document_expiry_alert' => ['sometimes', 'boolean'],
            'email_document_expiry_alert' => ['sometimes', 'boolean'],
            'whatsapp_new_booking' => ['sometimes', 'boolean'],
            'whatsapp_return_reminder' => ['sometimes', 'boolean'],
            'whatsapp_overdue_alert' => ['sometimes', 'boolean'],
            'whatsapp_quote_request' => ['sometimes', 'boolean'],
            'whatsapp_vehicle_expiry' => ['sometimes', 'boolean'],
            'whatsapp_pickup_reminder' => ['sometimes', 'boolean'],
            'whatsapp_rental_status_change' => ['sometimes', 'boolean'],
            'whatsapp_payment_confirmation' => ['sometimes', 'boolean'],
            'whatsapp_document_expiry_alert' => ['sometimes', 'boolean'],
            'whatsapp_admin_new_booking' => ['sometimes', 'boolean'],
            'sms_new_booking' => ['sometimes', 'boolean'],
            'sms_return_reminder' => ['sometimes', 'boolean'],
            'sms_overdue_alert' => ['sometimes', 'boolean'],
            'sms_quote_request' => ['sometimes', 'boolean'],
            'sms_vehicle_expiry' => ['sometimes', 'boolean'],
            'sms_pickup_reminder' => ['sometimes', 'boolean'],
            'sms_rental_status_change' => ['sometimes', 'boolean'],
            'sms_payment_confirmation' => ['sometimes', 'boolean'],
            'sms_document_expiry_alert' => ['sometimes', 'boolean'],
            'sms_admin_new_booking' => ['sometimes', 'boolean'],
            /* Airport Booking */
            'airport_booking' => ['sometimes', 'boolean'],
            'email_airport_booking' => ['sometimes', 'boolean'],
            'whatsapp_airport_booking' => ['sometimes', 'boolean'],
            'sms_airport_booking' => ['sometimes', 'boolean'],
            'airport_booking_cancelled' => ['sometimes', 'boolean'],
            'email_airport_booking_cancelled' => ['sometimes', 'boolean'],
            'whatsapp_airport_booking_cancelled' => ['sometimes', 'boolean'],
            'sms_airport_booking_cancelled' => ['sometimes', 'boolean'],
            'airport_booking_status_changed' => ['sometimes', 'boolean'],
            'whatsapp_airport_booking_status_changed' => ['sometimes', 'boolean'],
            'sms_airport_booking_status_changed' => ['sometimes', 'boolean'],
            /* Chauffeur Booking */
            'chauffeur_booking' => ['sometimes', 'boolean'],
            'email_chauffeur_booking' => ['sometimes', 'boolean'],
            'whatsapp_chauffeur_booking' => ['sometimes', 'boolean'],
            'sms_chauffeur_booking' => ['sometimes', 'boolean'],
            'chauffeur_booking_cancelled' => ['sometimes', 'boolean'],
            'email_chauffeur_booking_cancelled' => ['sometimes', 'boolean'],
            'whatsapp_chauffeur_booking_cancelled' => ['sometimes', 'boolean'],
            'sms_chauffeur_booking_cancelled' => ['sometimes', 'boolean'],
            'chauffeur_booking_status_changed' => ['sometimes', 'boolean'],
            'whatsapp_chauffeur_booking_status_changed' => ['sometimes', 'boolean'],
            'sms_chauffeur_booking_status_changed' => ['sometimes', 'boolean'],
            'chauffeur_pickup_reminder' => ['sometimes', 'boolean'],
            'email_chauffeur_pickup_reminder' => ['sometimes', 'boolean'],
            'whatsapp_chauffeur_pickup_reminder' => ['sometimes', 'boolean'],
            'sms_chauffeur_pickup_reminder' => ['sometimes', 'boolean'],
            /* Rental Cancellation */
            'rental_cancelled' => ['sometimes', 'boolean'],
            'email_rental_cancelled' => ['sometimes', 'boolean'],
            'whatsapp_rental_cancelled' => ['sometimes', 'boolean'],
            'sms_rental_cancelled' => ['sometimes', 'boolean'],
            /* Driver Document Expiry */
            'driver_document_expiry' => ['sometimes', 'boolean'],
            'email_driver_document_expiry' => ['sometimes', 'boolean'],
            'whatsapp_driver_document_expiry' => ['sometimes', 'boolean'],
            'sms_driver_document_expiry' => ['sometimes', 'boolean'],
        ];
    }
}
