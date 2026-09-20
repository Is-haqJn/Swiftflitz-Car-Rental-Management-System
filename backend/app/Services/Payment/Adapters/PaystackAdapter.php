<?php

namespace App\Services\Payment\Adapters;

use App\DTOs\PaymentInitiateData;
use App\DTOs\PaymentResult;
use App\DTOs\PaymentVerifyResult;
use App\Services\Contracts\Payment\PaymentAdapterInterface;
use App\Settings\PaymentSettings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class PaystackAdapter implements PaymentAdapterInterface
{
    private const BASE_URL = 'https://api.paystack.co';

    public function __construct(private readonly PaymentSettings $settings) {}

    public function initiate(PaymentInitiateData $data): PaymentResult
    {
        $reference = 'TXN-' . strtoupper(Str::random(12));

        $response = Http::withToken($this->settings->paystack_secret_key)
            ->post(self::BASE_URL . '/transaction/initialize', [
                'email' => $data->payerEmail,
                'amount' => (int) round($data->amount * 100), // kobo/pesewas
                'currency' => $data->currency,
                'reference' => $reference,
                'callback_url' => $data->callbackUrl,
                'metadata' => array_merge($data->metadata, [
                    'payer_phone' => $data->payerPhone,
                    'payer_name' => $data->payerName,
                    'transactable_type' => $data->transactableType,
                    'transactable_id' => $data->transactableId,
                ]),
            ]);

        if (! $response->successful() || ! $response->json('status')) {
            return new PaymentResult(
                success: false,
                reference: $reference,
                meta: ['error' => $response->json('message', 'Payment initiation failed')],
            );
        }

        return new PaymentResult(
            success: true,
            reference: $reference,
            authorizationUrl: $response->json('data.authorization_url'),
            meta: ['access_code' => $response->json('data.access_code')],
        );
    }

    public function verify(string $reference): PaymentVerifyResult
    {
        $response = Http::withToken($this->settings->paystack_secret_key)
            ->get(self::BASE_URL . '/transaction/verify/' . $reference);

        if (! $response->successful()) {
            return new PaymentVerifyResult(success: false, status: 'failed');
        }

        $status = match ($response->json('data.status')) {
            'success' => 'paid',
            'failed', 'abandoned', 'reversed' => 'failed',
            default => 'pending',
        };

        /*
         * Paystack returns data.channel: 'card' | 'mobile_money' | 'bank' etc.
         * For mobile money, the phone is in data.authorization.mobile_money_number.
         */
        $rawChannel = $response->json('data.channel');
        $channel = match ($rawChannel) {
            'card' => 'card',
            'mobile_money' => 'momo',
            'bank', 'bank_transfer' => 'bank_transfer',
            default => $rawChannel ?: null,
        };

        $paymentPhone = null;
        $cardBin = null;
        $cardLast4 = null;
        $cardType = null;

        if ($channel === 'momo') {
            $paymentPhone = $response->json('data.authorization.mobile_money_number');
        }

        if ($channel === 'card') {
            $cardBin = $response->json('data.authorization.bin') ?: null;
            $cardLast4 = $response->json('data.authorization.last4') ?: null;
            $cardType = $response->json('data.authorization.card_type') ?: null;
        }

        /* Fallback: use customer.phone for any channel that didn't yield a phone above */
        if (! $paymentPhone) {
            $paymentPhone = $response->json('data.customer.phone') ?: null;
        }

        return new PaymentVerifyResult(
            success: true,
            status: $status,
            amount: $response->json('data.amount') ? $response->json('data.amount') / 100 : null,
            meta: ['gateway_response' => $response->json('data.gateway_response')],
            channel: $channel,
            paymentPhone: $paymentPhone,
            cardBin: $cardBin,
            cardLast4: $cardLast4,
            cardType: $cardType,
            charges: isset($response->json('data')['fees']) ? round((float) $response->json('data.fees') / 100, 2) : null,
        );
    }

    public function handleWebhook(Request $request): bool
    {
        $signature = $request->header('X-Paystack-Signature');
        $payload = $request->getContent();

        $expected = hash_hmac('sha512', $payload, $this->settings->paystack_secret_key);

        if (! hash_equals($expected, (string) $signature)) {
            return false;
        }

        return true;
    }

    public function requiresGhsConversion(): bool
    {
        return true;
    }
}
