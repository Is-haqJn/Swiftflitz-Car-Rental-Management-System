<?php

namespace App\Services\Payment\Adapters;

use App\DTOs\PaymentInitiateData;
use App\DTOs\PaymentResult;
use App\DTOs\PaymentVerifyResult;
use App\Services\Contracts\Payment\PaymentAdapterInterface;
use App\Settings\PaymentSettings;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Stripe\Checkout\Session;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Stripe;
use Stripe\Webhook;

class StripeAdapter implements PaymentAdapterInterface
{
    public function __construct(private readonly PaymentSettings $settings)
    {
        Stripe::setApiKey($this->settings->stripe_secret_key);
    }

    public function initiate(PaymentInitiateData $data): PaymentResult
    {
        $reference = 'TXN-' . strtoupper(Str::random(12));

        $successUrl = $data->returnUrl
            ? $data->returnUrl . '?status=success&reference=' . $reference
            : config('app.url') . '/payment/' . $data->transactableType . '/' . $data->transactableId . '?status=success&reference=' . $reference;

        $cancelUrl = $data->returnUrl
            ? $data->returnUrl . '?status=cancelled&reference=' . $reference
            : config('app.url') . '/payment/' . $data->transactableType . '/' . $data->transactableId . '?status=cancelled&reference=' . $reference;

        $session = Session::create([
            'payment_method_types' => ['card'],
            'mode' => 'payment',
            'customer_email' => $data->payerEmail,
            'client_reference_id' => $reference,
            'metadata' => array_merge($data->metadata, [
                'payer_phone' => $data->payerPhone,
                'payer_name' => $data->payerName,
                'transactable_type' => $data->transactableType,
                'transactable_id' => $data->transactableId,
            ]),
            'line_items' => [[
                'price_data' => [
                    'currency' => strtolower($data->currency),
                    'unit_amount' => (int) round($data->amount * 100), // cents
                    'product_data' => [
                        'name' => ucfirst(str_replace('_', ' ', $data->transactableType)) . ' Payment',
                    ],
                ],
                'quantity' => 1,
            ]],
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
        ]);

        return new PaymentResult(
            success: true,
            reference: $reference,
            authorizationUrl: $session->url,
            meta: ['session_id' => $session->id],
        );
    }

    public function verify(string $reference): PaymentVerifyResult
    {
        $sessions = Session::all(['client_reference_id' => $reference, 'limit' => 1]);

        if ($sessions->isEmpty()) {
            return new PaymentVerifyResult(success: false, status: 'pending');
        }

        $session = $sessions->first();

        $status = match ($session->payment_status) {
            'paid' => 'paid',
            'unpaid' => 'pending',
            'no_payment_required' => 'paid',
            default => 'pending',
        };

        return new PaymentVerifyResult(
            success: true,
            status: $status,
            amount: $session->amount_total ? $session->amount_total / 100 : null,
            meta: ['session_id' => $session->id],
            channel: 'card',
        );
    }

    public function handleWebhook(Request $request): bool
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $secret = $this->settings->stripe_secret_key;

        try {
            Webhook::constructEvent($payload, $sigHeader, $secret);
        } catch (SignatureVerificationException) {
            return false;
        }

        return true;
    }

    public function requiresGhsConversion(): bool
    {
        return false;
    }
}
