<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEarlyReturnSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'early_return_refund_enabled' => ['sometimes', 'boolean'],
            'early_return_charge_enabled' => ['sometimes', 'boolean'],
            'early_return_charge_type' => ['sometimes', 'string', 'in:flat,category'],
            'early_return_flat_rate' => ['sometimes', 'numeric', 'min:0'],
            'early_return_threshold_days' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
