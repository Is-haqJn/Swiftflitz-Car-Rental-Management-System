<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RecordAirportPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'payment_method' => ['required', 'string', Rule::in(['cash', 'mobile_money', 'bank_transfer', 'offline_transfer', 'card'])],
            'payment_reference' => ['nullable', 'string', 'max:255'],
            'payment_phone' => ['nullable', 'string', 'max:30'],
        ];
    }
}
