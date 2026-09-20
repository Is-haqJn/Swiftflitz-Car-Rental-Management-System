<?php

namespace App\Services\Contracts;

interface ReportServiceInterface
{
    /**
     * Generate revenue report for a given date range.
     *
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function revenueReport(array $filters): array;

    /**
     * Generate vehicle utilization report.
     *
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function vehicleReport(array $filters): array;

    /**
     * Generate manager performance report.
     *
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function managerPerformanceReport(array $filters): array;

    /**
     * Generate outstanding payments report.
     *
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function outstandingPaymentsReport(array $filters): array;

    /**
     * Generate maintenance and repairs report.
     *
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function maintenanceReport(array $filters): array;

    /**
     * Generate vehicle expense report.
     *
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function vehicleExpenseReport(array $filters): array;

    /**
     * Generate customer analysis report.
     *
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function customerAnalysisReport(array $filters): array;
}
