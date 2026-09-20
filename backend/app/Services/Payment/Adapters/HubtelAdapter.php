<?php

namespace App\Services\Payment\Adapters;

use App\DTOs\PaymentInitiateData;
use App\DTOs\PaymentResult;
use App\DTOs\PaymentVerifyResult;
use App\Enums\PaymentTransactionStatus;
use App\Services\Contracts\Payment\PaymentAdapterInterface;
use App\Settings\PaymentSettings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class HubtelAdapter implements PaymentAdapterInterface
{
    private const CHECKOUT_URL = 'https://payproxyapi.hubtel.com/items/initiate';

    public function __construct(private readonly PaymentSettings $settings) {}

    public function initiate(PaymentInitiateData $data): PaymentResult
    {
        $reference = 'TXN-' . strtoupper(Str::random(12));

        $frontendBase = rtrim(config('app.frontend_url'), '/');

        /* Use & when the URL already carries query params, otherwise ?. */
        if ($data->returnUrl) {
            $sep = str_contains($data->returnUrl, '?') ? '&' : '?';
            $returnUrl = $data->returnUrl . $sep . 'status=success&reference=' . $reference;
            $cancelUrl = $data->returnUrl . $sep . 'status=cancelled&reference=' . $reference;
        } else {
            $returnUrl = $frontendBase . '/payment/' . $data->transactableType . '/' . $data->transactableId . '?status=success&reference=' . $reference;
            $cancelUrl = $frontendBase . '/payment/cancelled?reference=' . $reference;
        }

        $response = Http::withBasicAuth(
            $this->settings->hubtel_client_id,
            $this->settings->hubtel_client_secret
        )->post(self::CHECKOUT_URL, array_filter([
            'totalAmount' => $data->amount,
            'description' => ucfirst(str_replace('_', ' ', $data->transactableType)) . ' Payment',
            'callbackUrl' => config('app.url') . '/api/v1/payments/webhook/hubtel',
            'returnUrl' => $returnUrl,
            'cancellationUrl' => $cancelUrl,
            'merchantAccountNumber' => $this->settings->hubtel_merchant_account_number,
            'clientReference' => $reference,
            'payeeName' => $data->payerName ?: null,
            'payeeMobileNumber' => $data->payerPhone ?: null,
            'payeeEmail' => $data->payerEmail ?: null,
        ]));

        if (! $response->successful()) {
            return new PaymentResult(
                success: false,
                reference: $reference,
                meta: ['error' => $response->json('message', 'Payment initiation failed')],
            );
        }

        $checkoutUrl = $response->json('data.checkoutUrl') ?? $response->json('checkoutUrl');
        /* Hubtel's own unique transaction ID - store as provider_reference. */
        $checkoutId = $response->json('data.checkoutId') ?? $response->json('checkoutId');

        if (! $checkoutUrl) {
            return new PaymentResult(
                success: false,
                reference: $reference,
                meta: ['error' => 'No checkout URL returned from Hubtel'],
            );
        }

        return new PaymentResult(
            success: true,
            reference: $reference,
            authorizationUrl: $checkoutUrl,
            providerReference: $checkoutId ?: null,
        );
    }

    public function verify(string $reference): PaymentVerifyResult
    {
        $merchantAccountNumber = $this->settings->hubtel_merchant_account_number;

        $response = Http::withBasicAuth(
            $this->settings->hubtel_client_id,
            $this->settings->hubtel_client_secret
        )->get("https://api-txnstatus.hubtel.com/transactions/{$merchantAccountNumber}/status", [
            'clientReference' => $reference,
        ]);

        if (! $response->successful()) {
            return new PaymentVerifyResult(success: false, status: 'pending');
        }

        $responseCode = $response->json('responseCode');
        $txStatus = $response->json('data.status'); // "Paid" | "Unpaid" | "Refunded"

        $status = match (true) {
            $responseCode === '0000' && $txStatus === 'Paid' => PaymentTransactionStatus::Paid->value,
            $responseCode === '0000' && $txStatus === 'Refunded' => PaymentTransactionStatus::Refunded->value,
            $txStatus === 'Unpaid' => PaymentTransactionStatus::Failed->value,
            default => PaymentTransactionStatus::Pending->value,
        };

        /*
         * Hubtel status check returns paymentMethod: 'mobilemoney' | 'card'.
         * Map to internal channel labels.
         */
        $paymentMethod = strtolower((string) $response->json('data.paymentMethod'));
        $channel = match (true) {
            str_contains($paymentMethod, 'mobile') || $paymentMethod === 'momo' => 'momo',
            str_contains($paymentMethod, 'card') => 'card',
            default => $paymentMethod ?: null,
        };

        /*
         * Hubtel returns CustomerPhoneNumber for both momo and card channels.
         * MobileMoneyNumber is preferred for momo as it is the wallet number.
         */
        if ($channel === 'momo') {
            $paymentPhone = $response->json('data.CustomerPhoneNumber')
                ?? $response->json('data.PaymentDetails.MobileMoneyNumber');
        } else {
            $paymentPhone = $response->json('data.CustomerPhoneNumber') ?: null;
        }

        /* Hubtel does not expose card bin/last4 - left null */
        return new PaymentVerifyResult(
            success: true,
            status: $status,
            amount: $response->json('data.amount'),
            meta: ['response_code' => $responseCode, 'tx_status' => $txStatus],
            channel: $channel,
            paymentPhone: $paymentPhone,
            charges: $response->json('data.charges') !== null ? (float) $response->json('data.charges') : null,
        );
    }

    public function handleWebhook(Request $request): bool
    {
        $responseCode = $request->input('ResponseCode');
        $status = $request->input('Status') ?? $request->input('Data.Status');

        return $responseCode === '0000' && $status === 'Success';
    }

    public function requiresGhsConversion(): bool
    {
        return true;
    }
}
