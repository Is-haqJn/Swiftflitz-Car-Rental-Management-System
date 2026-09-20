<?php

namespace App\Services\Payment;

use App\Services\Contracts\Payment\PaymentAdapterInterface;
use App\Services\Payment\Adapters\HubtelAdapter;
use App\Services\Payment\Adapters\PaystackAdapter;
use App\Services\Payment\Adapters\StripeAdapter;
use App\Settings\PaymentSettings;
use InvalidArgumentException;

class PaymentManager
{
    public function __construct(private readonly PaymentSettings $settings) {}

    /**
     * Resolve the payment adapter for the given provider.
     * Defaults to the configured payment_provider setting.
     */
    public function adapter(?string $provider = null): PaymentAdapterInterface
    {
        $provider ??= $this->settings->payment_provider;

        return match ($provider) {
            'paystack' => new PaystackAdapter($this->settings),
            'stripe' => new StripeAdapter($this->settings),
            'hubtel' => new HubtelAdapter($this->settings),
            default => throw new InvalidArgumentException("Unknown payment provider: {$provider}"),
        };
    }
}
