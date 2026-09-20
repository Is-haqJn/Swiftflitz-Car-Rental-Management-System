<?php

namespace App\Jobs;

use App\Enums\PaymentTransactionStatus;
use App\Models\PaymentTransaction;
use App\Services\Contracts\PaymentServiceInterface;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class CheckPendingHubtelPaymentsJob implements ShouldQueue
{
    use Queueable;

    public function __construct()
    {
        $this->onQueue('high');
    }

    /*
     * Per Hubtel documentation: merchants MUST perform a status check if the
     * final transaction status has not been received within 5 minutes of initiation.
     * This job runs every 5 minutes and re-verifies any Hubtel transactions that
     * have been pending for more than 5 minutes but less than 24 hours (stale
     * window - anything older is unlikely to resolve and would spam the API).
     */

    public function handle(PaymentServiceInterface $paymentService): void
    {
        $stale = PaymentTransaction::query()
            ->where('provider', 'hubtel')
            ->where('status', PaymentTransactionStatus::Pending)
            ->where('created_at', '<=', now()->subMinutes(5))
            ->where('created_at', '>=', now()->subHours(24))
            ->get();

        if ($stale->isEmpty()) {
            return;
        }

        Log::info("CheckPendingHubtelPaymentsJob: checking {$stale->count()} stale pending transaction(s).");

        foreach ($stale as $transaction) {
            try {
                $result = $paymentService->verify($transaction->reference);

                Log::info("CheckPendingHubtelPaymentsJob: [{$transaction->reference}] status={$result->status}");
            } catch (Throwable $e) {
                Log::error("CheckPendingHubtelPaymentsJob: error verifying [{$transaction->reference}]", [
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
}
