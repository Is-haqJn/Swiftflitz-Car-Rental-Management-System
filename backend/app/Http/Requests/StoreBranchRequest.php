<?php

namespace App\Http\Requests;

use App\Enums\CurrencyCode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreBranchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50', 'unique:branches,code'],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
            'currency' => ['nullable', 'string', Rule::in(CurrencyCode::values())],
            'currency_symbol' => ['nullable', 'string', 'max:5'],
            'exchange_rate' => ['nullable', 'numeric', 'gt:0', 'max:1000000'],
            'show_converted_price' => ['nullable', 'boolean'],
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
