<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePaymentSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'payment_provider' => ['sometimes', 'string', 'in:paystack,stripe,hubtel'],
            'paystack_public_key' => ['sometimes', 'nullable', 'string'],
            'paystack_secret_key' => ['sometimes', 'nullable', 'string'],
            'stripe_public_key' => ['sometimes', 'nullable', 'string'],
            'stripe_secret_key' => ['sometimes', 'nullable', 'string'],
            'hubtel_client_id' => ['sometimes', 'nullable', 'string'],
            'hubtel_client_secret' => ['sometimes', 'nullable', 'string'],
            'hubtel_merchant_account_number' => ['sometimes', 'nullable', 'string'],
            'enable_online_payments' => ['sometimes', 'boolean'],
            'enable_paystack' => ['sometimes', 'boolean'],
            'enable_stripe' => ['sometimes', 'boolean'],
            'enable_hubtel' => ['sometimes', 'boolean'],
            'payment_currency' => ['sometimes', 'string', 'max:5'],
            'paystack_logo_url' => ['sometimes', 'nullable', 'url'],
            'stripe_logo_url' => ['sometimes', 'nullable', 'url'],
            'hubtel_logo_url' => ['sometimes', 'nullable', 'url'],
        ];
    }
}
