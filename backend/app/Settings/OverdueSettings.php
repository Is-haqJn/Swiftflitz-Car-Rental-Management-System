<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class OverdueSettings extends Settings
{
    /** When overdue period starts: 'exact' = at return time | 'grace_period' = after grace period. */
    public string $overdue_start_type;

    /** Minutes after return time before overdue charges begin (used when overdue_start_type = grace_period). */
    public int $grace_period_minutes;

    /** Global fallback per-hour overdue rate (vehicle → category → this). */
    public float $overdue_hourly_rate;

    /** Hours before scheduled return to trigger return-reminder notifications. */
    public int $prep_buffer_hours;

    /** Hours overdue before switching from hourly to a single full-day charge. */
    public int $overdue_threshold_hours;

    /** Master toggle: when false, no one can waive overdue fees (overrides role permissions). */
    public bool $allow_overdue_waive;

    /** Automatically waive the full-day late-return charge. */
    public bool $full_day_late_return_waiver;

    public static function group(): string
    {
        return 'overdue';
    }
}
