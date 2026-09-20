<?php

namespace App\Services;

use App\Jobs\PerformSystemMaintenance;
use App\Services\Contracts\SystemServiceInterface;
use App\Settings\GeneralSettings;
use Carbon\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SystemService implements SystemServiceInterface
{
    /**
     * @return array{php_version: string, laravel_version: string, environment: string, debug_mode: bool, timezone: string, database_driver: string, cache_driver: string, queue_driver: string}
     */
    public function getInfo(): array
    {
        return [
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'environment' => app()->environment(),
            'debug_mode' => config('app.debug'),
            'timezone' => config('app.timezone'),
            'database_driver' => DB::getDriverName(),
            'cache_driver' => config('cache.default'),
            'queue_driver' => config('queue.default'),
        ];
    }

    public function clearAllCaches(): void
    {
        Cache::flush();
        Artisan::call('cache:clear');
        Artisan::call('config:clear');
        Artisan::call('route:clear');
        Artisan::call('view:clear');
    }

    public function clearConfigCache(): void
    {
        Artisan::call('config:clear');
    }

    public function clearRouteCache(): void
    {
        Artisan::call('route:clear');
    }

    public function clearViewCache(): void
    {
        Artisan::call('view:clear');
    }

    /**
     * @return array{enabled: bool, bypass_token: string|null}
     */
    public function toggleMaintenanceMode(bool $enabled, GeneralSettings $settings): array
    {
        $settings->maintenance_mode = $enabled;
        $settings->maintenance_bypass_token = $enabled ? Str::uuid()->toString() : null;
        $settings->save();

        return [
            'enabled' => $settings->maintenance_mode,
            'bypass_token' => $settings->maintenance_bypass_token,
        ];
    }

    public function runMaintenance(): void
    {
        PerformSystemMaintenance::dispatch();
    }

    /**
     * @return array{pending_jobs: int, failed_jobs: int}
     */
    public function getQueueStatus(): array
    {
        return [
            'pending_jobs' => DB::table('jobs')->count(),
            'failed_jobs' => DB::table('failed_jobs')->count(),
            'worker_status' => $this->getWorkerStatus(),
        ];
    }

    public function restartQueue(): void
    {
        Artisan::call('queue:restart');
    }

    public function flushFailedJobs(): void
    {
        Artisan::call('queue:flush');
    }

    public function retryFailedJobs(): void
    {
        Artisan::call('queue:retry', ['id' => ['all']]);
    }

    public function getWorkerStatus(): string
    {
        $heartbeat = Cache::get('queue:heartbeat');

        if ($heartbeat === null) {
            return 'unknown';
        }

        $lastBeat = Carbon::parse($heartbeat);

        if ($lastBeat->diffInSeconds(now()) <= 360) {
            return 'running';
        }

        return 'stopped';
    }
}
