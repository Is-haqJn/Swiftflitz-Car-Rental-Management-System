<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProcessReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'fuel_level' => ['nullable', 'string', 'in:empty,quarter,half,three_quarter,full'],
            'mileage' => ['nullable', 'integer', 'min:0'],
            'condition_notes' => ['nullable', 'string'],
            'damage_noted' => ['nullable', 'boolean'],
            'estimated_repair_cost' => ['nullable', 'numeric', 'min:0'],
            'early_return_reason' => ['nullable', 'string'],
            'photo_tus_tokens' => ['nullable', 'array', 'max:10'],
            'photo_tus_tokens.*' => ['nullable', 'string'],
            'damage_types' => ['nullable', 'array'],
            'damage_types.*' => ['string'],
            'damage_severity' => ['nullable', 'string', 'in:minor,moderate,severe'],
            'damage_description' => ['nullable', 'string'],
            'amount_paid' => ['nullable', 'numeric', 'min:0'],
            'waive_early_return_charge' => ['nullable', 'boolean'],
            'early_return_charge_waiver_reason' => ['nullable', 'string', 'required_if:waive_early_return_charge,true'],
        ];
    }
}
