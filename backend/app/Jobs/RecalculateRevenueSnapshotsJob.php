<?php

namespace App\Jobs;

use App\Enums\PaymentTransactionStatus;
use App\Enums\TransactionType;
use App\Models\Branch;
use App\Models\PaymentTransaction;
use App\Models\RevenueSnapshot;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Collection;

/**
 * Pre-calculates revenue snapshots for all period types (daily/weekly/monthly/yearly)
 * for both the global aggregate (branch_id='global') and each individual branch.
 *
 * Scheduled: every 30 minutes (see routes/console.php).
 */
class RecalculateRevenueSnapshotsJob implements ShouldQueue
{
    use Queueable;

    public function __construct()
    {
        $this->onQueue('default');
    }

    public function handle(): void
    {
        $transactions = PaymentTransaction::query()
            ->where('status', PaymentTransactionStatus::Paid->value)
            ->whereNotIn('type', [
                TransactionType::Refund->value,
                TransactionType::DepositRefund->value,
                TransactionType::CancellationRefund->value,
            ])
            ->whereNotNull('paid_at')
            ->select(['paid_at', 'amount', 'branch_id'])
            ->get();

        if ($transactions->isEmpty()) {
            return;
        }

        $now = now();
        $snapshots = [];

        /* Load exchange rates for all branches that appear in transactions */
        $branchIds = $transactions->pluck('branch_id')->filter()->unique()->values();
        $branchRates = Branch::whereIn('id', $branchIds)
            ->get(['id', 'exchange_rate'])
            ->keyBy('id');

        /* Per-branch snapshots - raw amounts in each branch's own currency */
        $byBranch = $transactions->filter(fn (PaymentTransaction $tx) => $tx->branch_id !== null)
            ->groupBy('branch_id');

        foreach ($byBranch as $branchId => $branchTxs) {
            $this->appendSnapshots($branchTxs, (string) $branchId, $snapshots, $now);
        }

        /* Global aggregate - convert per-branch amounts to global currency using exchange rates
           Branches with no custom currency (null rate) contribute raw (already in global currency) */
        $this->appendGlobalSnapshots($transactions, $branchRates, $snapshots, $now);

        foreach (array_chunk($snapshots, 100) as $chunk) {
            RevenueSnapshot::upsert(
                $chunk,
                ['period_type', 'period_key', 'branch_id'],
                ['period_label', 'revenue', 'transaction_count', 'calculated_at', 'updated_at']
            );
        }
    }

    /**
     * Build global ('global' sentinel) snapshots by converting per-branch amounts to global currency.
     * Branches with no exchange_rate (global currency) contribute raw amounts.
     *
     * @param  Collection<int, PaymentTransaction>  $transactions
     * @param  \Illuminate\Support\Collection<string, Branch>  $branchRates
     * @param  array<int, array<string, mixed>>  $snapshots
     */
    private function appendGlobalSnapshots(Collection $transactions, \Illuminate\Support\Collection $branchRates, array &$snapshots, mixed $now): void
    {
        foreach (['daily', 'weekly', 'monthly', 'yearly'] as $periodType) {
            $grouped = $transactions->groupBy(function (PaymentTransaction $tx) use ($periodType) {
                $date = Carbon::parse($tx->paid_at);

                return match ($periodType) {
                    'weekly' => $date->startOfWeek()->format('Y-m-d'),
                    'monthly' => $date->format('Y-m'),
                    'yearly' => $date->format('Y'),
                    default => $date->format('Y-m-d'),
                };
            });

            foreach ($grouped as $key => $group) {
                $label = match ($periodType) {
                    'weekly' => Carbon::parse($key)->format('M d'),
                    'monthly' => Carbon::createFromFormat('Y-m', $key)->format('M Y'),
                    'yearly' => $key,
                    default => Carbon::parse($key)->format('M d'),
                };

                $globalRevenue = $group->sum(function (PaymentTransaction $tx) use ($branchRates): float {
                    $amount = (float) $tx->amount;

                    if ($tx->branch_id === null) {
                        return $amount;
                    }

                    $rate = $branchRates->get($tx->branch_id)?->exchange_rate;

                    return $rate !== null ? round($amount * (float) $rate, 10) : $amount;
                });

                $snapshots[] = [
                    'period_type' => $periodType,
                    'branch_id' => 'global',
                    'period_key' => $key,
                    'period_label' => $label,
                    'revenue' => round($globalRevenue, 2),
                    'transaction_count' => $group->count(),
                    'calculated_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }
    }

    /**
     * @param  Collection<int, PaymentTransaction>  $transactions
     * @param  array<int, array<string, mixed>>  $snapshots
     */
    private function appendSnapshots(Collection $transactions, string $branchId, array &$snapshots, mixed $now): void
    {
        foreach (['daily', 'weekly', 'monthly', 'yearly'] as $periodType) {
            $grouped = $transactions->groupBy(function (PaymentTransaction $tx) use ($periodType) {
                $date = Carbon::parse($tx->paid_at);

                return match ($periodType) {
                    'weekly' => $date->startOfWeek()->format('Y-m-d'),
                    'monthly' => $date->format('Y-m'),
                    'yearly' => $date->format('Y'),
                    default => $date->format('Y-m-d'),
                };
            });

            foreach ($grouped as $key => $group) {
                $label = match ($periodType) {
                    'weekly' => Carbon::parse($key)->format('M d'),
                    'monthly' => Carbon::createFromFormat('Y-m', $key)->format('M Y'),
                    'yearly' => $key,
                    default => Carbon::parse($key)->format('M d'),
                };

                $snapshots[] = [
                    'period_type' => $periodType,
                    'branch_id' => $branchId,
                    'period_key' => $key,
                    'period_label' => $label,
                    'revenue' => round((float) $group->sum('amount'), 2),
                    'transaction_count' => $group->count(),
                    'calculated_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }
    }
}
