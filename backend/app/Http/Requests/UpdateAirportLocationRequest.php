<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAirportLocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'location_type' => ['sometimes', 'string', 'in:terminal,area'],
            'airport_id' => ['sometimes', 'nullable', 'string', 'exists:airports,id'],
            'branch_id' => ['sometimes', 'nullable', 'string', 'exists:branches,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'has_charge' => ['sometimes', 'boolean'],
            'charge_amount' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
