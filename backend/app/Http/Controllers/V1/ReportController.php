<?php

namespace App\Http\Controllers\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReportFilterRequest;
use App\Services\Contracts\ExportServiceInterface;
use App\Services\Contracts\ReportServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ReportServiceInterface $reportService,
        protected ExportServiceInterface $exportService,
    ) {}

    /**
     * GET /api/reports/revenue
     * Revenue report for a given date range.
     */
    public function revenue(ReportFilterRequest $request): JsonResponse
    {
        $data = $this->reportService->revenueReport($this->scopedFilters($request->toFilters()));

        return $this->successResponse($data);
    }

    /**
     * GET /api/reports/vehicles
     * Vehicle utilization report.
     */
    public function vehicles(ReportFilterRequest $request): JsonResponse
    {
        $data = $this->reportService->vehicleReport($this->scopedFilters($request->toFilters()));

        return $this->successResponse($data);
    }

    /**
     * GET /api/reports/manager-performance
     * Manager performance report.
     */
    public function managerPerformance(ReportFilterRequest $request): JsonResponse
    {
        $data = $this->reportService->managerPerformanceReport($this->scopedFilters($request->toFilters()));

        return $this->successResponse($data);
    }

    /**
     * GET /api/reports/outstanding-payments
     * Outstanding payments report.
     */
    public function outstandingPayments(ReportFilterRequest $request): JsonResponse
    {
        $data = $this->reportService->outstandingPaymentsReport($this->scopedFilters($request->toFilters()));

        return $this->successResponse($data);
    }

    /**
     * GET /api/reports/maintenance
     * Maintenance and repairs report.
     */
    public function maintenance(ReportFilterRequest $request): JsonResponse
    {
        $data = $this->reportService->maintenanceReport($this->scopedFilters($request->toFilters()));

        return $this->successResponse($data);
    }

    /**
     * GET /api/reports/customer-analysis
     * Customer analysis report.
     */
    public function customerAnalysis(ReportFilterRequest $request): JsonResponse
    {
        $data = $this->reportService->customerAnalysisReport($this->scopedFilters($request->toFilters()));

        return $this->successResponse($data);
    }

    /**
     * GET /api/reports/vehicle-expenses
     * Vehicle expense report.
     */
    public function vehicleExpenses(ReportFilterRequest $request): JsonResponse
    {
        $filters = array_merge($this->scopedFilters($request->toFilters()), [
            'per_page' => $request->integer('per_page', 15),
        ]);

        $data = $this->reportService->vehicleExpenseReport($filters);

        return $this->successResponse($data);
    }

    /**
     * GET /api/reports/{type}/export/pdf
     * Export a report as PDF.
     */
    public function exportPdf(ReportFilterRequest $request, string $type)
    {
        $filters = $this->scopedFilters($request->toFilters());

        $reportMethods = [
            'revenue' => fn () => $this->reportService->revenueReport($filters),
            'vehicles' => fn () => $this->reportService->vehicleReport($filters),
            'manager-performance' => fn () => $this->reportService->managerPerformanceReport($filters),
            'outstanding-payments' => fn () => $this->reportService->outstandingPaymentsReport($filters),
            'maintenance' => fn () => $this->reportService->maintenanceReport($filters),
            'customer-analysis' => fn () => $this->reportService->customerAnalysisReport($filters),
            'vehicle-expenses' => fn () => $this->reportService->vehicleExpenseReport($filters),
        ];

        abort_if(! isset($reportMethods[$type]), 404, 'Invalid report type.');

        $data = $reportMethods[$type]();

        return $this->exportService->exportReportPdf(str_replace('-', '_', $type), $data);
    }

    /**
     * Apply branch-level scoping based on the authenticated user's role.
     * Admins and super_admins see all data; branch managers see only their assigned branches.
     *
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function scopedFilters(array $filters): array
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();

        if ($user->hasAnyRole(['super_admin', 'admin'])) {
            return $filters;
        }

        $branchIds = $user->branches()->pluck('id')->toArray();

        /* If user explicitly selected one of their own branches, respect it. */
        if (isset($filters['branch_id']) && in_array($filters['branch_id'], $branchIds)) {
            return $filters;
        }

        unset($filters['branch_id']);

        if (! empty($branchIds)) {
            $filters['branch_ids'] = $branchIds;
        }

        return $filters;
    }
}
