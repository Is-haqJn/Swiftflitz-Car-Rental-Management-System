<?php

namespace App\Http\Controllers\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\MigrateStorageRequest;
use App\Http\Requests\RunSystemBackupRequest;
use App\Http\Requests\UpdateMaintenanceModeRequest;
use App\Jobs\StorageMigrationJob;
use App\Services\Contracts\SystemServiceInterface;
use App\Settings\BackupSettings;
use App\Settings\GeneralSettings;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class SystemController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected SystemServiceInterface $systemService
    ) {}

    /**
     * GET /api/system/info
     * Return system information for the admin dashboard.
     */
    public function info(): JsonResponse
    {
        return $this->successResponse($this->systemService->getInfo());
    }

    /**
     * POST /api/system/cache/clear
     * Clear all application caches.
     */
    public function clearCache(): JsonResponse
    {
        $this->systemService->clearAllCaches();

        return $this->successResponse(null, 'All caches cleared successfully.');
    }

    /**
     * POST /api/system/cache/config
     * Clear only the config cache.
     */
    public function clearConfigCache(): JsonResponse
    {
        $this->systemService->clearConfigCache();

        return $this->successResponse(null, 'Config cache cleared successfully.');
    }

    /**
     * POST /api/system/cache/routes
     * Clear only the route cache.
     */
    public function clearRouteCache(): JsonResponse
    {
        $this->systemService->clearRouteCache();

        return $this->successResponse(null, 'Route cache cleared successfully.');
    }

    /**
     * POST /api/system/cache/views
     * Clear only the view cache.
     */
    public function clearViewCache(): JsonResponse
    {
        $this->systemService->clearViewCache();

        return $this->successResponse(null, 'View cache cleared successfully.');
    }

    /**
     * GET /api/public/maintenance-status
     * Public (unauthenticated) endpoint - returns only what is needed to
     * render the maintenance guard on the public-facing website.
     */
    public function maintenanceStatus(GeneralSettings $settings): JsonResponse
    {
        return $this->successResponse([
            'enabled' => $settings->maintenance_mode,
            'bypass_token' => $settings->maintenance_bypass_token,
        ]);
    }

    /**
     * GET /api/system/maintenance-mode
     * Get the current maintenance mode status (authenticated, admin use).
     */
    public function maintenanceMode(GeneralSettings $settings): JsonResponse
    {
        return $this->successResponse([
            'enabled' => $settings->maintenance_mode,
            'bypass_token' => $settings->maintenance_bypass_token,
        ]);
    }

    /**
     * POST /api/system/maintenance-mode
     * Toggle maintenance mode on or off.
     * Generates a bypass token when enabling; clears it when disabling.
     */
    public function toggleMaintenanceMode(UpdateMaintenanceModeRequest $request, GeneralSettings $settings): JsonResponse
    {
        $result = $this->systemService->toggleMaintenanceMode($request->boolean('enabled'), $settings);

        $status = $result['enabled'] ? 'enabled' : 'disabled';

        return $this->successResponse($result, "Maintenance mode {$status}.");
    }

    /**
     * POST /api/system/maintenance/run
     * Dispatch the system maintenance job immediately.
     */
    public function runMaintenance(): JsonResponse
    {
        $this->systemService->runMaintenance();

        return $this->successResponse(null, 'System maintenance job queued.');
    }

    /**
     * POST /api/system/backup
     * Trigger a database backup via the db:backup Artisan command.
     */
    public function runBackup(): JsonResponse
    {
        Artisan::call('db:backup');

        $output = Artisan::output();

        return $this->successResponse(['output' => trim($output)], 'Database backup completed.');
    }

    /**
     * GET /api/system/backups
     * List all database backup files stored on the local disk.
     *
     * @return array{ name: string, size: int, created_at: string }[]
     */
    public function listBackups(): JsonResponse
    {
        $files = Storage::disk('local')->files('backups');

        $backups = collect($files)
            ->filter(fn (string $path) => str_ends_with($path, '.sql') || str_ends_with($path, '.zip'))
            ->map(fn (string $path) => [
                'name' => basename($path),
                'size' => Storage::disk('local')->size($path),
                'created_at' => date('Y-m-d\TH:i:s\Z', Storage::disk('local')->lastModified($path)),
            ])
            ->sortByDesc('created_at')
            ->values();

        return $this->successResponse($backups->all());
    }

    /**
     * GET /api/system/backups/{filename}
     * Stream a backup SQL or ZIP file for download.
     */
    public function downloadBackup(string $filename): StreamedResponse
    {
        $path = 'backups/' . basename($filename);

        abort_unless(Storage::disk('local')->exists($path), 404, 'Backup file not found.');

        return Storage::disk('local')->download($path, $filename);
    }

    /**
     * DELETE /api/system/backups/{filename}
     * Permanently delete a backup file from local storage.
     * Restricted to users with the settings.delete_backup permission (super_admin only).
     */
    public function deleteBackup(Request $request, string $filename): JsonResponse
    {
        abort_unless($request->user()->hasPermissionTo('settings.delete_backup'), 403);

        $safeName = basename($filename);

        if ($safeName !== $filename || ! preg_match('/^[A-Za-z0-9._-]+\.(sql|zip)$/', $safeName)) {
            abort(422, 'Invalid backup filename.');
        }

        $path = 'backups/' . $safeName;

        abort_unless(Storage::disk('local')->exists($path), 404, 'Backup file not found.');

        Storage::disk('local')->delete($path);

        return $this->successResponse(null, 'Backup deleted successfully.');
    }

    /**
     * POST /api/system/backup/full
     * Trigger a full system backup with selected components via the system:backup Artisan command.
     */
    public function runSystemBackup(RunSystemBackupRequest $request): JsonResponse
    {
        $options = [];

        if ($request->boolean('include_database')) {
            $options['--include-database'] = true;
        }

        if ($request->boolean('include_env')) {
            $options['--include-env'] = true;
        }

        if ($request->boolean('include_logs')) {
            $options['--include-logs'] = true;
        }

        if ($request->boolean('include_storage')) {
            $options['--include-storage'] = true;
        }

        if (empty($options)) {
            return $this->errorResponse('Please select at least one item to include in the backup.', 422);
        }

        Artisan::call('system:backup', $options);

        $output = Artisan::output();

        return $this->successResponse(['output' => trim($output)], 'Full system backup completed.');
    }

    /**
     * GET /api/system/queue/status
     * Return pending and failed job counts.
     */
    public function queueStatus(): JsonResponse
    {
        return $this->successResponse($this->systemService->getQueueStatus());
    }

    /**
     * POST /api/system/queue/restart
     * Signal queue workers to restart after the current job finishes.
     */
    public function restartQueue(): JsonResponse
    {
        $this->systemService->restartQueue();

        return $this->successResponse(null, 'Queue workers restarted successfully.');
    }

    /**
     * POST /api/system/queue/flush
     * Delete all failed jobs from the failed_jobs table.
     */
    public function flushFailedJobs(): JsonResponse
    {
        $this->systemService->flushFailedJobs();

        return $this->successResponse(null, 'Failed jobs cleared successfully.');
    }

    /**
     * POST /api/system/queue/retry
     * Re-queue all failed jobs.
     */
    public function retryFailedJobs(): JsonResponse
    {
        $this->systemService->retryFailedJobs();

        return $this->successResponse(null, 'Failed jobs queued for retry.');
    }

    /**
     * POST /api/system/storage/migrate
     * Dispatch a background job to migrate all media files between disks.
     */
    public function migrateStorage(MigrateStorageRequest $request): JsonResponse
    {
        $this->authorize('updateGeneral', \App\Settings\GeneralSettings::class);

        StorageMigrationJob::dispatch($request->string('target')->toString());

        return $this->successResponse(null, 'Storage migration queued.', 202);
    }

    /**
     * POST /api/system/storage/test-s3
     * Verify S3 credentials are functional by writing and deleting a test object.
     */
    public function testS3Connection(Request $request): JsonResponse
    {
        $this->authorize('updateGeneral', \App\Settings\GeneralSettings::class);

        try {
            Storage::disk('s3')->put('_healthcheck_test', '1');
            Storage::disk('s3')->delete('_healthcheck_test');

            return $this->successResponse(['success' => true]);
        } catch (Throwable $e) {
            return $this->successResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/system/backup-settings
     * Return current backup schedule toggles.
     */
    public function getBackupSettings(BackupSettings $settings): JsonResponse
    {
        return $this->successResponse([
            'scheduled_db_backup_enabled' => $settings->scheduled_db_backup_enabled,
            'scheduled_system_backup_enabled' => $settings->scheduled_system_backup_enabled,
            'db_backup_cron' => $settings->db_backup_cron,
            'system_backup_cron' => $settings->system_backup_cron,
            'retention_days' => $settings->retention_days,
        ]);
    }

    /**
     * PUT /api/system/backup-settings
     * Persist backup schedule toggles.
     */
    public function updateBackupSettings(Request $request, BackupSettings $settings): JsonResponse
    {
        abort_unless($request->user()->hasPermissionTo('settings.edit_backup'), 403);

        $validated = $request->validate([
            'scheduled_db_backup_enabled' => 'sometimes|boolean',
            'scheduled_system_backup_enabled' => 'sometimes|boolean',
            'db_backup_cron' => 'sometimes|string|max:50',
            'system_backup_cron' => 'sometimes|string|max:50',
            'retention_days' => 'sometimes|integer|min:1|max:365',
        ]);

        foreach ($validated as $key => $value) {
            $settings->{$key} = $value;
        }

        $settings->save();

        return $this->successResponse([
            'scheduled_db_backup_enabled' => $settings->scheduled_db_backup_enabled,
            'scheduled_system_backup_enabled' => $settings->scheduled_system_backup_enabled,
            'db_backup_cron' => $settings->db_backup_cron,
            'system_backup_cron' => $settings->system_backup_cron,
            'retention_days' => $settings->retention_days,
        ], 'Backup settings updated successfully.');
    }
}
