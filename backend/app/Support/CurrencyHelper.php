<?php

namespace App\Support;

use App\Models\Branch;
use App\Settings\GeneralSettings;

final class CurrencyHelper
{
    /**
     * Resolve currency info for a branch, falling back to global settings.
     *
     * Returns: [code, symbol, rate, is_custom]
     * - rate is null when branch uses global currency (no conversion needed)
     * - is_custom is true only when branch has a different currency AND exchange_rate is set
     *
     * @return array{code: string, symbol: string, rate: float|null, is_custom: bool}
     */
    public static function resolveForBranch(?Branch $branch, GeneralSettings $settings): array
    {
        $hasCustom = $branch !== null
            && $branch->currency !== null
            && $branch->currency !== $settings->currency
            && $branch->exchange_rate !== null;

        return [
            'code' => $hasCustom ? $branch->currency : $settings->currency,
            'symbol' => $hasCustom ? ($branch->currency_symbol ?? $settings->currency_symbol) : $settings->currency_symbol,
            'rate' => $hasCustom ? (float) $branch->exchange_rate : null,
            'is_custom' => $hasCustom,
        ];
    }

    /**
     * Convert a branch-currency amount to global currency.
     *
     * Formula: amount_in_global = amount_in_branch * exchange_rate
     * e.g. 5000 NGN * 0.0082 = 41.00 GHS
     */
    public static function convertToGlobal(float $amount, float $rate): float
    {
        return round($amount * $rate, 2);
    }

    /**
     * Convert a global-currency amount to branch currency.
     *
     * Formula: amount_in_branch = amount_in_global / exchange_rate
     * e.g. GHS 50 / 0.0082 = 6097.56 NGN
     *
     * Returns $amount unchanged when rate is null (branch uses global currency)
     * or when rate is zero/negative (invalid data - guard against division by zero).
     */
    public static function convertFromGlobal(float $amount, ?float $rate): float
    {
        if ($rate === null || $rate <= 0.0) {
            return $amount;
        }

        return round($amount / $rate, 2);
    }

    /**
     * Convert an amount between two branch currencies via the global currency as an intermediary.
     *
     * e.g. 100 NGN (rate 0.0082) → global = 0.82 GHS → EUR (rate 0.9) = 0.91 EUR
     *
     * Null rate means "branch uses global currency" (no conversion for that leg).
     */
    public static function convertBetween(float $amount, ?float $fromRate, ?float $toRate): float
    {
        $globalAmount = ($fromRate !== null && $fromRate > 0.0)
            ? $amount * $fromRate
            : $amount;

        if ($toRate === null || $toRate <= 0.0) {
            return round($globalAmount, 2);
        }

        return round($globalAmount / $toRate, 2);
    }
}
