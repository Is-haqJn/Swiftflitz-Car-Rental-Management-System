<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class WhatsAppSettings extends Settings
{
    /** Master enable/disable switch for all WhatsApp notifications */
    public bool $enabled;

    /** Meta System User Access Token (same credential as the old api_key field) */
    public ?string $access_token;

    /** Meta WhatsApp Business phone number ID (from Meta developer console) */
    public ?string $phone_number_id;

    /** Meta WhatsApp Business Account ID (WABA ID) */
    public ?string $business_account_id;

    /**
     * Test mode: when true, ALL messages are routed to test_phone_number only.
     * Takes priority over admin_only_mode. Use for dev/testing.
     */
    public bool $test_mode;

    /** Phone number to receive all messages when test_mode is enabled */
    public ?string $test_phone_number;

    /**
     * Admin-only mode: when true, all customer messages are routed to admin_only_phone_number
     * instead of the actual customer's phone number. Customer receives nothing.
     * Lower priority than test_mode. Use for staging/UAT to verify flows.
     */
    public bool $admin_only_mode;

    /** Phone number used as the admin operational alerts destination (notify_admins) */
    public ?string $admin_phone_number;

    /**
     * Phone number that receives customer-facing messages when admin_only_mode
     * or mirror_mode is active. Separate from admin_phone_number so operational
     * alerts and customer traffic monitoring use different devices.
     */
    public ?string $admin_only_phone_number;

    /**
     * Mirror mode: when true, customer messages are sent to BOTH the customer
     * AND admin_only_phone_number. admin_only_mode takes precedence when both are on.
     */
    public bool $mirror_mode;

    /**
     * Master switch for customer-facing WhatsApp notifications.
     * When false, no messages are dispatched to customer phone numbers.
     */
    public bool $notify_customers;

    /** Send WhatsApp notification on new booking creation */
    public bool $send_new_booking;

    /** Send WhatsApp return reminder */
    public bool $send_return_reminder;

    /** Send WhatsApp overdue alert */
    public bool $send_overdue_alert;

    /** Send WhatsApp pickup reminder */
    public bool $send_pickup_reminder;

    /** Send WhatsApp payment confirmation */
    public bool $send_payment_confirmation;

    /**
     * Master switch for branch-manager-facing WhatsApp notifications.
     * When false, no messages are dispatched to branch managers.
     */
    public bool $notify_branch_managers;

    /**
     * Master switch for admin-facing WhatsApp notifications.
     * When false, no admin alerts are dispatched regardless of per-type toggles.
     */
    public bool $notify_admins;

    /** Send WhatsApp admin alert when a new booking is created (always to admin phone) */
    public bool $send_admin_new_booking;

    /** Send WhatsApp admin alert when a rental is cancelled */
    public bool $send_admin_rental_cancelled;

    /** Send WhatsApp admin alert for upcoming pickup tomorrow */
    public bool $send_admin_pickup_reminder;

    /** Send WhatsApp admin alert for upcoming return tomorrow */
    public bool $send_admin_return_reminder;

    /** Send WhatsApp admin alert when a rental becomes overdue */
    public bool $send_admin_overdue_alert;

    /** Send WhatsApp admin alert when a payment is confirmed */
    public bool $send_admin_payment_confirmation;

    /** Send WhatsApp admin alert when a rental status changes */
    public bool $send_admin_rental_status_change;

    /** Send WhatsApp admin alert for new airport booking */
    public bool $send_admin_airport_booking;

    /** Send WhatsApp admin alert when airport booking is cancelled */
    public bool $send_admin_airport_booking_cancelled;

    /** Send WhatsApp admin alert for new chauffeur booking */
    public bool $send_admin_chauffeur_booking;

    /** Send WhatsApp admin alert when chauffeur booking is cancelled */
    public bool $send_admin_chauffeur_booking_cancelled;

    /** Send WhatsApp admin alert for upcoming chauffeur pickup */
    public bool $send_admin_chauffeur_pickup_reminder;

    /** Send WhatsApp notification for new airport booking */
    public bool $send_airport_booking;

    /** Send WhatsApp notification when airport booking is cancelled */
    public bool $send_airport_booking_cancelled;

    /** Send WhatsApp notification when airport booking status changes */
    public bool $send_airport_booking_status_changed;

    /** Send WhatsApp notification for new chauffeur booking */
    public bool $send_chauffeur_booking;

    /** Send WhatsApp notification when chauffeur booking is cancelled */
    public bool $send_chauffeur_booking_cancelled;

    /** Send WhatsApp notification when chauffeur booking status changes */
    public bool $send_chauffeur_booking_status_changed;

    /** Send WhatsApp chauffeur pickup reminder */
    public bool $send_chauffeur_pickup_reminder;

    /** Send WhatsApp notification when rental is cancelled */
    public bool $send_rental_cancelled;

    /** Send WhatsApp notification for driver document expiry */
    public bool $send_driver_document_expiry;

    /** Send WhatsApp notification when rental status changes */
    public bool $send_rental_status_change;

    /** Send WhatsApp notification for vehicle document expiry */
    public bool $send_vehicle_expiry;

    /** Send WhatsApp notification for new quote request */
    public bool $send_quote_request;

    /** Send WhatsApp notification for general document expiry alert */
    public bool $send_document_expiry_alert;

    /** Meta App Secret - used to verify HMAC-SHA256 signatures on incoming webhook payloads */
    public ?string $app_secret;

    /** Token set in Meta > WhatsApp > Configuration > Webhooks for hub verification */
    public ?string $webhook_verify_token;

    public static function group(): string
    {
        return 'whatsapp';
    }
}
