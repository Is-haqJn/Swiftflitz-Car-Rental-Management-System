<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class EarlyReturnSettings extends Settings
{
    /** Whether customers can receive a refund for unused days on early return. */
    public bool $early_return_refund_enabled;

    /** Whether an early return penalty charge is applied. */
    public bool $early_return_charge_enabled;

    /** Rate source for the early return charge: 'flat' = single rate, 'category' = per vehicle category. */
    public string $early_return_charge_type;

    /** Flat penalty fee charged on early return (used when charge_type = 'flat'). */
    public float $early_return_flat_rate;

    /**
     * Minimum days remaining on the rental to trigger early return policy.
     * Returns with fewer days remaining than this threshold result in simple forfeit -
     * no charge, no refund.
     */
    public int $early_return_threshold_days;

    public static function group(): string
    {
        return 'early_return';
    }
}
