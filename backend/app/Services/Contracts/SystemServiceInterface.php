<?php

namespace App\Services\Contracts;

use App\Settings\GeneralSettings;

interface SystemServiceInterface
{
    /**
     * Get system information (PHP version, Laravel version, environment, etc.).
     *
     * @return array{php_version: string, laravel_version: string, environment: string, debug_mode: bool, timezone: string, database_driver: string, cache_driver: string, queue_driver: string}
     */
    public function getInfo(): array;

    /**
     * Clear all application caches (cache, config, route, view).
     */
    public function clearAllCaches(): void;

    /**
     * Clear only the config cache.
     */
    public function clearConfigCache(): void;

    /**
     * Clear only the route cache.
     */
    public function clearRouteCache(): void;

    /**
     * Clear only the view cache.
     */
    public function clearViewCache(): void;

    /**
     * Toggle maintenance mode on or off and persist the setting.
     *
     * @return array{enabled: bool, bypass_token: string|null}
     */
    public function toggleMaintenanceMode(bool $enabled, GeneralSettings $settings): array;

    /**
     * Dispatch the system maintenance job.
     */
    public function runMaintenance(): void;

    /**
     * Return the count of pending and failed queued jobs, plus the worker heartbeat status.
     *
     * @return array{pending_jobs: int, failed_jobs: int, worker_status: string}
     */
    public function getQueueStatus(): array;

    /**
     * Signal all queue workers to restart after their current job finishes.
     */
    public function restartQueue(): void;

    /**
     * Delete all records from the failed_jobs table.
     */
    public function flushFailedJobs(): void;

    /**
     * Retry all failed jobs by re-queueing them.
     */
    public function retryFailedJobs(): void;

    /**
     * Return worker status based on the heartbeat cache key.
     * Possible values: 'running', 'stopped', 'unknown'.
     */
    public function getWorkerStatus(): string;
}
