<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SettleRentalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0'],
            'payment_method' => ['nullable', 'string'],
            'payment_phone' => ['nullable', 'string', 'max:30'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
