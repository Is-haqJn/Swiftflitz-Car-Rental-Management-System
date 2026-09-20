<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAirportLocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'location_type' => ['required', 'string', 'in:terminal,area'],
            'airport_id' => ['required_if:location_type,terminal', 'nullable', 'string', 'exists:airports,id'],
            'branch_id' => ['required_if:location_type,area', 'nullable', 'string', 'exists:branches,id'],
            'name' => ['required', 'string', 'max:255'],
            'has_charge' => ['required', 'boolean'],
            'charge_amount' => ['required_if:has_charge,true', 'nullable', 'numeric', 'min:0'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'airport_id.required_if' => 'An airport is required for terminal locations.',
            'branch_id.required_if' => 'A branch is required for area locations.',
            'charge_amount.required_if' => 'A charge amount is required when has_charge is true.',
        ];
    }
}
