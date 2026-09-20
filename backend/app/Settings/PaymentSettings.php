<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class PaymentSettings extends Settings
{
    public string $payment_provider;

    public ?string $paystack_public_key;

    public ?string $paystack_secret_key;

    public ?string $stripe_public_key;

    public ?string $stripe_secret_key;

    public bool $enable_online_payments;

    public bool $enable_paystack;

    public bool $enable_stripe;

    public ?string $hubtel_client_id;

    public ?string $hubtel_client_secret;

    public ?string $hubtel_merchant_account_number;

    public bool $enable_hubtel;

    public ?string $paystack_logo_url;

    public ?string $stripe_logo_url;

    public ?string $hubtel_logo_url;

    public string $payment_currency;

    public static function group(): string
    {
        return 'payment';
    }
}
