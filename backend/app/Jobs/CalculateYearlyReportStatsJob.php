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
 * Pre-calculates and caches yearly revenue stats for the last 5 years.
 * Runs annually (Jan 1) and on-demand.
 */
class CalculateYearlyReportStatsJob implements ShouldQueue
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

        $years = collect(range(4, 0))->map(fn (int $i) => now()->subYears($i)->startOfYear());

        $yearlyStats = $years->map(function (CarbonInterface $yearStart) use ($refundTypes) {
            $yearEnd = $yearStart->copy()->endOfYear();

            $txResult = PaymentTransaction::query()
                ->where('status', PaymentTransactionStatus::Paid->value)
                ->whereNotIn('type', $refundTypes)
                ->whereBetween('paid_at', [$yearStart, $yearEnd])
                ->selectRaw('SUM(amount) as revenue, COUNT(*) as transaction_count')
                ->first();

            $refundResult = PaymentTransaction::query()
                ->where('status', PaymentTransactionStatus::Paid->value)
                ->whereIn('type', $refundTypes)
                ->whereBetween('paid_at', [$yearStart, $yearEnd])
                ->selectRaw('SUM(amount) as refunded')
                ->first();

            $rentalCount = Rental::query()
                ->whereBetween('pickup_date', [$yearStart->toDateString(), $yearEnd->toDateString()])
                ->where('status', '!=', RentalStatus::Cancelled->value)
                ->count();

            $grossRevenue = Rental::query()
                ->whereBetween('pickup_date', [$yearStart->toDateString(), $yearEnd->toDateString()])
                ->where('status', '!=', RentalStatus::Cancelled->value)
                ->sum('total_cost');

            $collected = (float) ($txResult->revenue ?? 0);
            $refunded = (float) ($refundResult->refunded ?? 0);
            $gross = (float) $grossRevenue;

            /* Month-by-month breakdown within the year */
            $monthBreakdown = collect(range(1, 12))->map(function (int $month) use ($yearStart, $refundTypes) {
                $mStart = $yearStart->copy()->month($month)->startOfMonth();
                $mEnd = $mStart->copy()->endOfMonth();

                if ($mStart->isFuture()) {
                    return null;
                }

                $mTx = PaymentTransaction::query()
                    ->where('status', PaymentTransactionStatus::Paid->value)
                    ->whereNotIn('type', $refundTypes)
                    ->whereBetween('paid_at', [$mStart, $mEnd])
                    ->sum('amount');

                return [
                    'month' => $month,
                    'label' => $mStart->format('M'),
                    'revenue' => round((float) $mTx, 2),
                ];
            })->filter()->values()->all();

            return [
                'year' => $yearStart->year,
                'collected_revenue' => round($collected, 2),
                'refunded_amount' => round($refunded, 2),
                'net_revenue' => round($collected - $refunded, 2),
                'gross_revenue' => round($gross, 2),
                'collection_rate' => $gross > 0 ? round(($collected / $gross) * 100, 2) : 0.0,
                'transaction_count' => (int) ($txResult->transaction_count ?? 0),
                'rental_count' => $rentalCount,
                'month_breakdown' => $monthBreakdown,
            ];
        })->values()->all();

        Cache::put('report_stats.yearly', $yearlyStats, now()->addHours(25));
    }
}
