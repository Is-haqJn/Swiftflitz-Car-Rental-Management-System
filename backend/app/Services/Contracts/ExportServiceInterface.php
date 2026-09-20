<?php

namespace App\Services\Contracts;

use App\DTOs\ExportData;
use App\Models\ExportRecord;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

interface ExportServiceInterface
{
    /**
     * Get the most recent export records for the given user.
     *
     * @return Collection<int, ExportRecord>
     */
    public function getForUser(User $user): Collection;

    /**
     * Create an ExportRecord, dispatch the async job, and return the pending record.
     */
    public function queueExport(User $user, ExportData $data): ExportRecord;

    /**
     * Delete an export record and its file. Aborts with 403 if user does not own it.
     */
    public function deleteExport(User $user, ExportRecord $export): void;

    /**
     * Export rentals to Excel (sync direct download).
     *
     * @param  array<string, mixed>  $filters
     */
    public function exportRentals(array $filters): BinaryFileResponse;

    /**
     * Export customers to Excel (sync direct download).
     *
     * @param  array<string, mixed>  $filters
     */
    public function exportCustomers(array $filters): BinaryFileResponse;

    /**
     * Export vehicles to Excel (sync direct download).
     *
     * @param  array<string, mixed>  $filters
     */
    public function exportVehicles(array $filters): BinaryFileResponse;

    /**
     * Export a report to PDF.
     *
     * @param  array<string, mixed>  $data
     */
    public function exportReportPdf(string $reportType, array $data): Response;

    /**
     * Generate an export file and store it to disk. Returns file metadata.
     *
     * @param  array<string, mixed>  $filters
     * @return array{path: string, filename: string, size: int}
     */
    public function generateExportFile(string $type, array $filters, string $format): array;
}
