<?php

namespace App\Http\Controllers\V1;

use App\DTOs\ExportData;
use App\Http\Controllers\Controller;
use App\Http\Requests\QueueExportRequest;
use App\Http\Resources\ExportRecordResource;
use App\Models\ExportRecord;
use App\Services\Contracts\ExportServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ExportServiceInterface $exportService,
    ) {}

    /**
     * GET /api/v1/exports
     * List the current user's export records (most recent first).
     */
    public function index(Request $request): JsonResponse
    {
        $records = $this->exportService->getForUser($request->user());

        return $this->successResponse(ExportRecordResource::collection($records));
    }

    /**
     * POST /api/v1/exports/queue
     * Validate, create a pending ExportRecord, dispatch the async job.
     */
    public function queue(QueueExportRequest $request): JsonResponse
    {
        $record = $this->exportService->queueExport(
            $request->user(),
            ExportData::fromRequest($request->validated()),
        );

        return $this->successResponse(
            new ExportRecordResource($record),
            'Export queued. You will be notified when it is ready.',
            202
        );
    }

    /**
     * GET /api/v1/exports/{export}/download
     * Stream the generated export file to the user.
     */
    public function download(Request $request, ExportRecord $export): StreamedResponse
    {
        abort_if($export->user_id !== $request->user()->id, 403);
        abort_if(! $export->isReady(), 422, 'Export is not ready for download.');
        abort_if($export->isExpired(), 410, 'This export link has expired.');
        abort_if(! Storage::exists($export->file_path), 404, 'Export file not found.');

        $mimeType = match (true) {
            str_ends_with($export->filename, '.pdf') => 'application/pdf',
            str_ends_with($export->filename, '.xlsx') => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            str_ends_with($export->filename, '.csv') => 'text/csv',
            default => 'application/octet-stream',
        };

        return response()->streamDownload(function () use ($export) {
            echo Storage::get($export->file_path);
        }, $export->filename, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'attachment; filename="' . $export->filename . '"',
        ]);
    }

    /**
     * DELETE /api/v1/exports/{export}
     * Delete an export record and its associated file.
     */
    public function destroy(Request $request, ExportRecord $export): JsonResponse
    {
        $this->exportService->deleteExport($request->user(), $export);

        return $this->successResponse(null, 'Export deleted.');
    }

    /**
     * GET /api/v1/export/rentals
     * Export rentals to Excel (sync, legacy).
     */
    public function rentals(Request $request)
    {
        return $this->exportService->exportRentals([]);
    }

    /**
     * GET /api/v1/export/customers
     * Export customers to Excel with optional filters (sync, legacy).
     */
    public function customers(Request $request)
    {
        return $this->exportService->exportCustomers($request->only(['is_blacklisted']));
    }

    /**
     * GET /api/v1/export/vehicles
     * Export vehicles to Excel with optional filters (sync, legacy).
     */
    public function vehicles(Request $request)
    {
        return $this->exportService->exportVehicles($request->only(['status']));
    }
}
