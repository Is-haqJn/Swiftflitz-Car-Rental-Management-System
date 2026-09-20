<?php

namespace App\Services\Contracts;

use App\DTOs\PaymentInitiateData;
use App\DTOs\PaymentResult;
use App\DTOs\PaymentVerifyResult;
use Illuminate\Http\Request;

interface PaymentServiceInterface
{
    /**
     * Initiate a payment using the configured provider.
     */
    public function initiate(PaymentInitiateData $data): PaymentResult;

    /**
     * Verify a payment by its reference.
     */
    public function verify(string $reference): PaymentVerifyResult;

    /**
     * Return the DB-only status of a payment without calling the external provider API.
     *
     * @return array{status: string, reference: string, provider?: string, amount?: float, currency?: string}
     */
    public function getStatus(string $reference): array;

    /**
     * Process an inbound webhook for the given provider.
     */
    public function handleWebhook(string $provider, Request $request): bool;

    /**
     * Resolve the authoritative payable amount for a transactable from the database.
     *
     * @param  string|null  $purpose  Optional payment purpose (e.g. 'damage') to limit what is charged.
     */
    public function resolvePayableAmount(string $transactableType, string $transactableId, ?string $purpose = null): float;

    /**
     * Resolve the currency code and exchange rate for a transactable's branch.
     *
     * @return array{code: string, rate: float|null}
     */
    public function resolveTransactableCurrencyInfo(string $type, string $id): array;

    /**
     * Resolve the currency code for a transactable's branch.
     */
    public function resolveTransactableCurrency(string $type, string $id): string;
}
