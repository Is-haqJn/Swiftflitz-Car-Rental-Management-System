<?php

namespace App\Services;

use App\Enums\PaymentTransactionStatus;
use App\Enums\RentalPaymentStatus;
use App\Enums\RentalStatus;
use App\Enums\TransactionType;
use App\Enums\VehicleStatus;
use App\Models\AirportBooking;
use App\Models\ChauffeurBooking;
use App\Models\Customer;
use App\Models\PaymentTransaction;
use App\Models\Rental;
use App\Models\RentalInspection;
use App\Models\Vehicle;
use App\Models\VehicleExpense;
use App\Repositories\Contracts\CustomerRepositoryInterface;
use App\Repositories\Contracts\VehicleRepositoryInterface;
use App\Services\Contracts\ReportServiceInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ReportService implements ReportServiceInterface
{
    public function __construct(
        protected VehicleRepositoryInterface $vehicleRepository,
        protected CustomerRepositoryInterface $customerRepository,
    ) {}

    public function revenueReport(array $filters): array
    {
        $startDate = Carbon::parse($filters['start_date'] ?? now()->startOfMonth());
        $endDate = Carbon::parse($filters['end_date'] ?? now()->endOfMonth());
        $branchId = $filters['branch_id'] ?? null;
        $branchIds = $filters['branch_ids'] ?? null;

        /* Branch-scoping helper closure for reuse across queries */
        $applyBranchScope = function ($q) use ($branchId, $branchIds): void {
            if ($branchIds !== null) {
                $q->whereHasMorph(
                    'transactable',
                    [Rental::class, AirportBooking::class, ChauffeurBooking::class],
                    fn ($morphQ) => $morphQ->whereIn('branch_id', $branchIds)
                );
            } elseif ($branchId) {
                $q->whereHasMorph(
                    'transactable',
                    [Rental::class, AirportBooking::class, ChauffeurBooking::class],
                    fn ($morphQ) => $morphQ->where('branch_id', $branchId)
                );
            }
        };

        /* Collected revenue: paid non-refund transactions within the period. */
        $txQuery = PaymentTransaction::query()
            ->where('status', PaymentTransactionStatus::Paid->value)
            ->whereNotIn('type', [
                TransactionType::Refund->value,
                TransactionType::DepositRefund->value,
                TransactionType::CancellationRefund->value,
            ])
            ->whereBetween('paid_at', [$startDate->startOfDay(), $endDate->copy()->endOfDay()]);

        $applyBranchScope($txQuery);

        $transactions = $txQuery->get(['paid_at', 'amount', 'exchange_rate']);

        /*
         * Always use PHP-level FX conversion so multi-currency branches are
         * aggregated correctly for both global and branch-scoped queries.
         * toGlobal() handles exchange_rate=1.0 (GHS) and null (legacy) safely.
         */
        $collectedRevenue = round($transactions->sum(fn ($t) => $this->toGlobal($t)), 2);

        /* Refunded amount: paid refund-type transactions in the period. */
        $refundQuery = PaymentTransaction::query()
            ->where('status', PaymentTransactionStatus::Paid->value)
            ->whereIn('type', [
                TransactionType::Refund->value,
                TransactionType::DepositRefund->value,
                TransactionType::CancellationRefund->value,
            ])
            ->whereBetween('paid_at', [$startDate->startOfDay(), $endDate->copy()->endOfDay()]);

        $applyBranchScope($refundQuery);

        $refundTransactions = $refundQuery->get(['paid_at', 'amount', 'exchange_rate']);
        $refundedAmount = round($refundTransactions->sum(fn ($t) => $this->toGlobal($t)), 2);

        /* Net revenue = collected - refunded */
        $netRevenue = round($collectedRevenue - $refundedAmount, 2);

        /* Outstanding balance: non-cancelled rentals in period where amount_paid < total_cost */
        $pendingQuery = Rental::query()
            ->whereBetween('pickup_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->where('status', '!=', RentalStatus::Cancelled->value)
            ->where(DB::raw('amount_paid'), '<', DB::raw('total_cost'));

        if ($branchIds !== null) {
            $pendingQuery->whereIn('branch_id', $branchIds);
        } elseif ($branchId) {
            $pendingQuery->where('branch_id', $branchId);
        }

        /*
         * Always use PHP-level FX conversion for outstanding balance so
         * multi-currency branch-scoped queries aggregate correctly.
         */
        $pendingRentals = $pendingQuery->get(['total_cost', 'amount_paid', 'exchange_rate']);
        $outstandingBalance = round($pendingRentals->sum(function ($r) {
            $rate = (float) ($r->exchange_rate ?? 0);
            $diff = max(0.0, (float) $r->total_cost - (float) $r->amount_paid);

            return $rate > 0 ? $diff * $rate : $diff;
        }), 2);

        /* Gross billed: total_cost of all non-cancelled rentals with pickup in period */
        $rentalBaseQuery = Rental::query()
            ->whereBetween('pickup_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->where('status', '!=', RentalStatus::Cancelled->value);

        if ($branchIds !== null) {
            $rentalBaseQuery->whereIn('branch_id', $branchIds);
        } elseif ($branchId) {
            $rentalBaseQuery->where('branch_id', $branchId);
        }

        /*
         * Always use PHP-level FX conversion for gross revenue so
         * multi-currency branch-scoped queries aggregate correctly.
         */
        $allRentals = (clone $rentalBaseQuery)->get(['total_cost', 'exchange_rate', 'total_cost_global']);
        $grossRevenue = round($allRentals->sum(fn ($r) => $this->toGlobalRental($r)), 2);
        $totalRentals = $allRentals->count();

        /* Collection rate = collected / gross billed (as a percentage) */
        $collectionRate = $grossRevenue > 0
            ? round(($collectedRevenue / $grossRevenue) * 100, 2)
            : 0.0;

        /* Chart: collected amounts grouped by chart_period (daily/weekly/monthly/yearly) */
        $chartPeriod = $filters['chart_period'] ?? 'daily';

        $chart = $transactions
            ->groupBy(function ($t) use ($chartPeriod) {
                $date = Carbon::parse($t->paid_at);

                return match ($chartPeriod) {
                    'weekly' => $date->startOfWeek()->toDateString(),
                    'monthly' => $date->format('Y-m'),
                    'yearly' => $date->format('Y'),
                    default => $date->toDateString(),
                };
            })
            ->map(function ($group, $key) use ($chartPeriod) {
                $periodLabel = match ($chartPeriod) {
                    'weekly' => 'W' . Carbon::parse($key)->weekOfYear . ' ' . Carbon::parse($key)->format('M'),
                    'monthly' => Carbon::createFromFormat('Y-m', $key)->format('M Y'),
                    'yearly' => $key,
                    default => $key,
                };

                $revenue = round($group->sum(fn ($t) => $this->toGlobal($t)), 2);

                return [
                    'date' => $key,
                    'period_label' => $periodLabel,
                    'revenue' => $revenue,
                    'transaction_count' => $group->count(),
                ];
            })
            ->sortKeys()
            ->values()
            ->all();

        return [
            'period' => ['start' => $startDate->toDateString(), 'end' => $endDate->toDateString()],
            'period_note' => 'Gross billed and outstanding use rental pickup date. Collected and refunded use transaction payment date.',
            'summary' => [
                'gross_revenue' => $grossRevenue,
                'collected_revenue' => $collectedRevenue,
                'refunded_amount' => $refundedAmount,
                'net_revenue' => $netRevenue,
                'outstanding_balance' => $outstandingBalance,
                'collection_rate' => $collectionRate,
                'total_rentals' => $totalRentals,
                'average_per_rental' => $totalRentals > 0
                    ? round($collectedRevenue / $totalRentals, 2)
                    : 0.0,
            ],
            'chart' => $chart,
        ];
    }

    public function vehicleReport(array $filters): array
    {
        $startDate = Carbon::parse($filters['start_date'] ?? now()->startOfMonth());
        $endDate = Carbon::parse($filters['end_date'] ?? now()->endOfMonth());
        $branchId = $filters['branch_id'] ?? null;
        $branchIds = $filters['branch_ids'] ?? null;
        $daysInPeriod = max(1, $startDate->diffInDays($endDate) + 1);

        $statusBreakdown = $this->vehicleRepository->getStatusCounts();

        $rentalFilter = function ($q) use ($startDate, $endDate, $branchId, $branchIds) {
            $q->whereBetween('pickup_date', [$startDate->toDateString(), $endDate->toDateString()])
                ->where('status', '!=', RentalStatus::Cancelled->value);
            if ($branchIds !== null) {
                $q->whereIn('branch_id', $branchIds);
            } elseif ($branchId) {
                $q->where('branch_id', $branchId);
            }
        };

        $vehicleQuery = Vehicle::query()->with('category:id,name');

        if ($branchIds !== null) {
            $vehicleQuery->whereIn('branch_id', $branchIds);
        } elseif ($branchId) {
            $vehicleQuery->where('branch_id', $branchId);
        }

        $vehicles = $vehicleQuery
            ->withCount([
                'rentals as total_rentals' => $rentalFilter,
                'rentals as completed_rentals' => function ($q) use ($startDate, $endDate, $branchId, $branchIds) {
                    $q->whereBetween('pickup_date', [$startDate->toDateString(), $endDate->toDateString()])
                        ->where('status', RentalStatus::Completed->value);
                    if ($branchIds !== null) {
                        $q->whereIn('branch_id', $branchIds);
                    } elseif ($branchId) {
                        $q->where('branch_id', $branchId);
                    }
                },
            ])
            ->withSum(
                ['rentals as total_rental_days' => $rentalFilter],
                'rental_days'
            )
            ->withSum(
                ['rentals as total_revenue' => $rentalFilter],
                'amount_paid'
            )
            ->get();

        $rows = $vehicles->map(fn ($v) => [
            'id' => $v->id,
            'name' => $v->name,
            'license_plate' => $v->license_plate,
            'category' => $v->category?->name,
            'status' => $v->status->value,
            'total_rentals' => (int) ($v->total_rentals ?? 0),
            'completed_rentals' => (int) ($v->completed_rentals ?? 0),
            'total_revenue' => round((float) ($v->total_revenue ?? 0), 2),
            'utilization_rate' => round(
                ((float) ($v->total_rental_days ?? 0) / $daysInPeriod) * 100,
                2
            ),
        ])->values()->all();

        $avgUtilization = count($rows) > 0
            ? round(array_sum(array_column($rows, 'utilization_rate')) / count($rows), 2)
            : 0;

        return [
            'period' => ['start' => $startDate->toDateString(), 'end' => $endDate->toDateString()],
            'summary' => [
                'total_vehicles' => $this->vehicleRepository->getTotalCount(),
                'available_count' => $statusBreakdown[VehicleStatus::Available->value] ?? 0,
                'rented_count' => $statusBreakdown[VehicleStatus::Rented->value] ?? 0,
                'maintenance_count' => $statusBreakdown[VehicleStatus::Maintenance->value] ?? 0,
                'average_utilization' => $avgUtilization,
            ],
            'vehicles' => $rows,
        ];
    }

    public function managerPerformanceReport(array $filters): array
    {
        $startDate = Carbon::parse($filters['start_date'] ?? now()->startOfMonth());
        $endDate = Carbon::parse($filters['end_date'] ?? now()->endOfMonth());
        $branchId = $filters['branch_id'] ?? null;
        $branchIds = $filters['branch_ids'] ?? null;

        $isGlobalScope = ($branchId === null && $branchIds === null);

        $rentals = Rental::query()
            ->with('manager:id,name,email')
            ->whereNotNull('manager_id')
            ->whereBetween('pickup_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->when($branchIds !== null, fn ($q) => $q->whereIn('branch_id', $branchIds))
            ->when($branchId && $branchIds === null, fn ($q) => $q->where('branch_id', $branchId))
            ->get();

        $managers = $rentals
            ->groupBy('manager_id')
            ->map(function ($group) use ($isGlobalScope) {
                $manager = $group->first()->manager;
                $total = $group->count();
                $completed = $group->filter(fn ($r) => $r->status === RentalStatus::Completed)->count();
                $cancelled = $group->filter(fn ($r) => $r->status === RentalStatus::Cancelled)->count();
                $totalRevenue = $isGlobalScope
                    ? round($group->sum(fn ($r) => $this->toGlobalRental($r)), 2)
                    : round((float) $group->sum('total_cost'), 2);

                return [
                    'manager' => [
                        'id' => $manager?->id,
                        'name' => $manager?->name,
                        'email' => $manager?->email,
                    ],
                    'total_rentals' => $total,
                    'completed_rentals' => $completed,
                    'cancelled_rentals' => $cancelled,
                    'total_revenue' => $totalRevenue,
                    'average_rental_days' => $total > 0
                        ? round($group->avg(fn ($r) => $r->rental_days ?? 0), 1)
                        : 0,
                    'completion_rate' => $total > 0
                        ? round(($completed / $total) * 100, 2)
                        : 0,
                ];
            })
            ->values()
            ->all();

        return [
            'period' => ['start' => $startDate->toDateString(), 'end' => $endDate->toDateString()],
            'managers' => $managers,
        ];
    }

    public function outstandingPaymentsReport(array $filters): array
    {
        $branchId = $filters['branch_id'] ?? null;
        $branchIds = $filters['branch_ids'] ?? null;
        $isGlobalScope = ($branchId === null && $branchIds === null);

        $rentals = Rental::query()
            ->with([
                'customer:id,name,email',
                'vehicle:id,name,license_plate',
            ])
            ->whereIn('payment_status', [
                RentalPaymentStatus::Pending->value,
                RentalPaymentStatus::PartiallyPaid->value,
            ])
            ->where('status', '!=', RentalStatus::Cancelled->value)
            ->when($branchIds !== null, fn ($q) => $q->whereIn('branch_id', $branchIds))
            ->when($branchId && $branchIds === null, fn ($q) => $q->where('branch_id', $branchId))
            ->get();

        $totalOutstanding = round(
            $rentals->sum(function ($r) use ($isGlobalScope) {
                $rate = (float) ($r->exchange_rate ?? 0);
                $base = max(0.0, (float) $r->total_cost - (float) $r->amount_paid)
                    + (float) ($r->damage_balance_due ?? 0);

                return ($isGlobalScope && $rate > 0) ? $base * $rate : $base;
            }),
            2
        );

        $rows = $rentals->map(function ($r) {
            $amountDue = round(
                max(0.0, (float) $r->total_cost - (float) $r->amount_paid)
                    + (float) ($r->damage_balance_due ?? 0),
                2
            );

            return [
                'id' => $r->id,
                'reference' => $r->reference,
                'customer' => $r->customer
                    ? ['id' => $r->customer->id, 'name' => $r->customer->name, 'email' => $r->customer->email]
                    : null,
                'vehicle' => $r->vehicle
                    ? ['id' => $r->vehicle->id, 'name' => $r->vehicle->name, 'license_plate' => $r->vehicle->license_plate]
                    : null,
                'total_cost' => round((float) $r->total_cost, 2),
                'amount_paid' => round((float) $r->amount_paid, 2),
                'amount_due' => $amountDue,
                'payment_status' => $r->payment_status->value,
                'status' => $r->status->value,
                'start_date' => $r->pickup_date?->toDateString(),
                'return_date' => $r->return_date?->toDateString(),
                'currency_symbol' => $r->currency_symbol ?? null,
            ];
        })->values()->all();

        return [
            'summary' => [
                'total_outstanding' => $totalOutstanding,
                'total_rentals' => $rentals->count(),
                'pending_count' => $rentals->filter(fn ($r) => $r->payment_status === RentalPaymentStatus::Pending)->count(),
                'partial_count' => $rentals->filter(fn ($r) => $r->payment_status === RentalPaymentStatus::PartiallyPaid)->count(),
            ],
            'rentals' => $rows,
        ];
    }

    public function maintenanceReport(array $filters): array
    {
        $maintenanceVehicles = $this->vehicleRepository->getInMaintenance();

        $inspections = RentalInspection::query()
            ->with([
                'rental:id,reference,vehicle_id,estimated_repair_cost,actual_repair_cost,damage_settlement_status,actual_return_date,return_date',
                'rental.vehicle:id,name,license_plate',
            ])
            ->where('type', 'return')
            ->where('damage_noted', true)
            ->get();

        $damageReports = $inspections->map(fn ($i) => [
            'id' => $i->id,
            'rental_reference' => $i->rental?->reference,
            'vehicle_name' => $i->rental?->vehicle?->name,
            'license_plate' => $i->rental?->vehicle?->license_plate,
            'damage_types' => $i->damage_types ?? [],
            'damage_severity' => $i->damage_severity,
            'estimated_cost' => $i->rental
                ? round((float) $i->rental->estimated_repair_cost, 2)
                : null,
            'actual_cost' => $i->rental
                ? round((float) $i->rental->actual_repair_cost, 2)
                : null,
            'settlement_status' => $i->rental?->damage_settlement_status,
            'return_date' => $i->rental
                ? ($i->rental->actual_return_date
                    ? $i->rental->actual_return_date->toDateString()
                    : $i->rental->return_date?->toDateString())
                : null,
        ])->values()->all();

        return [
            'summary' => [
                'maintenance_count' => $maintenanceVehicles->count(),
                'damage_reports_count' => count($damageReports),
                'total_estimated_damage' => round(
                    $inspections->sum(fn ($i) => (float) ($i->rental?->estimated_repair_cost ?? 0)),
                    2
                ),
                'total_actual_damage' => round(
                    $inspections->sum(fn ($i) => (float) ($i->rental?->actual_repair_cost ?? 0)),
                    2
                ),
            ],
            'maintenance_vehicles' => $maintenanceVehicles->map(fn ($v) => [
                'id' => $v->id,
                'name' => $v->name,
                'license_plate' => $v->license_plate,
                'category' => $v->category?->name,
                'status' => $v->status?->value ?? VehicleStatus::Maintenance->value,
            ])->values()->all(),
            'damage_reports' => $damageReports,
        ];
    }

    public function vehicleExpenseReport(array $filters): array
    {
        $startDate = isset($filters['start_date']) ? Carbon::parse($filters['start_date'])->startOfDay() : now()->startOfMonth();
        $endDate = isset($filters['end_date']) ? Carbon::parse($filters['end_date'])->endOfDay() : now()->endOfDay();
        $perPage = (int) ($filters['per_page'] ?? 15);
        $branchId = $filters['branch_id'] ?? null;
        $branchIds = $filters['branch_ids'] ?? null;

        $branchExpenseFilter = function ($q) use ($branchId, $branchIds) {
            if ($branchIds !== null) {
                $q->whereHas('vehicle', fn ($vq) => $vq->whereIn('branch_id', $branchIds));
            } elseif ($branchId) {
                $q->whereHas('vehicle', fn ($vq) => $vq->where('branch_id', $branchId));
            }
        };

        $isGlobalScope = ($branchId === null && $branchIds === null);

        $allExpenses = VehicleExpense::query()
            ->with(['vehicle:id,name,license_plate'])
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->tap($branchExpenseFilter)
            ->get();

        $toGlobalExpense = function (object $e) use ($isGlobalScope): float {
            if (! $isGlobalScope) {
                return (float) $e->amount;
            }
            $rate = (float) ($e->exchange_rate ?? 0);

            return $rate > 0 ? (float) $e->amount * $rate : (float) $e->amount;
        };

        $byType = $allExpenses->groupBy('expense_type')
            ->map(fn ($g) => round($g->sum($toGlobalExpense), 2))
            ->toArray();

        $byVehicle = $allExpenses->groupBy('vehicle_id')
            ->map(fn ($g) => [
                'vehicle' => $g->first()->vehicle?->name,
                'license_plate' => $g->first()->vehicle?->license_plate,
                'total' => round($g->sum($toGlobalExpense), 2),
                'count' => $g->count(),
            ])
            ->values()
            ->toArray();

        $paginated = VehicleExpense::query()
            ->with(['vehicle:id,name,license_plate', 'recordedBy:id,name'])
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->tap($branchExpenseFilter)
            ->orderByDesc('expense_date')
            ->paginate($perPage);

        $expenseRows = collect($paginated->items())->map(fn ($e) => [
            'id' => $e->id,
            'vehicle' => $e->vehicle?->name,
            'license_plate' => $e->vehicle?->license_plate,
            'expense_type' => $e->expense_type,
            'description' => $e->description,
            'amount' => round((float) $e->amount, 2),
            'currency_symbol' => $e->currency_symbol ?? null,
            'expense_date' => $e->expense_date->toDateString(),
            'reference' => $e->reference,
            'recorded_by' => $e->recordedBy?->name,
        ])->all();

        return [
            'period' => ['start' => $startDate->toDateString(), 'end' => $endDate->toDateString()],
            'summary' => [
                'total_expenses' => round($allExpenses->sum($toGlobalExpense), 2),
                'total_records' => $allExpenses->count(),
                'by_type' => $byType,
            ],
            'by_vehicle' => $byVehicle,
            'expenses' => $expenseRows,
            'expenses_pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ];
    }

    public function customerAnalysisReport(array $filters): array
    {
        $startDate = Carbon::parse($filters['start_date'] ?? now()->startOfMonth());
        $endDate = Carbon::parse($filters['end_date'] ?? now()->endOfMonth());
        $branchId = $filters['branch_id'] ?? null;
        $branchIds = $filters['branch_ids'] ?? null;

        $cacheKey = "report.customers.{$startDate->toDateString()}.{$endDate->toDateString()}"
            . ($branchId ? ".{$branchId}" : '')
            . ($branchIds !== null ? '.' . md5(implode(',', $branchIds)) : '');

        return Cache::remember($cacheKey, 300, function () use ($startDate, $endDate, $filters, $branchId, $branchIds) {
            $totalCustomers = $this->customerRepository->getTotalCount();
            $newCustomers = $this->customerRepository->getNewCount($startDate, $endDate);
            $blacklisted = $this->customerRepository->getBlacklistedCount();
            $expiringLicenses = $this->customerRepository->countExpiringLicenses(30);
            $expiredLicenses = $this->customerRepository->countExpiredLicenses();

            $limit = (int) ($filters['limit'] ?? 10) ?: 10;

            $rentalScope = fn ($q) => $q
                ->whereBetween('pickup_date', [$startDate->toDateString(), $endDate->toDateString()])
                ->where('status', '!=', RentalStatus::Cancelled->value)
                ->when($branchIds !== null, fn ($q2) => $q2->whereIn('branch_id', $branchIds))
                ->when($branchId && $branchIds === null, fn ($q2) => $q2->where('branch_id', $branchId));

            $isGlobalScope = ($branchId === null && $branchIds === null);

            $topCustomers = Customer::query()
                ->whereHas('rentals', $rentalScope)
                ->withCount(['rentals as rentals_count' => $rentalScope])
                ->with(['rentals' => function ($q) use ($rentalScope) {
                    $rentalScope($q)->select(['customer_id', 'total_cost', 'exchange_rate', 'total_cost_global']);
                }])
                ->limit($limit)
                ->get()
                ->map(function ($c) use ($isGlobalScope) {
                    $totalSpend = $isGlobalScope
                        ? round($c->rentals->sum(fn ($r) => $this->toGlobalRental($r)), 2)
                        : round((float) $c->rentals->sum('total_cost'), 2);

                    return [
                        'id' => $c->id,
                        'name' => $c->name,
                        'email' => $c->email,
                        'phone' => $c->phone,
                        'rentals_count' => (int) ($c->rentals_count ?? 0),
                        'total_spend' => $totalSpend,
                        'is_blacklisted' => (bool) $c->is_blacklisted,
                    ];
                })
                ->sortByDesc('total_spend');

            return [
                'period' => ['start' => $startDate->toDateString(), 'end' => $endDate->toDateString()],
                'summary' => [
                    'total_customers' => $totalCustomers,
                    'new_customers' => $newCustomers,
                    'blacklisted_count' => $blacklisted,
                    'expiring_licenses' => $expiringLicenses,
                    'expired_licenses' => $expiredLicenses,
                ],
                'top_customers' => $topCustomers->values()->all(),
            ];
        });
    }

    /*
     * Convert a payment transaction amount to the global currency (GHS).
     * When exchange_rate > 0, multiply; otherwise treat as already global.
     */
    private function toGlobal(object $transaction): float
    {
        $rate = (float) ($transaction->exchange_rate ?? 0);

        return $rate > 0 ? (float) $transaction->amount * $rate : (float) $transaction->amount;
    }

    /*
     * Convert a rental's total_cost to the global currency (GHS).
     * Uses total_cost_global when available; falls back to total_cost * exchange_rate.
     */
    private function toGlobalRental(object $rental): float
    {
        if (isset($rental->total_cost_global) && $rental->total_cost_global !== null) {
            return (float) $rental->total_cost_global;
        }

        $rate = (float) ($rental->exchange_rate ?? 0);

        return $rate > 0 ? (float) $rental->total_cost * $rate : (float) $rental->total_cost;
    }
}
