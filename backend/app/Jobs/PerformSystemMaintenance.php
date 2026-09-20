<?php

namespace App\Jobs;

use App\Models\ExportRecord;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class PerformSystemMaintenance implements ShouldQueue
{
    use Queueable;

    /**
     * Execute the maintenance job.
     *
     * Tasks:
     *  - Delete expired export records and their associated files.
     *  - Can be extended with additional housekeeping tasks.
     */
    public function handle(): void
    {
        $this->pruneExpiredExports();
    }

    /**
     * Remove expired export records and their storage files.
     */
    private function pruneExpiredExports(): void
    {
        // ? Find all export records that have passed their expiry date
        $expired = ExportRecord::query()
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->get();

        foreach ($expired as $record) {
            if ($record->file_path && Storage::exists($record->file_path)) {
                Storage::delete($record->file_path);
            }

            $record->delete();
        }

        Log::info('[Maintenance] Pruned expired exports.', ['count' => $expired->count()]);
    }
}
