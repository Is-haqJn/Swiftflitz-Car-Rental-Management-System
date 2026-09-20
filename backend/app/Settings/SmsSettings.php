<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class SmsSettings extends Settings
{
    /** Master enable/disable switch for all SMS notifications */
    public bool $enabled;

    /** Active SMS provider: 'arkessel', 'twilio', or 'nalo' */
    public string $default_provider;

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
     * Master switch for customer-facing SMS notifications.
     * When false, no messages are dispatched to customer phone numbers.
     */
    public bool $notify_customers;

    /** Send SMS notification on new booking creation */
    public bool $send_new_booking;

    /** Send SMS return reminder */
    public bool $send_return_reminder;

    /** Send SMS overdue alert */
    public bool $send_overdue_alert;

    /** Send SMS pickup reminder */
    public bool $send_pickup_reminder;

    /** Send SMS payment confirmation */
    public bool $send_payment_confirmation;

    /**
     * Master switch for branch-manager-facing SMS notifications.
     * When false, no messages are dispatched to branch managers.
     */
    public bool $notify_branch_managers;

    /**
     * Master switch for admin-facing SMS notifications.
     * When false, no admin alerts are dispatched regardless of per-type toggles.
     */
    public bool $notify_admins;

    /** Send SMS admin alert when a new booking is created (always to admin phone) */
    public bool $send_admin_new_booking;

    /** Send SMS admin alert when a rental is cancelled */
    public bool $send_admin_rental_cancelled;

    /** Send SMS admin alert for upcoming pickup tomorrow */
    public bool $send_admin_pickup_reminder;

    /** Send SMS admin alert for upcoming return tomorrow */
    public bool $send_admin_return_reminder;

    /** Send SMS admin alert when a rental becomes overdue */
    public bool $send_admin_overdue_alert;

    /** Send SMS admin alert when a payment is confirmed */
    public bool $send_admin_payment_confirmation;

    /** Send SMS admin alert when a rental status changes */
    public bool $send_admin_rental_status_change;

    /** Send SMS admin alert for new airport booking */
    public bool $send_admin_airport_booking;

    /** Send SMS admin alert when airport booking is cancelled */
    public bool $send_admin_airport_booking_cancelled;

    /** Send SMS admin alert for new chauffeur booking */
    public bool $send_admin_chauffeur_booking;

    /** Send SMS admin alert when chauffeur booking is cancelled */
    public bool $send_admin_chauffeur_booking_cancelled;

    /** Send SMS admin alert for upcoming chauffeur pickup */
    public bool $send_admin_chauffeur_pickup_reminder;

    /** Send SMS notification for new airport booking */
    public bool $send_airport_booking;

    /** Send SMS notification when airport booking is cancelled */
    public bool $send_airport_booking_cancelled;

    /** Send SMS notification when airport booking status changes */
    public bool $send_airport_booking_status_changed;

    /** Send SMS notification for new chauffeur booking */
    public bool $send_chauffeur_booking;

    /** Send SMS notification when chauffeur booking is cancelled */
    public bool $send_chauffeur_booking_cancelled;

    /** Send SMS notification when chauffeur booking status changes */
    public bool $send_chauffeur_booking_status_changed;

    /** Send SMS chauffeur pickup reminder */
    public bool $send_chauffeur_pickup_reminder;

    /** Send SMS notification when rental is cancelled */
    public bool $send_rental_cancelled;

    /** Send SMS notification for driver document expiry */
    public bool $send_driver_document_expiry;

    /** Send SMS notification when rental status changes */
    public bool $send_rental_status_change;

    /** Send SMS notification for vehicle document expiry */
    public bool $send_vehicle_expiry;

    /** Send SMS notification for new quote request */
    public bool $send_quote_request;

    /** Send SMS notification for general document expiry alert */
    public bool $send_document_expiry_alert;

    /** Arkessel API key (masked in responses) */
    public ?string $arkessel_api_key;

    /** Arkessel sender ID shown to recipients */
    public ?string $arkessel_sender_id;

    /** Twilio Account SID */
    public ?string $twilio_account_sid;

    /** Twilio Auth Token (masked in responses) */
    public ?string $twilio_auth_token;

    /** Twilio from phone number (E.164 format, e.g. +15550000001) */
    public ?string $twilio_from_number;

    /** Nalo Solutions API key (masked in responses) */
    public ?string $nalo_api_key;

    /** Nalo sender ID shown to recipients */
    public ?string $nalo_sender_id;

    /** Hubtel SMSC client ID */
    public ?string $hubtel_sms_client_id;

    /** Hubtel SMSC client secret (masked in responses) */
    public ?string $hubtel_sms_client_secret;

    /** Hubtel sender ID shown to recipients */
    public ?string $hubtel_sms_sender_id;

    public static function group(): string
    {
        return 'sms';
    }
}
