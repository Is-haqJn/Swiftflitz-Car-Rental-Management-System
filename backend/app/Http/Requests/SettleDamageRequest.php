<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SettleDamageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'actual_repair_cost' => ['required', 'numeric', 'min:0'],
            'outcome' => ['required', 'string', 'in:settled,forfeited'],
            'balance_collected_now' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
