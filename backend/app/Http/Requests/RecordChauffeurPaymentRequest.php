<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RecordChauffeurPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'payment_method' => ['required', 'string', 'max:100'],
            'payment_reference' => ['nullable', 'string', 'max:255'],
            'payment_phone' => ['nullable', 'string', 'max:30'],
        ];
    }
}
