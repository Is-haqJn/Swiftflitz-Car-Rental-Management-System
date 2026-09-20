<?php

namespace App\Jobs;

use App\Enums\PaymentTransactionStatus;
use App\Enums\RentalStatus;
use App\Enums\TransactionType;
use App\Models\PaymentTransaction;
use App\Models\Rental;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;

/**
 * Pre-calculates and caches daily revenue stats for the last 90 days.
 * Runs nightly so dashboards and report charts load instantly from cache.
 */
class CalculateDailyReportStatsJob implements ShouldQueue
{
    use Queueable;

    public function __construct()
    {
        $this->onQueue('default');
    }

    public function handle(): void
    {
        $refundTypes = [
            TransactionType::Refund->value,
            TransactionType::DepositRefund->value,
            TransactionType::CancellationRefund->value,
        ];

        $days = collect(range(89, 0))->map(fn (int $i) => now()->subDays($i)->startOfDay());

        $dailyStats = $days->map(function (CarbonInterface $dayStart) use ($refundTypes) {
            $dayEnd = $dayStart->copy()->endOfDay();
            $dateStr = $dayStart->toDateString();

            $txResult = PaymentTransaction::query()
                ->where('status', PaymentTransactionStatus::Paid->value)
                ->whereNotIn('type', $refundTypes)
                ->whereBetween('paid_at', [$dayStart, $dayEnd])
                ->selectRaw('SUM(amount) as revenue, COUNT(*) as transaction_count')
                ->first();

            $refundResult = PaymentTransaction::query()
                ->where('status', PaymentTransactionStatus::Paid->value)
                ->whereIn('type', $refundTypes)
                ->whereBetween('paid_at', [$dayStart, $dayEnd])
                ->selectRaw('SUM(amount) as refunded')
                ->first();

            $rentalCount = Rental::query()
                ->whereDate('pickup_date', $dateStr)
                ->where('status', '!=', RentalStatus::Cancelled->value)
                ->count();

            $collected = (float) ($txResult->revenue ?? 0);
            $refunded = (float) ($refundResult->refunded ?? 0);

            return [
                'date' => $dateStr,
                'collected_revenue' => round($collected, 2),
                'refunded_amount' => round($refunded, 2),
                'net_revenue' => round($collected - $refunded, 2),
                'transaction_count' => (int) ($txResult->transaction_count ?? 0),
                'rental_count' => $rentalCount,
            ];
        })->values()->all();

        Cache::put('report_stats.daily', $dailyStats, now()->addHours(25));
    }
}
