<?php

namespace App\Repositories;

use App\Enums\PaymentTransactionStatus;
use App\Enums\TransactionType;
use App\Models\AirportBooking;
use App\Models\ChauffeurBooking;
use App\Models\PaymentTransaction;
use App\Models\Rental;
use App\Repositories\Base\QueryableRepository;
use App\Repositories\Contracts\PaymentTransactionRepositoryInterface;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class PaymentTransactionRepository extends QueryableRepository implements PaymentTransactionRepositoryInterface
{
    public function query(): QueryBuilder
    {
        $base = parent::query()->defaultSort('-created_at');

        $user = auth()->user();
        if ($user && ! $user->hasAnyRole(['super_admin', 'admin'])) {
            $branchIds = $user->branches()->pluck('id')->toArray();

            if (! empty($branchIds)) {
                $base->where(function ($q) use ($branchIds) {
                    $q->whereHasMorph(
                        'transactable',
                        [Rental::class, AirportBooking::class, ChauffeurBooking::class],
                        fn ($morphQ) => $morphQ->whereIn('branch_id', $branchIds)
                    );
                });
            } else {
                /*
                 * User has no assigned branch - restrict to nothing so they
                 * don't see all transactions. Admin-level access requires a
                 * branch assignment or a super_admin/admin role.
                 */
                $base->whereRaw('1 = 0');
            }
        }

        return $this->withTransactableCustomer($base);
    }

    public function findTransaction(string $id): PaymentTransaction
    {
        return PaymentTransaction::with([
            'branch',
            'processedBy',
            'transactable',
            'couponUsage.coupon',
            'discountRuleUsage.discountRule',
        ])->findOrFail($id);
    }

    public function summaryStats(): array
    {
        /*
         * Build a branch-scoped Eloquent query for aggregation.
         * Mirrors the same scoping logic as query() so non-admin users only see
         * totals for transactions belonging to their assigned branches.
         */
        /** @var \App\Models\User|null $user */
        $user = auth()->user();
        $base = PaymentTransaction::query();

        $isGlobalScope = true;

        if ($user && ! $user->hasAnyRole(['super_admin', 'admin'])) {
            $branchIds = $user->branches()->pluck('id')->toArray();

            if (! empty($branchIds)) {
                $base->where(function ($q) use ($branchIds) {
                    $q->whereHasMorph(
                        'transactable',
                        [Rental::class, AirportBooking::class, ChauffeurBooking::class],
                        fn ($morphQ) => $morphQ->whereIn('branch_id', $branchIds)
                    );
                });
                $isGlobalScope = false;
            } else {
                $base->whereRaw('1 = 0');
                $isGlobalScope = false;
            }
        }

        /*
         * Apply the same transactable filters the list endpoint uses so the
         * stats total matches the visible rows (e.g. when scoped to a rental).
         */
        $transactableType = request()->input('filter.transactable_type');
        $transactableId = request()->input('filter.transactable_id');

        if ($transactableType) {
            $base->where('transactable_type', $transactableType);
            $isGlobalScope = false;
        }

        if ($transactableId) {
            $base->where('transactable_id', $transactableId);
            $isGlobalScope = false;
        }

        /* All refund-type transactions (mirrors revenue report logic). */
        $refundTypes = [
            TransactionType::Refund->value,
            TransactionType::DepositRefund->value,
            TransactionType::CancellationRefund->value,
        ];

        /*
         * When the scope is global (super_admin / admin with no branch filter),
         * transactions may span multiple branches with different currencies.
         * Fetch raw rows and convert to the global unit in PHP to avoid summing
         * apples with oranges. Branch-scoped totals are homogeneous - DB sum is fine.
         */
        if ($isGlobalScope) {
            $paidRows = (clone $base)
                ->where('status', PaymentTransactionStatus::Paid->value)
                ->select(['amount', 'exchange_rate', 'type'])
                ->get();

            $pendingRows = (clone $base)
                ->where('status', PaymentTransactionStatus::Pending->value)
                ->select(['amount', 'exchange_rate'])
                ->get();

            $totalPaid = $paidRows->sum(fn ($tx) => $this->toGlobal($tx));
            $totalPending = $pendingRows->sum(fn ($tx) => $this->toGlobal($tx));
            $totalRefunded = $paidRows
                ->filter(fn ($tx) => in_array($tx->type, $refundTypes, true))
                ->sum(fn ($tx) => $this->toGlobal($tx));
            $totalCollected = $paidRows
                ->reject(fn ($tx) => in_array($tx->type, $refundTypes, true))
                ->sum(fn ($tx) => $this->toGlobal($tx));
        } else {
            $totalPaid = (clone $base)
                ->where('status', PaymentTransactionStatus::Paid->value)
                ->sum('amount');

            $totalPending = (clone $base)
                ->where('status', PaymentTransactionStatus::Pending->value)
                ->sum('amount');

            $totalRefunded = (clone $base)
                ->whereIn('type', $refundTypes)
                ->where('status', PaymentTransactionStatus::Paid->value)
                ->sum('amount');

            /*
             * Collected revenue: paid non-refund transactions (matches revenue report
             * definition so the two pages tally when filtered to the same period).
             */
            $totalCollected = (clone $base)
                ->where('status', PaymentTransactionStatus::Paid->value)
                ->whereNotIn('type', $refundTypes)
                ->sum('amount');
        }

        $count = (clone $base)->count();

        return [
            'total_paid' => round((float) $totalPaid, 2),
            'total_pending' => round((float) $totalPending, 2),
            'total_refunded' => round((float) $totalRefunded, 2),
            'total_collected' => round((float) $totalCollected, 2),
            'net_revenue' => round((float) ($totalCollected - $totalRefunded), 2),
            'count' => $count,
        ];
    }

    public function revenueInPeriod(CarbonInterface $from, CarbonInterface $to, array $branchIds = []): float
    {
        $query = PaymentTransaction::query()
            ->where('status', PaymentTransactionStatus::Paid->value)
            ->whereBetween('paid_at', [$from, $to]);

        if (! empty($branchIds)) {
            $query->where(function ($q) use ($branchIds) {
                $q->whereHasMorph(
                    'transactable',
                    [Rental::class, AirportBooking::class, ChauffeurBooking::class],
                    fn ($morphQ) => $morphQ->whereIn('branch_id', $branchIds)
                );
            });
        }

        /*
         * Always convert using PHP-level FX so multi-currency branches are
         * aggregated correctly regardless of scope. toGlobal() handles
         * exchange_rate=1.0 (GHS branches) and null (legacy) safely.
         */
        return (float) $query->select(['amount', 'exchange_rate'])->get()
            ->sum(fn ($tx) => $this->toGlobal($tx));
    }

    public function trendSeries(CarbonInterface $from, CarbonInterface $to, array $branchIds = []): array
    {
        $refundTypes = [
            TransactionType::Refund->value,
            TransactionType::DepositRefund->value,
            TransactionType::CancellationRefund->value,
        ];

        $isGlobal = empty($branchIds);

        $selectCols = $isGlobal
            ? ['paid_at', 'amount', 'exchange_rate', 'type']
            : ['paid_at', 'amount', 'type'];

        $query = PaymentTransaction::query()
            ->where('status', PaymentTransactionStatus::Paid->value)
            ->whereBetween('paid_at', [$from, $to])
            ->select($selectCols);

        if (! empty($branchIds)) {
            $query->where(function ($q) use ($branchIds) {
                $q->whereHasMorph(
                    'transactable',
                    [Rental::class, AirportBooking::class, ChauffeurBooking::class],
                    fn ($morphQ) => $morphQ->whereIn('branch_id', $branchIds)
                );
            });
        }

        $rows = $query->get();

        $grouped = $rows->groupBy(fn ($row) => $row->paid_at ? $row->paid_at->toDateString() : '');

        $series = [];
        $cursor = $from->copy();
        while ($cursor->lte($to)) {
            $key = $cursor->toDateString();
            $day = $grouped->get($key, collect());

            $nonRefunds = $day->reject(fn ($r) => in_array($r->type, $refundTypes, true));
            $refunds = $day->filter(fn ($r) => in_array($r->type, $refundTypes, true));

            if ($isGlobal) {
                $collected = (float) $nonRefunds->sum(fn ($r) => $this->toGlobal($r));
                $refunded = (float) $refunds->sum(fn ($r) => $this->toGlobal($r));
            } else {
                $collected = (float) $nonRefunds->sum('amount');
                $refunded = (float) $refunds->sum('amount');
            }

            $series[] = [
                'date' => $key,
                'label' => $cursor->format('j M'),
                'collected' => round($collected, 2),
                'refunded' => round($refunded, 2),
                'count' => $day->count(),
            ];

            $cursor->addDay();
        }

        return $series;
    }

    public function channelBreakdown(CarbonInterface $from, CarbonInterface $to, array $branchIds = []): array
    {
        $refundTypes = [
            TransactionType::Refund->value,
            TransactionType::DepositRefund->value,
            TransactionType::CancellationRefund->value,
        ];

        $isGlobal = empty($branchIds);

        $selectCols = $isGlobal
            ? ['channel', 'amount', 'exchange_rate']
            : ['channel', 'amount'];

        $query = PaymentTransaction::query()
            ->where('status', PaymentTransactionStatus::Paid->value)
            ->whereNotIn('type', $refundTypes)
            ->whereBetween('paid_at', [$from, $to])
            ->select($selectCols);

        if (! empty($branchIds)) {
            $query->where(function ($q) use ($branchIds) {
                $q->whereHasMorph(
                    'transactable',
                    [Rental::class, AirportBooking::class, ChauffeurBooking::class],
                    fn ($morphQ) => $morphQ->whereIn('branch_id', $branchIds)
                );
            });
        }

        $rows = $query->get();

        return $rows
            ->groupBy(fn ($row) => $row->channel ?? 'manual')
            ->map(function ($group, $channel) use ($isGlobal) {
                $total = $isGlobal
                    ? $group->sum(fn ($r) => $this->toGlobal($r))
                    : $group->sum('amount');

                return [
                    'channel' => (string) $channel,
                    'total' => round((float) $total, 2),
                    'count' => $group->count(),
                ];
            })
            ->values()
            ->all();
    }

    public function getAllowedFilters(): array
    {
        return [
            AllowedFilter::exact('status'),
            AllowedFilter::exact('type'),
            AllowedFilter::exact('provider'),
            AllowedFilter::exact('channel'),
            AllowedFilter::exact('transactable_type'),
            AllowedFilter::exact('transactable_id'),
            AllowedFilter::callback(
                'date_from',
                fn ($query, $value) => $query->where('created_at', '>=', $value)
            ),
            AllowedFilter::callback(
                'date_to',
                fn ($query, $value) => $query->where('created_at', '<=', $value)
            ),
            AllowedFilter::callback('search', function ($query, $value) {
                $query->where(function ($q) use ($value) {
                    $q->where('reference', 'like', "%{$value}%")
                        ->orWhere('payer_name', 'like', "%{$value}%")
                        ->orWhere('payer_email', 'like', "%{$value}%");
                });
            }),
        ];
    }

    public function getAllowedSorts(): array
    {
        return ['created_at', 'amount', 'status', 'type'];
    }

    public function getDefaultIncludes(): array
    {
        return ['processedBy', 'branch'];
    }

    public function getAllowedIncludes(): array
    {
        return [
            'processedBy',
            'couponUsage.coupon',
            'discountRuleUsage.discountRule',
        ];
    }

    /**
     * Eager-load transactable with per-type customer relations using morphWith,
     * so each model only loads the relation it actually has.
     */
    protected function withTransactableCustomer(QueryBuilder $query): QueryBuilder
    {
        return $query->with([
            'transactable' => function (MorphTo $morphTo) {
                $morphTo->morphWith([
                    Rental::class => ['customer'],
                    AirportBooking::class => ['airportCustomer'],
                    ChauffeurBooking::class => ['chauffeurCustomer'],
                ]);
            },
        ]);
    }

    protected function model(): string
    {
        return PaymentTransaction::class;
    }

    /**
     * Convert a transaction's amount to the global currency unit.
     *
     * When exchange_rate is set and > 0 (including 1.0 for global-currency branches),
     * multiply amount by rate. When exchange_rate is null (legacy records with no rate
     * stored), assume the amount is already in global currency and return as-is.
     */
    private function toGlobal(object $transaction): float
    {
        $rate = (float) ($transaction->exchange_rate ?? 0);

        return $rate > 0 ? (float) $transaction->amount * $rate : (float) $transaction->amount;
    }
}
