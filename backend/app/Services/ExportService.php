<?php

namespace App\Services;

use App\DTOs\ExportData;
use App\Enums\ExportStatus;
use App\Exports\ActivityLogsExport;
use App\Exports\CustomersExport;
use App\Exports\RentalsExport;
use App\Exports\VehiclesExport;
use App\Jobs\ProcessReportExportJob;
use App\Models\ExportRecord;
use App\Models\Rental;
use App\Models\User;
use App\Repositories\Contracts\CustomerRepositoryInterface;
use App\Repositories\Contracts\ExportRepositoryInterface;
use App\Repositories\Contracts\VehicleRepositoryInterface;
use App\Services\Contracts\ExportServiceInterface;
use App\Services\Contracts\ReportServiceInterface;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ExportService implements ExportServiceInterface
{
    public function __construct(
        protected ExportRepositoryInterface $exportRepository,
        protected CustomerRepositoryInterface $customerRepository,
        protected VehicleRepositoryInterface $vehicleRepository,
        protected ReportServiceInterface $reportService,
    ) {}

    /**
     * Get the most recent export records for the given user.
     *
     * @return Collection<int, ExportRecord>
     */
    public function getForUser(User $user): Collection
    {
        return $this->exportRepository->getForUser($user->id);
    }

    /**
     * Create an ExportRecord, dispatch the async job, and return the pending record.
     */
    public function queueExport(User $user, ExportData $data): ExportRecord
    {
        /** @var ExportRecord $record */
        $record = $this->exportRepository->create([
            'user_id' => $user->id,
            'type' => $data->type,
            'format' => $data->format,
            'status' => ExportStatus::Pending,
            'filters' => $data->filters,
        ]);

        ProcessReportExportJob::dispatch($record->id);

        return $record;
    }

    /**
     * Delete an export record and its file. Aborts with 403 if user does not own it.
     */
    public function deleteExport(User $user, ExportRecord $export): void
    {
        abort_if($export->user_id !== $user->id, 403);

        $this->exportRepository->deleteRecord($export);
    }

    /**
     * Export filtered customers to Excel.
     *
     * @param  array<string, mixed>  $filters
     */
    public function exportCustomers(array $filters): BinaryFileResponse
    {
        $customers = $this->customerRepository->getForExport($filters);

        return Excel::download(
            new CustomersExport($customers),
            'customers-' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    /**
     * Export rentals to Excel.
     *
     * @param  array<string, mixed>  $filters
     */
    public function exportRentals(array $filters): BinaryFileResponse
    {
        $rentals = Rental::query()
            ->with(['customer', 'vehicle'])
            ->latest()
            ->get();

        return Excel::download(
            new RentalsExport($rentals),
            'rentals-' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    /**
     * Export vehicles to Excel.
     *
     * @param  array<string, mixed>  $filters
     */
    public function exportVehicles(array $filters): BinaryFileResponse
    {
        $vehicles = $this->vehicleRepository->getForExport($filters);

        return Excel::download(
            new VehiclesExport($vehicles),
            'vehicles-' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    /**
     * Export a report to PDF using DomPDF.
     *
     * @param  array<string, mixed>  $data
     */
    public function exportReportPdf(string $reportType, array $data): Response
    {
        $viewMap = [
            'revenue' => 'exports.pdf.revenue',
            'vehicles' => 'exports.pdf.vehicles',
            'manager_performance' => 'exports.pdf.manager-performance',
            'outstanding_payments' => 'exports.pdf.outstanding-payments',
            'maintenance' => 'exports.pdf.maintenance',
            'customer_analysis' => 'exports.pdf.customer-analysis',
            'vehicle_expenses' => 'exports.pdf.vehicle-expenses',
        ];

        abort_if(! isset($viewMap[$reportType]), 422, "Invalid report type: {$reportType}");

        $pdf = Pdf::loadView($viewMap[$reportType], [
            'data' => $data,
            'generated_at' => now()->format('Y-m-d H:i:s'),
            'report_type' => $reportType,
        ])->setPaper('a4', 'landscape');

        return $pdf->download("{$reportType}-report-" . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Generate an export file in the background and persist it to storage.
     *
     * @param  array<string, mixed>  $filters
     * @return array{path: string, filename: string, size: int}
     */
    public function generateExportFile(string $type, array $filters, string $format): array
    {
        if (str_starts_with($type, 'report-')) {
            return $this->generateReportPdf($type, $filters);
        }

        $exportClasses = [
            'rentals' => fn () => [
                new RentalsExport(Rental::query()->with(['customer', 'vehicle'])->latest()->get()),
                'rentals',
            ],
            'customers' => fn () => [new CustomersExport($this->customerRepository->getForExport($filters)), 'customers'],
            'vehicles' => fn () => [new VehiclesExport($this->vehicleRepository->getForExport($filters)), 'vehicles'],
            'activity_logs' => fn () => [
                new ActivityLogsExport(
                    Activity::with('causer')
                        ->latest()
                        ->get()
                ),
                'activity-logs',
            ],
        ];

        abort_if(! isset($exportClasses[$type]), 422, "Invalid export type: {$type}");

        [$exportInstance, $prefix] = $exportClasses[$type]();

        $filename = "{$prefix}-" . now()->format('Y-m-d-His') . ".{$format}";
        $directory = 'exports/' . auth()->id();
        $relativePath = "{$directory}/{$filename}";

        Storage::makeDirectory($directory);

        Excel::store($exportInstance, $relativePath);

        $absolutePath = storage_path("app/{$relativePath}");

        return [
            'path' => $relativePath,
            'filename' => $filename,
            'size' => file_exists($absolutePath) ? filesize($absolutePath) : 0,
        ];
    }

    /**
     * Generate a report PDF, save to storage, and return file metadata.
     *
     * @param  array<string, mixed>  $filters
     * @return array{path: string, filename: string, size: int}
     */
    private function generateReportPdf(string $type, array $filters): array
    {
        $reportName = substr($type, 7);

        $reportMethods = [
            'revenue' => fn () => $this->reportService->revenueReport($filters),
            'vehicles' => fn () => $this->reportService->vehicleReport($filters),
            'manager-performance' => fn () => $this->reportService->managerPerformanceReport($filters),
            'outstanding-payments' => fn () => $this->reportService->outstandingPaymentsReport($filters),
            'maintenance' => fn () => $this->reportService->maintenanceReport($filters),
            'customer-analysis' => fn () => $this->reportService->customerAnalysisReport($filters),
            'vehicle-expenses' => fn () => $this->reportService->vehicleExpenseReport($filters),
        ];

        $viewMap = [
            'revenue' => 'exports.pdf.revenue',
            'vehicles' => 'exports.pdf.vehicles',
            'manager-performance' => 'exports.pdf.manager-performance',
            'outstanding-payments' => 'exports.pdf.outstanding-payments',
            'maintenance' => 'exports.pdf.maintenance',
            'customer-analysis' => 'exports.pdf.customer-analysis',
            'vehicle-expenses' => 'exports.pdf.vehicle-expenses',
        ];

        abort_if(! isset($reportMethods[$reportName]), 422, "Invalid report type: {$type}");

        $data = $reportMethods[$reportName]();

        $pdfContent = Pdf::loadView($viewMap[$reportName], [
            'data' => $data,
            'generated_at' => now()->format('Y-m-d H:i:s'),
            'report_type' => $reportName,
        ])->setPaper('a4', 'landscape')->output();

        $filename = "{$reportName}-report-" . now()->format('Y-m-d-His') . '.pdf';
        $directory = 'exports/' . auth()->id();
        $relativePath = "{$directory}/{$filename}";

        Storage::makeDirectory($directory);
        Storage::put($relativePath, $pdfContent);

        return [
            'path' => $relativePath,
            'filename' => $filename,
            'size' => strlen($pdfContent),
        ];
    }
}
