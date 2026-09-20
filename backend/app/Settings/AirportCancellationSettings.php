<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class AirportCancellationSettings extends Settings
{
    /** Hours before the booking during which cancellation is free. */
    public int $free_cancellation_hours;

    /** Fee type applied when cancelling outside the free window: flat | percentage. */
    public string $cancellation_fee_type;

    /** Fee amount (flat value or percentage of booking total). */
    public float $cancellation_fee_amount;

    public static function group(): string
    {
        return 'airport_cancellation';
    }
}
