<?php

namespace App\Services;

use App\DTOs\PaymentInitiateData;
use App\DTOs\PaymentResult;
use App\DTOs\PaymentVerifyResult;
use App\Enums\PaymentTransactionStatus;
use App\Enums\RentalStatus;
use App\Enums\TransactionType;
use App\Events\PaymentStatusUpdated;
use App\Jobs\SendUnderReviewNotificationJob;
use App\Models\AirportBooking;
use App\Models\ChauffeurBooking;
use App\Models\PaymentTransaction;
use App\Models\Rental;
use App\Services\Contracts\PaymentServiceInterface;
use App\Services\Payment\PaymentManager;
use App\Settings\GeneralSettings;
use App\Settings\OverdueSettings;
use App\Settings\PaymentSettings;
use App\Support\CurrencyHelper;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;
use Throwable;

class PaymentService implements PaymentServiceInterface
{
    public function __construct(
        private readonly PaymentManager $manager,
        private readonly PaymentSettings $settings,
        private readonly OverdueSettings $overdueSettings,
        private readonly GeneralSettings $generalSettings,
    ) {}

    public function initiate(PaymentInitiateData $data): PaymentResult
    {
        /*
         * Always resolve the amount from the database - never trust the client-supplied value.
         * This prevents users from manipulating the URL/request to pay a lower amount.
         * The purpose (e.g. 'damage') is read from metadata so the correct sub-amount is returned.
         */
        $purpose = $data->metadata['purpose'] ?? null;
        $resolvedAmount = $this->resolvePayableAmount($data->transactableType, $data->transactableId, $purpose);

        /*
         * Resolve the effective currency from the transactable's branch settings.
         * For Hubtel (GHS only), convert non-GHS amounts to GHS before initiating.
         */
        $currencyInfo = $this->resolveTransactableCurrencyInfo($data->transactableType, $data->transactableId);
        $effectiveCurrency = $currencyInfo['code'];

        /*
         * Track the branch-currency amount, code, and symbol separately.
         * These are always stored in the PaymentTransaction ledger so that
         * amount_paid on rentals/bookings stays in the entity's own currency,
         * and the symbol is preserved historically even if the branch changes later.
         */
        $branchAmount = $resolvedAmount;
        $branchCurrency = $effectiveCurrency;
        $branchCurrencySymbol = $currencyInfo['symbol'] ?? $this->generalSettings->currency_symbol;
        /*
         * Always store an explicit exchange_rate on the transaction. When the branch
         * uses the global currency (is_custom=false), resolveTransactableCurrencyInfo
         * returns rate=null, so we default to 1.0 (no conversion). This ensures that
         * the repository's toGlobal() helper can always rely on a non-null rate for
         * new transactions and treats 1.0 as a pass-through (amount unchanged).
         */
        $branchExchangeRate = $currencyInfo['rate'] ?? 1.0;

        /*
         * Some providers only process GHS (e.g. Hubtel, Paystack GHS-only merchant accounts).
         * The adapter declares this via requiresGhsConversion(). Convert non-GHS branch amounts
         * to GHS using the branch exchange rate before passing to the adapter.
         * The converted amount is used only for the provider call - the ledger always stores
         * the branch-currency amount so that MarkTransactableAsPaid updates amount_paid correctly.
         */
        $gatewayAmount = null;
        $gatewayCurrency = null;

        if ($this->manager->adapter()->requiresGhsConversion() && $effectiveCurrency !== 'GHS') {
            $exchangeRate = $currencyInfo['rate'];
            if ($exchangeRate !== null) {
                if ($exchangeRate <= 0 || $exchangeRate > 100_000) {
                    Log::error('Payment initiation blocked: exchange rate out of bounds', [
                        'rate' => $exchangeRate,
                        'transactable_type' => $data->transactableType,
                        'transactable_id' => $data->transactableId,
                    ]);
                    throw new InvalidArgumentException(
                        "Exchange rate {$exchangeRate} is out of valid bounds (must be > 0 and <= 100000)."
                    );
                }
                $resolvedAmount = round($resolvedAmount * $exchangeRate, 2);
            }
            $gatewayAmount = $resolvedAmount;
            $gatewayCurrency = 'GHS';
            $effectiveCurrency = 'GHS';
        }

        $secureData = new PaymentInitiateData(
            amount: $resolvedAmount,
            currency: $effectiveCurrency,
            payerEmail: $data->payerEmail,
            payerPhone: $data->payerPhone,
            payerName: $data->payerName,
            transactableType: $data->transactableType,
            transactableId: $data->transactableId,
            callbackUrl: $data->callbackUrl,
            returnUrl: $data->returnUrl,
            metadata: $data->metadata,
        );

        $result = $this->manager->adapter()->initiate($secureData);

        if ($result->success) {
            /*
             * For damage payments, reuse the existing pending RepairCost transaction instead of
             * creating a duplicate. This prevents a spurious "Payment - Pending" record appearing
             * in the transaction history alongside the RepairCost estimate. When payment completes,
             * MarkTransactableAsPaid will tag it as DamageCharge and settle the damage fields.
             */
            if ($purpose === 'damage') {
                $reused = PaymentTransaction::where('transactable_type', $secureData->transactableType)
                    ->where('transactable_id', $secureData->transactableId)
                    ->where('type', TransactionType::RepairCost->value)
                    ->where('status', PaymentTransactionStatus::Pending->value)
                    ->first();

                if ($reused) {
                    $reused->update([
                        'reference' => $result->reference,
                        'provider' => $this->settings->payment_provider,
                        'provider_reference' => $result->providerReference,
                        'payer_email' => $secureData->payerEmail,
                        'payer_phone' => $secureData->payerPhone,
                        'payer_name' => $secureData->payerName,
                        'metadata' => $secureData->metadata ?: null,
                    ]);

                    return $result;
                }
            }

            /*
             * For non-damage payments, reuse any existing pending transaction for this
             * transactable so that a customer who abandons and retries does not
             * accumulate duplicate pending records in their transaction history.
             */
            $existingPending = PaymentTransaction::where('transactable_type', $secureData->transactableType)
                ->where('transactable_id', $secureData->transactableId)
                ->where('status', PaymentTransactionStatus::Pending->value)
                ->whereNull('metadata->purpose')
                ->latest()
                ->first();

            if ($existingPending) {
                $existingPending->update([
                    'reference' => $result->reference,
                    'provider' => $this->settings->payment_provider,
                    'provider_reference' => $result->providerReference,
                    'amount' => $branchAmount,
                    'currency_symbol' => $branchCurrencySymbol,
                    'exchange_rate' => $branchExchangeRate,
                    'payer_email' => $secureData->payerEmail,
                    'payer_phone' => $secureData->payerPhone,
                    'payer_name' => $secureData->payerName,
                    'metadata' => $secureData->metadata ?: null,
                ]);

                return $result;
            }

            $transactable = $this->findTransactable($secureData->transactableType, $secureData->transactableId);

            PaymentTransaction::create([
                'reference' => $result->reference,
                'provider' => $this->settings->payment_provider,
                'provider_reference' => $result->providerReference,
                'amount' => $branchAmount,
                'currency' => $branchCurrency,
                'currency_symbol' => $branchCurrencySymbol,
                'exchange_rate' => $branchExchangeRate,
                'gateway_amount' => $gatewayAmount,
                'gateway_currency' => $gatewayCurrency,
                'status' => PaymentTransactionStatus::Pending,
                'payer_email' => $secureData->payerEmail,
                'payer_phone' => $secureData->payerPhone,
                'payer_name' => $secureData->payerName,
                'transactable_type' => $secureData->transactableType,
                'transactable_id' => $secureData->transactableId,
                'branch_id' => $transactable?->branch_id ?? null,
                'metadata' => $secureData->metadata ?: null,
            ]);
        }

        return $result;
    }

    public function resolveTransactableCurrencyInfo(string $type, string $id): array
    {
        $fallbackCode = $this->settings->payment_currency;

        return match ($type) {
            'rental' => (function () use ($id, $fallbackCode): array {
                $rental = Rental::with('branch')->find($id);
                if (! $rental?->branch) {
                    return ['code' => $fallbackCode, 'symbol' => $this->generalSettings->currency_symbol, 'rate' => null];
                }
                $info = CurrencyHelper::resolveForBranch($rental->branch, $this->generalSettings);

                return ['code' => $info['code'], 'symbol' => $info['symbol'], 'rate' => $info['is_custom'] ? $info['rate'] : null];
            })(),
            'airport_booking' => (function () use ($id, $fallbackCode): array {
                $booking = AirportBooking::with('branch')->find($id);
                if (! $booking?->branch) {
                    return ['code' => $fallbackCode, 'symbol' => $this->generalSettings->currency_symbol, 'rate' => null];
                }
                $info = CurrencyHelper::resolveForBranch($booking->branch, $this->generalSettings);

                return ['code' => $info['code'], 'symbol' => $info['symbol'], 'rate' => $info['is_custom'] ? $info['rate'] : null];
            })(),
            'chauffeur_booking' => (function () use ($id, $fallbackCode): array {
                $booking = ChauffeurBooking::with('branch')->find($id);
                if (! $booking?->branch) {
                    return ['code' => $fallbackCode, 'symbol' => $this->generalSettings->currency_symbol, 'rate' => null];
                }
                $info = CurrencyHelper::resolveForBranch($booking->branch, $this->generalSettings);

                return ['code' => $info['code'], 'symbol' => $info['symbol'], 'rate' => $info['is_custom'] ? $info['rate'] : null];
            })(),
            default => ['code' => $fallbackCode, 'symbol' => $this->generalSettings->currency_symbol, 'rate' => null],
        };
    }

    public function resolveTransactableCurrency(string $type, string $id): string
    {
        return $this->resolveTransactableCurrencyInfo($type, $id)['code'];
    }

    public function verify(string $reference): PaymentVerifyResult
    {
        $transaction = PaymentTransaction::where('reference', $reference)->first();

        if (! $transaction) {
            return new PaymentVerifyResult(success: false, status: 'pending');
        }

        if ($transaction->status === PaymentTransactionStatus::Paid) {
            return new PaymentVerifyResult(success: true, status: 'paid', amount: (float) $transaction->amount);
        }

        if ($transaction->status === PaymentTransactionStatus::Failed) {
            return new PaymentVerifyResult(success: true, status: 'failed');
        }

        if ($transaction->status === PaymentTransactionStatus::UnderReview) {
            return new PaymentVerifyResult(success: true, status: 'under_review');
        }

        if ($transaction->status === PaymentTransactionStatus::Refunded) {
            return new PaymentVerifyResult(success: true, status: 'refunded');
        }

        $result = $this->manager->adapter($transaction->provider)->verify($reference);

        if ($result->success) {
            $newStatus = PaymentTransactionStatus::from($result->status);

            if ($transaction->status !== $newStatus) {
                $updates = ['status' => $newStatus];

                if ($newStatus === PaymentTransactionStatus::Paid) {
                    $updates['paid_at'] = now();

                    if ($result->channel && ! $transaction->channel) {
                        $updates['channel'] = $result->channel;
                    }

                    if ($result->paymentPhone && ! $transaction->payment_phone) {
                        $updates['payment_phone'] = $result->paymentPhone;
                    }

                    if ($result->cardBin && ! $transaction->card_bin) {
                        $updates['card_bin'] = $result->cardBin;
                        $updates['card_last4'] = $result->cardLast4;
                        $updates['card_type'] = $result->cardType;
                    }
                }

                $transaction->update($updates);

                if ($newStatus === PaymentTransactionStatus::Paid) {
                    event(new PaymentStatusUpdated($transaction->fresh()));
                }
            }
        }

        return $result;
    }

    public function getStatus(string $reference): array
    {
        $transaction = PaymentTransaction::where('reference', $reference)
            ->select(['reference', 'status', 'provider', 'amount', 'currency'])
            ->first();

        if (! $transaction) {
            return ['status' => 'pending', 'reference' => $reference];
        }

        return [
            'status' => $transaction->status->value,
            'reference' => $transaction->reference,
            'provider' => $transaction->provider,
            'amount' => (float) $transaction->amount,
            'currency' => $transaction->currency,
        ];
    }

    public function handleWebhook(string $provider, Request $request): bool
    {
        $adapter = $this->manager->adapter($provider);
        $isValid = $adapter->handleWebhook($request);

        if (! $isValid) {
            Log::warning('Payment webhook rejected: invalid signature or payload', [
                'provider' => $provider,
                'ip' => $request->ip(),
                'payload_hash' => hash('sha256', $request->getContent()),
            ]);

            return false;
        }

        $reference = $this->extractReferenceFromWebhook($provider, $request);

        if (! $reference) {
            return true;
        }

        $transaction = PaymentTransaction::where('reference', $reference)->first();

        if (! $transaction) {
            return true;
        }

        if ($transaction->status === PaymentTransactionStatus::Paid) {
            return true;
        }

        /*
         * For Hubtel and Paystack: build a result from the webhook payload first, then call verify
         * for authoritative confirmation (both providers recommend always verifying).
         *
         * Hubtel special case: when verify() is unreachable (IP whitelist / transient error),
         * fall back to the webhook payload but flag the transaction as under_review rather than
         * auto-marking it paid - a human must approve it via the resolve endpoint.
         */
        if ($provider === 'hubtel') {
            $webhookResult = $this->buildVerifyResultFromHubtelWebhook($request);

            try {
                $verifyResult = $adapter->verify($reference);
            } catch (Throwable) {
                $verifyResult = new PaymentVerifyResult(success: false, status: 'pending');
            }

            if ($verifyResult->success) {
                /*
                 * Hubtel's Transaction Status Check API omits CustomerPhoneNumber from its
                 * response body. Fill the gap from the webhook payload so payment_phone is
                 * always persisted regardless of which path resolved the transaction.
                 */
                $result = new PaymentVerifyResult(
                    success: true,
                    status: $verifyResult->status,
                    amount: $verifyResult->amount,
                    meta: $verifyResult->meta,
                    channel: $verifyResult->channel ?? $webhookResult->channel,
                    paymentPhone: $verifyResult->paymentPhone ?? $webhookResult->paymentPhone,
                    charges: $verifyResult->charges,
                );
            } else {
                /* verify() failed - flag as under_review and dispatch notification */
                $underReviewUpdates = ['status' => PaymentTransactionStatus::UnderReview];

                if ($webhookResult->channel && ! $transaction->channel) {
                    $underReviewUpdates['channel'] = $webhookResult->channel;
                }

                if ($webhookResult->paymentPhone && ! $transaction->payment_phone) {
                    $underReviewUpdates['payment_phone'] = $webhookResult->paymentPhone;
                }

                $transaction->update($underReviewUpdates);
                SendUnderReviewNotificationJob::dispatch($transaction->fresh());

                return true;
            }
        } elseif ($provider === 'paystack') {
            $webhookResult = $this->buildVerifyResultFromPaystackWebhook($request);

            try {
                $verifyResult = $adapter->verify($reference);
            } catch (Throwable) {
                $verifyResult = new PaymentVerifyResult(success: false, status: 'pending');
            }

            $result = $verifyResult->success ? $verifyResult : $webhookResult;
        } else {
            $result = $adapter->verify($reference);
        }

        if ($result->success) {
            $newStatus = PaymentTransactionStatus::from($result->status);

            /*
             * Amount mismatch check: the verify result returns the amount actually charged.
             * For Hubtel this is the GHS gateway amount; for Paystack it is already converted
             * from kobo to major currency units by buildVerifyResultFromPaystackWebhook().
             * Compare against gateway_amount (GHS amount sent) when available, falling back
             * to the ledger amount. A mismatch of more than 0.01 flags the transaction as
             * under_review for manual admin resolution.
             */
            if (
                $result->amount !== null
                && $newStatus === PaymentTransactionStatus::Paid
            ) {
                $expectedAmount = $transaction->gateway_amount ?? $transaction->amount;

                if ($expectedAmount !== null && abs((float) $result->amount - (float) $expectedAmount) > 0.01) {
                    $transaction->update(['status' => PaymentTransactionStatus::UnderReview]);
                    SendUnderReviewNotificationJob::dispatch($transaction->fresh());

                    return true;
                }
            }

            $updates = ['status' => $newStatus];

            if ($newStatus === PaymentTransactionStatus::Paid) {
                $updates['paid_at'] ??= now();

                if ($result->channel && ! $transaction->channel) {
                    $updates['channel'] = $result->channel;
                }

                if ($result->paymentPhone && ! $transaction->payment_phone) {
                    $updates['payment_phone'] = $result->paymentPhone;
                }

                if ($result->cardBin && ! $transaction->card_bin) {
                    $updates['card_bin'] = $result->cardBin;
                    $updates['card_last4'] = $result->cardLast4;
                    $updates['card_type'] = $result->cardType;
                }

                if ($result->charges !== null && $transaction->gateway_charges === null) {
                    $updates['gateway_charges'] = $result->charges;
                }

                if ($result->amount !== null && $transaction->customer_amount === null) {
                    $updates['customer_amount'] = $result->amount;
                }
            }

            $transaction->update($updates);

            Log::info('Payment webhook processed', [
                'provider' => $provider,
                'reference' => $reference,
                'status' => $newStatus->value,
            ]);

            if ($newStatus === PaymentTransactionStatus::Paid || $newStatus === PaymentTransactionStatus::Failed) {
                event(new PaymentStatusUpdated($transaction->fresh()));
            }
        }

        return true;
    }

    /**
     * Resolve the authoritative payable amount for a transactable from the database.
     *
     * For rentals the default resolves the full outstanding balance:
     * - Cancelled rental:  cancellation_amount_owed (what the customer owes after fee calculation)
     * - All other rentals: total_cost - amount_paid + overdue_fee + damage amount
     *
     * When $purpose = 'damage', only the damage/repair amount is returned so that
     * a damage-specific payment link charges exactly the damage cost.
     *
     * - rental (default, cancelled):  cancellation_amount_owed
     * - rental (default, other):      total_cost - amount_paid + overdue_fee + damage amount
     * - rental (damage):              damage_balance_due ?? estimated_repair_cost
     * - airport_booking:              total_amount
     * - chauffeur_booking:            total_amount
     *
     * @throws InvalidArgumentException when the transactable is not found.
     */
    public function resolvePayableAmount(string $transactableType, string $transactableId, ?string $purpose = null): float
    {
        $model = $this->findTransactable($transactableType, $transactableId);

        if ($transactableType === 'rental' && $purpose === 'deposit') {
            return max(0.0, round((float) ($model->security_deposit_amount ?? 0), 2));
        }

        if ($transactableType === 'rental' && $purpose === 'damage') {
            return max(
                0.0,
                round((float) ($model->damage_balance_due ?? $model->estimated_repair_cost ?? 0), 2)
            );
        }

        return match ($transactableType) {
            'rental' => $this->resolveRentalPayableAmount($model),
            'airport_booking' => (float) $model->total_amount,
            'chauffeur_booking' => (float) $model->total_amount,
            default => throw new InvalidArgumentException("Unsupported transactable type: {$transactableType}"),
        };
    }

    /**
     * Compute the outstanding payable amount for a rental.
     *
     * Cancelled rentals owe their cancellation_amount_owed.
     * All other rentals owe: total_cost + fees - amount_paid - deposit_applied.
     *
     * Fees included: stored overdue_fee (or live overdue when not yet finalised),
     * late_pickup_fee, and early_return_charge (net of any refund).
     * Damage is intentionally excluded - it has its own payment link (purpose=damage).
     */
    private function resolveRentalPayableAmount(Rental $rental): float
    {
        if ($rental->status === RentalStatus::Cancelled) {
            return max(0.0, round((float) ($rental->cancellation_amount_owed ?? 0), 2));
        }

        /* Compute live overdue charge for rentals still running (overdue_fee not yet stored). */
        $liveOverdueCharge = 0.0;
        if ($rental->overdue_fee === null) {
            $rental->loadMissing('vehicle.category');
            $liveOverdueCharge = $this->computeLiveOverdueCharge($rental);
        }

        return max(
            0.0,
            round(
                (float) $rental->total_cost
                    + (float) ($rental->overdue_fee ?? 0)
                    + $liveOverdueCharge
                    + (float) ($rental->late_pickup_fee ?? 0)
                    + (float) ($rental->early_return_charge ?? 0)
                    - (float) ($rental->early_return_refund ?? 0)
                    - (float) $rental->amount_paid
                    - (float) ($rental->deposit_applied_to_balance ?? 0),
                2
            )
        );
    }

    /**
     * Estimate the running overdue charge for a rental that is currently overdue
     * but has not yet been returned (overdue_fee is not yet finalised in DB).
     *
     * Mirrors the logic in RentalResource::computeOverdueBreakdown().
     */
    private function computeLiveOverdueCharge(Rental $rental): float
    {
        $isLiveOverdue = $rental->status === RentalStatus::Overdue
            && $rental->actual_return_date === null;

        if (! $isLiveOverdue) {
            return 0.0;
        }

        $scheduledReturn = $rental->scheduled_return_date;
        $overdueStart = $this->overdueSettings->overdue_start_type === 'grace_period'
            ? $scheduledReturn->copy()->addMinutes($this->overdueSettings->grace_period_minutes)
            : $scheduledReturn->copy();

        $minutes = max(0, (int) $overdueStart->diffInMinutes(now(), false));

        if ($minutes <= 0) {
            return 0.0;
        }

        $thresholdMins = $this->overdueSettings->overdue_threshold_hours * 60;
        $vehicle = $rental->vehicle;

        if ($minutes <= $thresholdMins) {
            $rate = (float) ($vehicle?->overdue_daily_rate
                ?? $vehicle?->category?->overdue_daily_rate
                ?? $this->overdueSettings->overdue_hourly_rate);
            $units = (int) ceil($minutes / 60);
        } else {
            $rate = (float) $rental->daily_rate;
            $units = (int) ceil($minutes / 1440);
        }

        return round($rate * $units, 2);
    }

    /**
     * Find the transactable model by type and ID.
     *
     * @throws InvalidArgumentException when not found.
     */
    private function findTransactable(string $type, string $id): Model
    {
        $model = match ($type) {
            'rental' => Rental::find($id),
            'airport_booking' => AirportBooking::find($id),
            'chauffeur_booking' => ChauffeurBooking::find($id),
            default => null,
        };

        if (! $model) {
            throw new InvalidArgumentException("Transactable [{$type}:{$id}] not found.");
        }

        return $model;
    }

    /**
     * Build a PaymentVerifyResult from a Hubtel callback payload.
     * Used as fallback when the Hubtel Transaction Status Check API is unreachable.
     */
    private function buildVerifyResultFromHubtelWebhook(Request $request): PaymentVerifyResult
    {
        $responseCode = $request->input('ResponseCode');
        $status = $request->input('Status') ?? $request->input('Data.Status');
        $isPaid = $responseCode === '0000' && $status === 'Success';

        $paymentType = strtolower((string) $request->input('Data.PaymentDetails.PaymentType', ''));
        $channel = match (true) {
            str_contains($paymentType, 'mobile') || $paymentType === 'momo' => 'momo',
            str_contains($paymentType, 'card') => 'card',
            default => $paymentType ?: null,
        };

        if ($channel === 'momo') {
            $paymentPhone = $request->input('Data.PaymentDetails.MobileMoneyNumber')
                ?? $request->input('Data.CustomerPhoneNumber');
        } else {
            $paymentPhone = $request->input('Data.CustomerPhoneNumber') ?: null;
        }

        return new PaymentVerifyResult(
            success: $isPaid,
            status: $isPaid ? 'paid' : 'pending',
            amount: $request->input('Data.Amount'),
            channel: $channel,
            paymentPhone: $paymentPhone,
        );
    }

    /**
     * Build a PaymentVerifyResult from a Paystack charge.success webhook payload.
     * Used as fallback when the Paystack verify API is unreachable.
     */
    private function buildVerifyResultFromPaystackWebhook(Request $request): PaymentVerifyResult
    {
        $dataStatus = $request->input('data.status');
        $isPaid = $dataStatus === 'success';
        $isFailed = in_array($dataStatus, ['failed', 'abandoned', 'reversed'], true);

        $rawChannel = $request->input('data.channel');
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
            $paymentPhone = $request->input('data.authorization.mobile_money_number');
        }

        if ($channel === 'card') {
            $cardBin = $request->input('data.authorization.bin') ?: null;
            $cardLast4 = $request->input('data.authorization.last4') ?: null;
            $cardType = $request->input('data.authorization.card_type') ?: null;
        }

        if (! $paymentPhone) {
            $paymentPhone = $request->input('data.customer.phone') ?: null;
        }

        $amount = $request->input('data.amount');
        $fees = $request->input('data.fees');

        return new PaymentVerifyResult(
            success: $isPaid || $isFailed,
            status: $isPaid ? 'paid' : ($isFailed ? 'failed' : 'pending'),
            amount: $amount ? $amount / 100 : null,
            channel: $channel,
            paymentPhone: $paymentPhone,
            cardBin: $cardBin,
            cardLast4: $cardLast4,
            cardType: $cardType,
            charges: $fees !== null ? round((float) $fees / 100, 2) : null,
        );
    }

    /**
     * Extract the payment reference from the provider-specific webhook payload.
     */
    private function extractReferenceFromWebhook(string $provider, Request $request): ?string
    {
        return match ($provider) {
            'paystack' => $request->input('data.reference'),
            'stripe' => $request->input('data.object.client_reference_id'),
            'hubtel' => $request->input('Data.ClientReference') ?? $request->input('clientReference'),
            default => null,
        };
    }
}
