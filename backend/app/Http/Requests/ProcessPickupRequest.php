<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProcessPickupRequest extends FormRequest
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
            'damage_types' => ['nullable', 'array'],
            'damage_types.*' => ['string'],
            'damage_severity' => ['nullable', 'string', 'in:minor,moderate,severe'],
            'damage_description' => ['nullable', 'string'],
            'photo_tus_tokens' => ['nullable', 'array', 'max:10'],
            'photo_tus_tokens.*' => ['nullable', 'string'],
            'early_pickup_option' => ['nullable', 'string', 'in:shift_return_date,keep_return_date'],
            'late_pickup_fee' => ['nullable', 'numeric', 'min:0'],
            'amount_paid' => ['nullable', 'numeric', 'min:0'],
            'collect_deposit' => ['nullable', 'boolean'],
        ];
    }
}
