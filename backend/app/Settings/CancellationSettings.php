<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class CancellationSettings extends Settings
{
    /** Hours before pickup within which cancellation is free. */
    public int $free_cancellation_window_hours;

    /** Hours after scheduled pickup before the booking is considered a no-show. */
    public int $no_show_grace_period_hours;

    /** Flat fee charged for cancelling within the free-cancellation window (before pickup). */
    public float $before_pickup_cancellation_fee;

    /** Fee charged for modifying a booking after the free modification window. */
    public float $modification_fee;

    /** Hours before pickup within which modifications are free. */
    public int $modification_free_window_hours;

    /** Fee charged for cancelling an active (mid-rental) booking. */
    public float $after_pickup_cancellation_fee;

    /** Days before return date after which cancellation of an active/overdue rental is blocked (0 = no cutoff). */
    public int $cancellation_cutoff_days;

    public static function group(): string
    {
        return 'cancellation';
    }
}
