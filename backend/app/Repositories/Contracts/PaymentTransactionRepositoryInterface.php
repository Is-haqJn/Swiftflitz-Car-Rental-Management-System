<?php

namespace App\Repositories\Contracts;

use App\Models\PaymentTransaction;
use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Carbon\CarbonInterface;

interface PaymentTransactionRepositoryInterface extends QueryableRepositoryInterface
{
    public function findTransaction(string $id): PaymentTransaction;

    /**
     * @return array{total_paid: float, total_pending: float, total_refunded: float, count: int}
     */
    public function summaryStats(): array;

    /**
     * Sum of paid transaction amounts within a date range, optionally scoped to branches.
     *
     * @param  array<int|string>  $branchIds  Empty array means no branch filter (global).
     */
    public function revenueInPeriod(CarbonInterface $from, CarbonInterface $to, array $branchIds = []): float;

    /**
     * Daily trend series grouped by paid_at date.
     *
     * @param  array<int|string>  $branchIds
     * @return array<int, array{date: string, label: string, collected: float, refunded: float, count: int}>
     */
    public function trendSeries(CarbonInterface $from, CarbonInterface $to, array $branchIds = []): array;

    /**
     * Paid-transaction totals grouped by channel.
     *
     * @param  array<int|string>  $branchIds
     * @return array<int, array{channel: string, total: float, count: int}>
     */
    public function channelBreakdown(CarbonInterface $from, CarbonInterface $to, array $branchIds = []): array;
}
