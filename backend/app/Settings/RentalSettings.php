<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class RentalSettings extends Settings
{
    public int $min_rental_days;

    public int $max_rental_days;

    public int $booking_advance_days;

    public bool $require_license_verification;

    public bool $allow_public_booking;

    public bool $auto_confirm_bookings;

    public int $overdue_check_hour;

    public string $return_reminder_hours_before;

    public bool $allow_online_booking;

    public bool $booking_requires_confirmation;

    public int $booking_grace_period_hours;

    public bool $vat_enabled;

    public float $vat_rate;

    public string $coupon_code_prefix;

    public string $pickup_window_start;

    public string $pickup_window_end;

    public ?int $return_time_threshold;

    public bool $documents_required;

    public static function group(): string
    {
        return 'rental';
    }
}
