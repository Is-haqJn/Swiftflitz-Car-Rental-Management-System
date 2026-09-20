<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePricingSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'default_daily_rate' => ['sometimes', 'numeric', 'min:0'],
            'weekly_discount_percentage' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'monthly_discount_percentage' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'show_prices_on_website' => ['sometimes', 'boolean'],
            'deposit_percentage' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'charge_deposit' => ['sometimes', 'boolean'],
            'weekend_surcharge' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'apply_weekend_surcharge' => ['sometimes', 'boolean'],
            'base_pricing_unit' => ['sometimes', 'string', 'in:day,week,month'],
            'global_security_deposit' => ['sometimes', 'numeric', 'min:0'],
            'deposit_enforcement_mode' => ['sometimes', 'string', 'in:flexible,strict'],
            'early_return_refund_rate' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'quote_expiry_hours' => ['sometimes', 'integer', 'min:1'],
            'payment_strict_mode' => ['sometimes', 'boolean'],
            'online_deposit_enabled' => ['sometimes', 'boolean'],
            'online_deposit_percentage' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'balance_due_window_hours' => ['sometimes', 'integer', 'min:0'],
            'allow_deposit_waive' => ['sometimes', 'boolean'],
            'vehicle_switch_fee' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'global_young_driver_age_threshold' => ['sometimes', 'nullable', 'integer', 'min:16', 'max:99'],
            'global_young_driver_deposit' => ['sometimes', 'nullable', 'numeric', 'min:0'],
        ];
    }
}
