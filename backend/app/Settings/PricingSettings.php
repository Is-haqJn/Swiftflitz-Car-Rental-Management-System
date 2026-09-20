<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class PricingSettings extends Settings
{
    public float $default_daily_rate;

    public float $weekly_discount_percentage;

    public float $monthly_discount_percentage;

    public bool $show_prices_on_website;

    public float $deposit_percentage;

    public bool $charge_deposit;

    /** Weekend surcharge as a percentage of the base cost (e.g. 10 = 10%). */
    public float $weekend_surcharge;

    /** Whether the weekend surcharge is applied. */
    public bool $apply_weekend_surcharge;

    /** Base pricing unit used for display on the website: day, week, month. */
    public string $base_pricing_unit;

    /** Global fixed security deposit amount (GH₵). Applied when vehicle and category have no override. */
    public float $global_security_deposit;

    /** Collection enforcement: 'flexible' = collect anytime | 'strict' = must collect at/before pickup */
    public string $deposit_enforcement_mode;

    /** Percentage of unused days credited back on early return (0–100). Default 100 = full credit. */
    public float $early_return_refund_rate = 100.0;

    /** Number of hours a customer quote confirmation link remains valid. */
    public int $quote_expiry_hours = 48;

    /** Payment must be completed before pickup is allowed. */
    public bool $payment_strict_mode;

    /** Allow partial deposit payment on booking. */
    public bool $online_deposit_enabled;

    /** Percentage of total required as online deposit. */
    public float $online_deposit_percentage;

    /** Hours before pickup that balance must be paid. */
    public int $balance_due_window_hours;

    /** Permission-holders can waive security deposit. */
    public bool $allow_deposit_waive;

    /** Flat fee charged when a vehicle is switched before pickup. Null = disabled. */
    public ?float $vehicle_switch_fee = null;

    /** Global young driver age threshold. Applied when vehicle and category have no override. */
    public ?int $global_young_driver_age_threshold;

    /** Global young driver deposit amount. Applied when vehicle and category have no override. */
    public ?float $global_young_driver_deposit;

    public static function group(): string
    {
        return 'pricing';
    }
}
