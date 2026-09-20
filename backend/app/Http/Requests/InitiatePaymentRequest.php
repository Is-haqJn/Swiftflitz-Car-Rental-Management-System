<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InitiatePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0.01'],
            'currency' => ['sometimes', 'string', 'max:5'],
            'payer_email' => ['required', 'email'],
            'payer_phone' => ['required', 'string', 'max:20'],
            'payer_name' => ['required', 'string', 'max:255'],
            'transactable_type' => ['required', 'string', 'in:rental,airport_booking,chauffeur_booking'],
            'transactable_id' => ['required', 'string', 'uuid'],
            'callback_url' => ['sometimes', 'nullable', 'url'],
            'return_url' => ['sometimes', 'nullable', 'url'],
            'metadata' => ['sometimes', 'array'],
        ];
    }
    // {
    //     "amount": 150.50,
    //     "currency": "USD",
    //     "payer_email": "john.doe@example.com",
    //     "payer_phone": "+1234567890",
    //     "payer_name": "John Doe",
    //     "transactable_type": "rental",
    //     "transactable_id": "550e8400-e29b-41d4-a716-446655440000",
    //     "callback_url": "https://your-app.test/api/payments/callback",
    //     "return_url": "https://your-app.test/dashboard",
    //     "metadata": {
    //         "order_reference": "ORD-12345",
    //         "customer_id": "CUST-789"
    //     }
    // }
}
