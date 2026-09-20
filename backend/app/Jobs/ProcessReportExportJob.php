<?php

namespace App\Jobs;

use App\Enums\ExportStatus;
use App\Events\ExportReadyEvent;
use App\Models\ExportRecord;
use App\Services\Contracts\ExportServiceInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProcessReportExportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 300;

    public function __construct(
        public readonly string $exportRecordId,
    ) {}

    /**
     * Generate the export file and notify the user when ready.
     */
    public function handle(ExportServiceInterface $exportService): void
    {
        $record = ExportRecord::findOrFail($this->exportRecordId);

        // ? Mark as processing so the frontend can show a spinner
        $record->update(['status' => ExportStatus::Processing]);

        $result = $exportService->generateExportFile(
            $record->type,
            $record->filters ?? [],
            $record->format,
        );

        $record->update([
            'status' => ExportStatus::Ready,
            'filename' => $result['filename'],
            'file_path' => $result['path'],
            'file_size' => $result['size'],
            'expires_at' => now()->addHours(24),
        ]);

        // ? Notify the frontend - silently skip if the broadcast connection is unavailable
        try {
            broadcast(new ExportReadyEvent($record->fresh()));
        } catch (Throwable $e) {
            Log::warning('ExportReadyEvent broadcast failed: ' . $e->getMessage());
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(Throwable $exception): void
    {
        ExportRecord::where('id', $this->exportRecordId)->update([
            'status' => ExportStatus::Failed,
            'error_message' => $exception->getMessage(),
        ]);
    }
}
