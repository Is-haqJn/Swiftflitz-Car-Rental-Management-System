<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class ChauffeurSettings extends Settings
{
    /** Grace period in minutes before overtime charges apply after scheduled return time. */
    public int $grace_period_minutes;

    /** Flat fee applied when a booking is cancelled. */
    public float $cancellation_flat_fee;

    /** Charge per hour (rounded up) for overtime beyond scheduled return + grace period. */
    public float $overtime_charge_per_hour;

    /** Fee applied when a customer does not show up for their booking. */
    public float $no_show_fee;

    /** Standard time all bookings are expected to be returned (HH:mm). Overtime starts after this. */
    public string $standard_return_time;

    /** Earliest hour a pickup can be scheduled (HH:mm). */
    public string $booking_window_start;

    /** Latest hour a pickup can be scheduled (HH:mm). */
    public string $booking_window_end;

    public static function group(): string
    {
        return 'chauffeur';
    }
}
