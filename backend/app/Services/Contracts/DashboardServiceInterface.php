<?php

namespace App\Services\Contracts;

use App\Models\User;

interface DashboardServiceInterface
{
    /**
     * Get all KPI statistics for the dashboard.
     *
     * @return array{
     *   rentals: array{active: int, overdue: int, pending: int},
     *   revenue: array{this_month: float, pending_payments: float},
     *   vehicles: array{total: int, available: int, in_use: int, utilization_rate: float},
     *   customers: array{total: int, new_this_month: int},
     *   quotes: array{pending: int},
     *   airport_bookings: array{pending: int, this_month: int},
     *   chauffeur_bookings: array{pending: int, this_month: int},
     * }
     */
    /** @param  array<int|string>  $branchIds  Empty = global, non-empty = filter to specific branches */
    public function getStats(User $user, array $branchIds = []): array;

    /**
     * Get revenue trend data for charts.
     *
     * @return array<string, mixed>
     */
    /**
     * @param  array<int|string>  $branchIds  Empty = global, non-empty = branch-scoped live query
     */
    public function getRevenueTrend(string $period = 'monthly', array $branchIds = []): array;

    /**
     * Get vehicle utilization summary.
     *
     * @return array<string, mixed>
     */
    public function getVehicleUtilization(): array;

    /**
     * Get recent activity (recent rentals, bookings, quotes).
     *
     * @return array<string, mixed>
     */
    public function getRecentActivity(int $limit = 10): array;

    /**
     * Get upcoming returns (due today and overdue).
     *
     * @return array<string, mixed>
     */
    public function getUpcomingReturns(int $limit = 10): array;
}
