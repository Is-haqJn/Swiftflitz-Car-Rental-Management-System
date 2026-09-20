<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class NotificationSystemSettings extends Settings
{
    /** In-app: new booking created */
    public bool $new_booking;

    /** In-app: rental return reminder */
    public bool $return_reminder;

    /** In-app: overdue rental alert */
    public bool $overdue_alert;

    /** In-app: quote request received */
    public bool $quote_request;

    /** In-app: vehicle document expiry */
    public bool $vehicle_expiry;

    /** In-app: pickup reminder */
    public bool $pickup_reminder;

    /** Email: new booking confirmation */
    public bool $email_new_booking;

    /** Email: return reminder */
    public bool $email_return_reminder;

    /** Email: overdue alert */
    public bool $email_overdue_alert;

    /** Email: quote request confirmation */
    public bool $email_quote_request;

    /** Email: vehicle expiry notification */
    public bool $email_vehicle_expiry;

    /** Email: pickup reminder */
    public bool $email_pickup_reminder;

    /** Email: customer quote confirmation (sent to the customer who submitted the quote) */
    public bool $email_quote_confirmation;

    /** Email: quote ready (sent to the customer when their quote has been prepared) */
    public bool $email_quote_ready;

    /** In-app: rental status changes (e.g. confirmed, returned, completed) */
    public bool $rental_status_change;

    /** Email: rental status change notification */
    public bool $email_rental_status_change;

    /** In-app: payment confirmation when a payment is recorded */
    public bool $payment_confirmation;

    /** Email: payment confirmation */
    public bool $email_payment_confirmation;

    /** In-app: document expiry alert (licence, insurance, etc.) */
    public bool $document_expiry_alert;

    /** Email: document expiry alert */
    public bool $email_document_expiry_alert;

    /** WhatsApp: new booking created */
    public bool $whatsapp_new_booking;

    /** WhatsApp: rental return reminder */
    public bool $whatsapp_return_reminder;

    /** WhatsApp: overdue rental alert */
    public bool $whatsapp_overdue_alert;

    /** WhatsApp: quote request received */
    public bool $whatsapp_quote_request;

    /** WhatsApp: vehicle document expiry */
    public bool $whatsapp_vehicle_expiry;

    /** WhatsApp: pickup reminder */
    public bool $whatsapp_pickup_reminder;

    /** WhatsApp: rental status changes */
    public bool $whatsapp_rental_status_change;

    /** WhatsApp: payment confirmation */
    public bool $whatsapp_payment_confirmation;

    /** WhatsApp: admin new booking alert (sent to admin, not customer) */
    public bool $whatsapp_admin_new_booking;

    /** WhatsApp: admin rental cancelled alert */
    public bool $whatsapp_admin_rental_cancelled;

    /** WhatsApp: admin pickup reminder */
    public bool $whatsapp_admin_pickup_reminder;

    /** WhatsApp: admin return reminder */
    public bool $whatsapp_admin_return_reminder;

    /** WhatsApp: admin overdue alert */
    public bool $whatsapp_admin_overdue_alert;

    /** WhatsApp: admin payment confirmation */
    public bool $whatsapp_admin_payment_confirmation;

    /** WhatsApp: admin rental status change */
    public bool $whatsapp_admin_rental_status_change;

    /** WhatsApp: admin airport booking alert */
    public bool $whatsapp_admin_airport_booking;

    /** WhatsApp: admin airport booking cancelled alert */
    public bool $whatsapp_admin_airport_booking_cancelled;

    /** WhatsApp: admin chauffeur booking alert */
    public bool $whatsapp_admin_chauffeur_booking;

    /** WhatsApp: admin chauffeur booking cancelled alert */
    public bool $whatsapp_admin_chauffeur_booking_cancelled;

    /** WhatsApp: admin chauffeur pickup reminder */
    public bool $whatsapp_admin_chauffeur_pickup_reminder;

    /** WhatsApp: document expiry alert */
    public bool $whatsapp_document_expiry_alert;

    /** SMS: new booking created */
    public bool $sms_new_booking;

    /** SMS: rental return reminder */
    public bool $sms_return_reminder;

    /** SMS: overdue rental alert */
    public bool $sms_overdue_alert;

    /** SMS: quote request received */
    public bool $sms_quote_request;

    /** SMS: vehicle document expiry */
    public bool $sms_vehicle_expiry;

    /** SMS: pickup reminder */
    public bool $sms_pickup_reminder;

    /** SMS: rental status changes */
    public bool $sms_rental_status_change;

    /** SMS: payment confirmation */
    public bool $sms_payment_confirmation;

    /** SMS: admin new booking alert (sent to admin, not customer) */
    public bool $sms_admin_new_booking;

    /** SMS: admin rental cancelled alert */
    public bool $sms_admin_rental_cancelled;

    /** SMS: admin pickup reminder */
    public bool $sms_admin_pickup_reminder;

    /** SMS: admin return reminder */
    public bool $sms_admin_return_reminder;

    /** SMS: admin overdue alert */
    public bool $sms_admin_overdue_alert;

    /** SMS: admin payment confirmation */
    public bool $sms_admin_payment_confirmation;

    /** SMS: admin rental status change */
    public bool $sms_admin_rental_status_change;

    /** SMS: admin airport booking alert */
    public bool $sms_admin_airport_booking;

    /** SMS: admin airport booking cancelled alert */
    public bool $sms_admin_airport_booking_cancelled;

    /** SMS: admin chauffeur booking alert */
    public bool $sms_admin_chauffeur_booking;

    /** SMS: admin chauffeur booking cancelled alert */
    public bool $sms_admin_chauffeur_booking_cancelled;

    /** SMS: admin chauffeur pickup reminder */
    public bool $sms_admin_chauffeur_pickup_reminder;

    /** SMS: document expiry alert */
    public bool $sms_document_expiry_alert;

    /* Airport Booking */

    /** In-app: new airport booking created */
    public bool $airport_booking;

    /** Email: new airport booking confirmation */
    public bool $email_airport_booking;

    /** WhatsApp: new airport booking */
    public bool $whatsapp_airport_booking;

    /** SMS: new airport booking */
    public bool $sms_airport_booking;

    /** In-app: airport booking cancelled */
    public bool $airport_booking_cancelled;

    /** Email: airport booking cancelled */
    public bool $email_airport_booking_cancelled;

    /** WhatsApp: airport booking cancelled */
    public bool $whatsapp_airport_booking_cancelled;

    /** SMS: airport booking cancelled */
    public bool $sms_airport_booking_cancelled;

    /** In-app: airport booking status changed */
    public bool $airport_booking_status_changed;

    /** WhatsApp: airport booking status changed */
    public bool $whatsapp_airport_booking_status_changed;

    /** SMS: airport booking status changed */
    public bool $sms_airport_booking_status_changed;

    /* Chauffeur Booking */

    /** In-app: new chauffeur booking created */
    public bool $chauffeur_booking;

    /** Email: new chauffeur booking confirmation */
    public bool $email_chauffeur_booking;

    /** WhatsApp: new chauffeur booking */
    public bool $whatsapp_chauffeur_booking;

    /** SMS: new chauffeur booking */
    public bool $sms_chauffeur_booking;

    /** In-app: chauffeur booking cancelled */
    public bool $chauffeur_booking_cancelled;

    /** Email: chauffeur booking cancelled */
    public bool $email_chauffeur_booking_cancelled;

    /** WhatsApp: chauffeur booking cancelled */
    public bool $whatsapp_chauffeur_booking_cancelled;

    /** SMS: chauffeur booking cancelled */
    public bool $sms_chauffeur_booking_cancelled;

    /** In-app: chauffeur booking status changed */
    public bool $chauffeur_booking_status_changed;

    /** WhatsApp: chauffeur booking status changed */
    public bool $whatsapp_chauffeur_booking_status_changed;

    /** SMS: chauffeur booking status changed */
    public bool $sms_chauffeur_booking_status_changed;

    /** In-app: chauffeur pickup reminder */
    public bool $chauffeur_pickup_reminder;

    /** Email: chauffeur pickup reminder */
    public bool $email_chauffeur_pickup_reminder;

    /** WhatsApp: chauffeur pickup reminder */
    public bool $whatsapp_chauffeur_pickup_reminder;

    /** SMS: chauffeur pickup reminder */
    public bool $sms_chauffeur_pickup_reminder;

    /* Rental Cancellation */

    /** In-app: rental cancelled */
    public bool $rental_cancelled;

    /** Email: rental cancelled */
    public bool $email_rental_cancelled;

    /** WhatsApp: rental cancelled */
    public bool $whatsapp_rental_cancelled;

    /** SMS: rental cancelled */
    public bool $sms_rental_cancelled;

    /* Driver Document Expiry */

    /** In-app: driver document expiry alert */
    public bool $driver_document_expiry;

    /** Email: driver document expiry alert */
    public bool $email_driver_document_expiry;

    /** WhatsApp: driver document expiry alert */
    public bool $whatsapp_driver_document_expiry;

    /** SMS: driver document expiry alert */
    public bool $sms_driver_document_expiry;

    /** In-app: send to branch managers (staff with branch assignment) */
    public bool $inapp_notify_branch_managers;

    /** In-app: send to global admins (super_admin / admin without branch) */
    public bool $inapp_notify_admins;

    public static function group(): string
    {
        return 'notifications';
    }
}
