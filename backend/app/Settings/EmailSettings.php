<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class EmailSettings extends Settings
{
    public string $mailer;

    public string $host;

    public int $port;

    public string $encryption;

    public string $username;

    public ?string $password;

    public string $from_address;

    public string $from_name;

    public bool $send_new_booking_notification;

    public bool $send_return_reminder;

    public bool $send_overdue_alert;

    public bool $send_quote_confirmation;

    /** Master switch for customer-facing email notifications */
    public bool $notify_customers;

    /** Master switch for branch-manager-facing email notifications */
    public bool $notify_branch_managers;

    /** Master switch for admin-facing email notifications */
    public bool $notify_admins;

    /** Send email admin alert when a new booking is created */
    public bool $send_admin_new_booking;

    /** Send email admin alert when a rental is cancelled */
    public bool $send_admin_rental_cancelled;

    /** Send email admin alert for upcoming pickup tomorrow */
    public bool $send_admin_pickup_reminder;

    /** Send email admin alert for upcoming return tomorrow */
    public bool $send_admin_return_reminder;

    /** Send email admin alert when a rental becomes overdue */
    public bool $send_admin_overdue_alert;

    /** Send email admin alert when a payment is confirmed */
    public bool $send_admin_payment_confirmation;

    /** Send email admin alert when a rental status changes */
    public bool $send_admin_rental_status_change;

    /** Send email admin alert for new airport booking */
    public bool $send_admin_airport_booking;

    /** Send email admin alert when airport booking is cancelled */
    public bool $send_admin_airport_booking_cancelled;

    /** Send email admin alert for new chauffeur booking */
    public bool $send_admin_chauffeur_booking;

    /** Send email admin alert when chauffeur booking is cancelled */
    public bool $send_admin_chauffeur_booking_cancelled;

    /** Send email admin alert for upcoming chauffeur pickup */
    public bool $send_admin_chauffeur_pickup_reminder;

    public static function group(): string
    {
        return 'email';
    }
}
