<?php

namespace App\Http\Controllers\V1;

use App\Http\Controllers\Controller;
use App\Services\Contracts\DashboardServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected DashboardServiceInterface $dashboardService,
    ) {}

    /**
     * GET /api/dashboard
     * Get all KPI statistics for the dashboard.
     */
    public function index(Request $request): JsonResponse
    {
        $branchIds = $this->resolveBranchIds($request);
        $stats = $this->dashboardService->getStats($request->user(), $branchIds);

        return $this->successResponse($stats);
    }

    /**
     * GET /api/dashboard/revenue-trend
     * Get revenue trend data for charts (daily or monthly).
     */
    public function revenueTrend(Request $request): JsonResponse
    {
        abort_unless(
            $request->user()->hasAnyPermission(['dashboard.view_analytics', 'reports.view_revenue'])
            || $request->user()->hasAnyRole(['super_admin', 'admin']),
            403,
            'Insufficient permissions to view analytics.'
        );

        $period = $request->input('period', 'monthly');
        $branchIds = $this->resolveBranchIds($request);

        $trend = $this->dashboardService->getRevenueTrend($period, $branchIds);

        return $this->successResponse($trend);
    }

    /**
     * Resolve the branch IDs to scope dashboard data to.
     * Admins/super_admins get global (empty array) unless a branch_id is specified.
     * Branch-scoped users are limited to their own branches; a branch_id param
     * further narrows the scope to a single branch if the user has access.
     *
     * @return array<int|string>
     */
    private function resolveBranchIds(Request $request): array
    {
        $user = $request->user();
        $isGlobal = $user->hasAnyRole(['super_admin', 'admin']);
        $requestedBranchId = $request->query('branch_id');

        if ($requestedBranchId) {
            $hasAccess = $isGlobal
                || $user->branches()->where('branches.id', $requestedBranchId)->exists();

            if ($hasAccess) {
                return [$requestedBranchId];
            }
        }

        return $isGlobal ? [] : $user->branches()->pluck('id')->toArray();
    }

    /**
     * GET /api/dashboard/vehicle-utilization
     * Get top vehicles by utilization.
     */
    public function vehicleUtilization(Request $request): JsonResponse
    {
        abort_unless(
            $request->user()->hasPermissionTo('dashboard.view_analytics')
            || $request->user()->hasAnyRole(['super_admin', 'admin']),
            403,
            'Insufficient permissions to view analytics.'
        );

        $utilization = $this->dashboardService->getVehicleUtilization();

        return $this->successResponse($utilization);
    }

    /**
     * GET /api/dashboard/recent-activity
     * Get recent rentals and quote requests.
     */
    public function recentActivity(Request $request): JsonResponse
    {
        $activity = $this->dashboardService->getRecentActivity($request->integer('limit', 10));

        return $this->successResponse($activity);
    }

    /**
     * GET /api/dashboard/upcoming-returns
     * Get rentals due today and overdue.
     */
    public function upcomingReturns(Request $request): JsonResponse
    {
        $returns = $this->dashboardService->getUpcomingReturns($request->integer('limit', 10));

        return $this->successResponse($returns);
    }
}
