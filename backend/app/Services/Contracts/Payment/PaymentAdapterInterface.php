<?php

namespace App\Services\Contracts\Payment;

use App\DTOs\PaymentInitiateData;
use App\DTOs\PaymentResult;
use App\DTOs\PaymentVerifyResult;
use Illuminate\Http\Request;

interface PaymentAdapterInterface
{
    /**
     * Initiate a payment and return a redirect URL.
     */
    public function initiate(PaymentInitiateData $data): PaymentResult;

    /**
     * Verify the status of a payment by its reference.
     */
    public function verify(string $reference): PaymentVerifyResult;

    /**
     * Handle an inbound webhook from the provider.
     * Returns true if the webhook was valid and processed, false to silently ignore.
     */
    public function handleWebhook(Request $request): bool;

    /**
     * Whether this provider requires amounts to be converted to GHS before initiating.
     * Providers with GHS-only merchant accounts (e.g. Hubtel, Paystack GHS) return true.
     */
    public function requiresGhsConversion(): bool;
}
