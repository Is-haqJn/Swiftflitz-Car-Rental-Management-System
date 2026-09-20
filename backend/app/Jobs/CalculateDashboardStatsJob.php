<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\Contracts\DashboardServiceInterface;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;

/**
 * Pre-warms dashboard stats cache for all admin/manager users.
 * Clears stale hourly cache keys and recalculates so the next page
 * load is instant rather than computing on-demand.
 */
class CalculateDashboardStatsJob implements ShouldQueue
{
    use Queueable;

    public function __construct()
    {
        $this->onQueue('default');
    }

    public function handle(DashboardServiceInterface $dashboardService): void
    {
        /* Pre-warm revenue trend for all periods */
        foreach (['monthly', 'weekly', 'daily'] as $period) {
            /* Clear the hourly cache key so the next call recomputes fresh */
            Cache::forget("dashboard.revenue_trend.{$period}." . now()->format('Y-m-d-H'));
            /* Recompute and store */
            $dashboardService->getRevenueTrend($period);
        }

        /* Pre-warm vehicle utilization */
        Cache::forget('dashboard.vehicle_utilization.' . now()->format('Y-m-d-H'));
        $dashboardService->getVehicleUtilization();

        /* Pre-warm per-user dashboard stats for all admin + manager users */
        User::query()
            ->whereHas('roles', fn ($q) => $q->whereIn('name', ['super_admin', 'admin', 'manager']))
            ->each(function (User $user) use ($dashboardService): void {
                $cacheKey = "dashboard.stats.{$user->id}." . now()->format('Y-m-d-H');
                Cache::forget($cacheKey);
                $dashboardService->getStats($user);
            });
    }
}
