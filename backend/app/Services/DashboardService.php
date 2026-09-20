<?php

namespace App\Services;

use App\Enums\AirportBookingStatus;
use App\Enums\ChauffeurBookingStatus;
use App\Enums\PaymentTransactionStatus;
use App\Enums\QuoteRequestStatus;
use App\Enums\RentalStatus;
use App\Enums\VehicleStatus;
use App\Jobs\RecalculateRevenueSnapshotsJob;
use App\Models\Branch;
use App\Models\PaymentTransaction;
use App\Models\QuoteRequest;
use App\Models\Rental;
use App\Models\RevenueSnapshot;
use App\Models\User;
use App\Models\Vehicle;
use App\Repositories\Contracts\AirportBookingRepositoryInterface;
use App\Repositories\Contracts\ChauffeurBookingRepositoryInterface;
use App\Repositories\Contracts\CustomerRepositoryInterface;
use App\Repositories\Contracts\PaymentTransactionRepositoryInterface;
use App\Repositories\Contracts\RentalRepositoryInterface;
use App\Repositories\Contracts\VehicleRepositoryInterface;
use App\Services\Contracts\DashboardServiceInterface;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;

class DashboardService implements DashboardServiceInterface
{
    public function __construct(
        protected VehicleRepositoryInterface $vehicleRepository,
        protected CustomerRepositoryInterface $customerRepository,
        protected RentalRepositoryInterface $rentalRepository,
        protected AirportBookingRepositoryInterface $airportBookingRepository,
        protected ChauffeurBookingRepositoryInterface $chauffeurBookingRepository,
        protected PaymentTransactionRepositoryInterface $transactionRepository,
    ) {}

    public function getStats(User $user, array $branchIds = []): array
    {
        $branchSuffix = empty($branchIds) ? 'global' : implode('_', $branchIds);
        $cacheKey = "dashboard.stats.{$user->id}.{$branchSuffix}." . now()->format('Y-m-d-H');

        return Cache::remember($cacheKey, 300, function () use ($branchIds) {
            $totalVehicles = $this->vehicleRepository->getTotalCount();
            $availableVehicles = $this->vehicleRepository->countByStatus(VehicleStatus::Available->value);
            $inUseVehicles = $this->vehicleRepository->countByStatus(VehicleStatus::Rented->value);
            $totalCustomers = $this->customerRepository->getTotalCount();
            $newCustomersThisMonth = $this->customerRepository->getNewCount(
                now()->startOfMonth(),
                now()->endOfMonth()
            );

            $monthStart = now()->startOfMonth();
            $monthEnd = now()->endOfMonth();

            /*
             * Revenue = actual collected money (PaymentTransaction, status=paid).
             * Pending = money still owed on active/confirmed/overdue rentals.
             */
            $scopedBranchIds = $branchIds;

            $rentalRevenueThisMonth = $this->transactionRepository->revenueInPeriod(
                $monthStart,
                $monthEnd,
                $scopedBranchIds
            );

            $pendingPayments = $this->rentalRepository->pendingPaymentsTotal($scopedBranchIds);

            $currencySymbol = null;
            $currencyCode = null;

            if (count($branchIds) === 1) {
                $branch = Branch::find($branchIds[0], ['currency', 'currency_symbol']);
                $currencySymbol = $branch?->currency_symbol;
                $currencyCode = $branch?->currency;
            }

            return [
                'rentals' => [
                    'active' => $this->rentalRepository->countByStatuses(
                        [RentalStatus::Active->value],
                        $scopedBranchIds
                    ),
                    'overdue' => $this->rentalRepository->countByStatuses(
                        [RentalStatus::Overdue->value],
                        $scopedBranchIds
                    ),
                    'pending' => $this->rentalRepository->countByStatuses(
                        [RentalStatus::Pending->value],
                        $scopedBranchIds
                    ),
                    'confirmed' => $this->rentalRepository->countByStatuses(
                        [RentalStatus::Confirmed->value],
                        $scopedBranchIds
                    ),
                ],
                'revenue' => [
                    'this_month' => $rentalRevenueThisMonth,
                    'pending_payments' => $pendingPayments,
                    'currency_symbol' => $currencySymbol,
                    'currency_code' => $currencyCode,
                ],
                'vehicles' => [
                    'total' => $totalVehicles,
                    'available' => $availableVehicles,
                    'in_use' => $inUseVehicles,
                    'utilization_rate' => $totalVehicles > 0
                        ? round(($inUseVehicles / $totalVehicles) * 100, 1)
                        : 0,
                ],
                'customers' => [
                    'total' => $totalCustomers,
                    'new_this_month' => $newCustomersThisMonth,
                ],
                'quotes' => [
                    'pending' => QuoteRequest::query()
                        ->whereIn('status', [
                            QuoteRequestStatus::Pending->value,
                            QuoteRequestStatus::PendingReview->value,
                        ])
                        ->count(),
                ],
                'airport_bookings' => [
                    'pending' => $this->airportBookingRepository->countByStatuses(
                        [AirportBookingStatus::Pending->value],
                        $scopedBranchIds
                    ),
                    'this_month' => $this->airportBookingRepository->countInPeriod(
                        $monthStart,
                        $monthEnd,
                        AirportBookingStatus::Cancelled->value,
                        $scopedBranchIds
                    ),
                ],
                'chauffeur_bookings' => [
                    'pending' => $this->chauffeurBookingRepository->countByStatuses(
                        [ChauffeurBookingStatus::Pending->value],
                        $scopedBranchIds
                    ),
                    'this_month' => $this->chauffeurBookingRepository->countInPeriod(
                        $monthStart,
                        $monthEnd,
                        ChauffeurBookingStatus::Cancelled->value,
                        $scopedBranchIds
                    ),
                ],
            ];
        });
    }

    public function getRevenueTrend(string $period = 'monthly', array $branchIds = []): array
    {
        $branchSuffix = empty($branchIds) ? 'global' : 'branch_' . implode('_', $branchIds);
        $cacheKey = "dashboard.revenue_trend.{$period}.{$branchSuffix}." . now()->format('Y-m-d-H');

        return Cache::remember($cacheKey, 300, function () use ($period, $branchIds) {
            $result = match ($period) {
                'daily' => $this->getDailyRevenueTrend($branchIds),
                'weekly' => $this->getWeeklyRevenueTrend($branchIds),
                default => $this->getMonthlyRevenueTrend($branchIds),
            };

            /* Bootstrap snapshots on first cold load when the table is empty */
            if (empty($result) || ! RevenueSnapshot::query()->exists()) {
                RecalculateRevenueSnapshotsJob::dispatch();
            }

            return $result;
        });
    }

    public function getVehicleUtilization(): array
    {
        $cacheKey = 'dashboard.vehicle_utilization.' . now()->format('Y-m-d-H');

        return Cache::remember($cacheKey, 300, function () {
            return Vehicle::query()
                ->select(['id', 'name', 'license_plate', 'status'])
                ->with('category:id,name')
                ->withCount(['rentals as total_rentals' => function ($query) {
                    $query->whereNotIn('status', [RentalStatus::Cancelled->value]);
                }])
                ->orderByDesc('total_rentals')
                ->limit(10)
                ->get()
                ->map(fn (Vehicle $vehicle) => [
                    'id' => $vehicle->id,
                    'name' => $vehicle->name,
                    'license_plate' => $vehicle->license_plate,
                    'category' => $vehicle->category?->name,
                    'status' => $vehicle->status->value,
                    'total_rentals' => $vehicle->total_rentals,
                ])
                ->all();
        });
    }

    public function getRecentActivity(int $limit = 10): array
    {
        /** @var \App\Models\User|null $user */
        $user = auth()->user();
        $isGlobal = $user ? $user->hasAnyRole(['super_admin', 'admin']) : true;
        $branchIds = ($user && ! $isGlobal) ? $user->branches()->pluck('id')->toArray() : [];

        $recentRentals = $this->scopedRentalQuery($branchIds)
            ->with(['customer:id,name', 'vehicle:id,name'])
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn (Rental $rental) => [
                'id' => $rental->id,
                'reference' => $rental->reference,
                'customer' => $rental->customer?->name,
                'vehicle' => $rental->vehicle?->name,
                'status' => $rental->status->value,
                'total_cost' => (float) $rental->total_cost,
                'created_at' => $rental->created_at->toIso8601String(),
            ])
            ->all();

        $recentQuotes = QuoteRequest::query()
            ->with('vehicle:id,name')
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn (QuoteRequest $quote) => [
                'id' => $quote->id,
                'reference' => $quote->reference,
                'name' => $quote->name,
                'vehicle' => $quote->vehicle?->name,
                'status' => $quote->status->value,
                'created_at' => $quote->created_at->toIso8601String(),
            ])
            ->all();

        return [
            'recent_rentals' => $recentRentals,
            'recent_quotes' => $recentQuotes,
        ];
    }

    public function getUpcomingReturns(int $limit = 10): array
    {
        /** @var \App\Models\User|null $user */
        $user = auth()->user();
        $isGlobal = $user ? $user->hasAnyRole(['super_admin', 'admin']) : true;
        $branchIds = ($user && ! $isGlobal) ? $user->branches()->pluck('id')->toArray() : [];

        $today = now()->toDateString();

        $dueToday = $this->scopedRentalQuery($branchIds)
            ->with([
                'customer:id,name,phone',
                'vehicle:id,name,license_plate',
            ])
            ->whereDate('return_date', $today)
            ->whereIn('status', [
                RentalStatus::Active->value,
                RentalStatus::Confirmed->value,
            ])
            ->limit($limit)
            ->get()
            ->map(fn (Rental $rental) => $this->mapReturnItem($rental))
            ->all();

        $overdue = $this->scopedRentalQuery($branchIds)
            ->with([
                'customer:id,name,phone',
                'vehicle:id,name,license_plate',
            ])
            ->where('status', RentalStatus::Overdue->value)
            ->oldest('return_date')
            ->limit($limit)
            ->get()
            ->map(fn (Rental $rental) => $this->mapReturnItem($rental, withDaysOverdue: true))
            ->all();

        return [
            'due_today' => $dueToday,
            'overdue' => $overdue,
        ];
    }

    /**
     * Return a branch-scoped Rental Eloquent builder for use in activity/return queries.
     * Count-only queries go through the repository; builder-based queries use this helper.
     *
     * @param  array<int|string>  $branchIds
     */
    private function scopedRentalQuery(array $branchIds): Builder
    {
        $query = Rental::query();
        if (! empty($branchIds)) {
            $query->whereIn('branch_id', $branchIds);
        }

        return $query;
    }

    /**
     * Monthly revenue trend - reads from revenue_snapshots table when available,
     * falling back to live calculation if snapshots are empty.
     * Capped at 24 months to prevent excessive data for long-running apps.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getMonthlyRevenueTrend(array $branchIds = []): array
    {
        $earliest = now()->subMonths(23)->startOfMonth()->format('Y-m');

        $snapshotScope = empty($branchIds) ? ['global'] : $branchIds;
        $snapshots = RevenueSnapshot::query()
            ->where('period_type', 'monthly')
            ->whereIn('branch_id', $snapshotScope)
            ->where('period_key', '>=', $earliest)
            ->orderBy('period_key')
            ->get(['period_key', 'period_label', 'revenue', 'transaction_count']);

        if ($snapshots->isNotEmpty()) {
            return $snapshots->groupBy('period_key')
                ->map(fn ($group) => [
                    'period' => $group->first()->period_label,
                    'revenue' => (float) $group->sum('revenue'),
                    'count' => (int) $group->sum('transaction_count'),
                ])
                ->sortKeys()
                ->values()->all();
        }

        /* Live calculation fallback when snapshots are not yet populated */
        $baseQuery = $this->buildBranchScopedTransactionQuery($branchIds);

        $firstPaidAt = (clone $baseQuery)->orderBy('paid_at')->value('paid_at');

        if ($firstPaidAt === null) {
            return [];
        }

        $earliestCarbon = now()->subMonths(23)->startOfMonth();
        $firstStart = Carbon::parse($firstPaidAt)->startOfMonth();
        $start = $firstStart->greaterThan($earliestCarbon) ? $firstStart : $earliestCarbon;
        $end = now()->endOfMonth();

        $transactions = (clone $baseQuery)
            ->whereBetween('paid_at', [$start, $end])
            ->select(['paid_at', 'amount'])
            ->get();

        $grouped = $transactions->groupBy(
            fn (PaymentTransaction $tx) => Carbon::parse($tx->paid_at)->startOfMonth()->format('Y-m')
        );

        $months = collect();
        $cursor = $start->copy();
        while ($cursor->lte($end)) {
            $months->push($cursor->copy());
            $cursor = $cursor->addMonth();
        }

        return $months->map(function (CarbonInterface $monthStart) use ($grouped) {
            $key = $monthStart->format('Y-m');
            $monthTxs = $grouped->get($key, collect());

            return [
                'period' => $monthStart->format('M Y'),
                'revenue' => (float) $monthTxs->sum('amount'),
                'count' => $monthTxs->count(),
            ];
        })->values()->all();
    }

    /**
     * Daily revenue trend - reads from revenue_snapshots table when available,
     * falling back to live calculation if snapshots are empty.
     * Capped at 90 days.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getDailyRevenueTrend(array $branchIds = []): array
    {
        $earliest = now()->subDays(89)->startOfDay()->format('Y-m-d');

        $snapshotScope = empty($branchIds) ? ['global'] : $branchIds;
        $snapshots = RevenueSnapshot::query()
            ->where('period_type', 'daily')
            ->whereIn('branch_id', $snapshotScope)
            ->where('period_key', '>=', $earliest)
            ->orderBy('period_key')
            ->get(['period_key', 'period_label', 'revenue', 'transaction_count']);

        if ($snapshots->isNotEmpty()) {
            return $snapshots->groupBy('period_key')
                ->map(fn ($group) => [
                    'period' => $group->first()->period_label,
                    'revenue' => (float) $group->sum('revenue'),
                    'count' => (int) $group->sum('transaction_count'),
                ])
                ->sortKeys()
                ->values()->all();
        }

        /* Live calculation fallback when snapshots are not yet populated */
        $baseQuery = $this->buildBranchScopedTransactionQuery($branchIds);

        $firstPaidAt = (clone $baseQuery)->orderBy('paid_at')->value('paid_at');

        if ($firstPaidAt === null) {
            return [];
        }

        $earliestCarbon = now()->subDays(89)->startOfDay();
        $firstStart = Carbon::parse($firstPaidAt)->startOfDay();
        $start = $firstStart->greaterThan($earliestCarbon) ? $firstStart : $earliestCarbon;
        $end = now()->endOfDay();

        $transactions = (clone $baseQuery)
            ->whereBetween('paid_at', [$start, $end])
            ->select(['paid_at', 'amount'])
            ->get();

        $grouped = $transactions->groupBy(
            fn (PaymentTransaction $tx) => Carbon::parse($tx->paid_at)->format('Y-m-d')
        );

        $days = collect();
        $cursor = $start->copy();
        while ($cursor->lte($end)) {
            $days->push($cursor->copy());
            $cursor = $cursor->addDay();
        }

        return $days->map(function (CarbonInterface $dayStart) use ($grouped) {
            $key = $dayStart->format('Y-m-d');
            $dayTxs = $grouped->get($key, collect());

            return [
                'period' => $dayStart->format('M d'),
                'revenue' => (float) $dayTxs->sum('amount'),
                'count' => $dayTxs->count(),
            ];
        })->values()->all();
    }

    /**
     * Weekly revenue trend - reads from revenue_snapshots table when available,
     * falling back to live calculation if snapshots are empty.
     * Each week is labelled "MMM d" for its Monday.
     * Capped at 24 weeks.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getWeeklyRevenueTrend(array $branchIds = []): array
    {
        $earliest = now()->subWeeks(23)->startOfWeek()->format('Y-m-d');

        $snapshotScope = empty($branchIds) ? ['global'] : $branchIds;
        $snapshots = RevenueSnapshot::query()
            ->where('period_type', 'weekly')
            ->whereIn('branch_id', $snapshotScope)
            ->where('period_key', '>=', $earliest)
            ->orderBy('period_key')
            ->get(['period_key', 'period_label', 'revenue', 'transaction_count']);

        if ($snapshots->isNotEmpty()) {
            return $snapshots->groupBy('period_key')
                ->map(fn ($group) => [
                    'period' => $group->first()->period_label,
                    'revenue' => (float) $group->sum('revenue'),
                    'count' => (int) $group->sum('transaction_count'),
                ])
                ->sortKeys()
                ->values()->all();
        }

        /* Live calculation fallback when snapshots are not yet populated */
        $baseQuery = $this->buildBranchScopedTransactionQuery($branchIds);

        $firstPaidAt = (clone $baseQuery)->orderBy('paid_at')->value('paid_at');

        if ($firstPaidAt === null) {
            return [];
        }

        $earliestCarbon = now()->subWeeks(23)->startOfWeek();
        $firstStart = Carbon::parse($firstPaidAt)->startOfWeek();
        $start = $firstStart->greaterThan($earliestCarbon) ? $firstStart : $earliestCarbon;
        $end = now()->endOfWeek();

        $transactions = (clone $baseQuery)
            ->whereBetween('paid_at', [$start, $end])
            ->select(['paid_at', 'amount'])
            ->get();

        $grouped = $transactions->groupBy(
            fn (PaymentTransaction $tx) => Carbon::parse($tx->paid_at)->startOfWeek()->format('Y-m-d')
        );

        $weeks = collect();
        $cursor = $start->copy();
        while ($cursor->lte($end)) {
            $weeks->push($cursor->copy());
            $cursor = $cursor->addWeek();
        }

        return $weeks->map(function (CarbonInterface $weekStart) use ($grouped) {
            $key = $weekStart->format('Y-m-d');
            $weekTxs = $grouped->get($key, collect());

            return [
                'period' => $weekStart->format('M d'),
                'revenue' => (float) $weekTxs->sum('amount'),
                'count' => $weekTxs->count(),
            ];
        })->values()->all();
    }

    /**
     * Build a PaymentTransaction query filtered to paid transactions, optionally scoped to branches.
     * Uses the denormalized branch_id column for O(1) indexed lookup.
     *
     * @param  array<int|string>  $branchIds  Empty = global (no branch filter)
     */
    private function buildBranchScopedTransactionQuery(array $branchIds): Builder
    {
        $query = PaymentTransaction::query()
            ->where('status', PaymentTransactionStatus::Paid->value);

        if (! empty($branchIds)) {
            $query->whereIn('branch_id', $branchIds);
        }

        return $query;
    }

    /**
     * @return array<string, mixed>
     */
    private function mapReturnItem(Rental $rental, bool $withDaysOverdue = false): array
    {
        $item = [
            'id' => $rental->id,
            'reference' => $rental->reference,
            'customer' => [
                'name' => $rental->customer?->name,
                'phone' => $rental->customer?->phone,
            ],
            'vehicle' => [
                'name' => $rental->vehicle?->name,
                'license_plate' => $rental->vehicle?->license_plate,
            ],
            'return_date' => $rental->return_date->toDateString(),
        ];

        if ($withDaysOverdue) {
            $item['days_overdue'] = (int) now()->startOfDay()->diffInDays(
                $rental->return_date->startOfDay(),
                absolute: false
            ) * -1;
        }

        return $item;
    }
}
