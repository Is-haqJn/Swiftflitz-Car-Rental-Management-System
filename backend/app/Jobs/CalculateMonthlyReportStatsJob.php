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
 * Pre-calculates and caches monthly revenue stats for the last 24 months.
 * Runs on the first of each month and on-demand.
 */
class CalculateMonthlyReportStatsJob implements ShouldQueue
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

        $months = collect(range(23, 0))->map(fn (int $i) => now()->subMonths($i)->startOfMonth());

        $monthlyStats = $months->map(function (CarbonInterface $monthStart) use ($refundTypes) {
            $monthEnd = $monthStart->copy()->endOfMonth();

            $txResult = PaymentTransaction::query()
                ->where('status', PaymentTransactionStatus::Paid->value)
                ->whereNotIn('type', $refundTypes)
                ->whereBetween('paid_at', [$monthStart, $monthEnd])
                ->selectRaw('SUM(amount) as revenue, COUNT(*) as transaction_count')
                ->first();

            $refundResult = PaymentTransaction::query()
                ->where('status', PaymentTransactionStatus::Paid->value)
                ->whereIn('type', $refundTypes)
                ->whereBetween('paid_at', [$monthStart, $monthEnd])
                ->selectRaw('SUM(amount) as refunded')
                ->first();

            $rentalCount = Rental::query()
                ->whereBetween('pickup_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                ->where('status', '!=', RentalStatus::Cancelled->value)
                ->count();

            $grossRevenue = Rental::query()
                ->whereBetween('pickup_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                ->where('status', '!=', RentalStatus::Cancelled->value)
                ->sum('total_cost');

            $collected = (float) ($txResult->revenue ?? 0);
            $refunded = (float) ($refundResult->refunded ?? 0);
            $gross = (float) $grossRevenue;

            return [
                'period' => $monthStart->format('M Y'),
                'year' => $monthStart->year,
                'month' => $monthStart->month,
                'collected_revenue' => round($collected, 2),
                'refunded_amount' => round($refunded, 2),
                'net_revenue' => round($collected - $refunded, 2),
                'gross_revenue' => round($gross, 2),
                'collection_rate' => $gross > 0 ? round(($collected / $gross) * 100, 2) : 0.0,
                'transaction_count' => (int) ($txResult->transaction_count ?? 0),
                'rental_count' => $rentalCount,
            ];
        })->values()->all();

        Cache::put('report_stats.monthly', $monthlyStats, now()->addHours(25));

        /* Dashboard revenue trend also uses monthly data - refresh it */
        Cache::forget('dashboard.revenue_trend.monthly.' . now()->format('Y-m-d-H'));
    }
}
