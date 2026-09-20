<?php

namespace App\Http\Requests;

use App\Enums\CurrencyCode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateBranchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $branchId = $this->route('branch')?->id;

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'code' => ['sometimes', 'nullable', 'string', 'max:50', Rule::unique('branches', 'code')->ignore($branchId)],
            'address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'currency' => ['sometimes', 'nullable', 'string', Rule::in(CurrencyCode::values())],
            'currency_symbol' => ['sometimes', 'nullable', 'string', 'max:5'],
            'exchange_rate' => ['sometimes', 'nullable', 'numeric', 'gt:0', 'max:1000000'],
            'show_converted_price' => ['sometimes', 'nullable', 'boolean'],
            'has_airport_service' => ['sometimes', 'boolean'],
            'airport_id' => ['sometimes', 'nullable', 'string', 'exists:airports,id'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $currency = $this->input('currency');
            $currencySymbol = $this->input('currency_symbol');

            if ($currency && $currencySymbol && ! $this->input('exchange_rate')) {
                $validator->errors()->add('exchange_rate', 'Exchange rate is required when currency code and symbol are set.');
            }
        });
    }
}
