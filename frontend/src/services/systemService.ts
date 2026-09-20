import { apiClient } from '@/shared/api/apiClient';
import { API_ENDPOINTS } from '@/shared/api/endpoints';
import type { ApiResponse } from '@/shared/types';

export interface SystemInfo {
    php_version: string;
    laravel_version: string;
    environment: string;
    debug_mode: boolean;
    timezone: string;
    database_driver: string;
    cache_driver: string;
    queue_driver: string;
}

export interface MaintenanceModeStatus {
    enabled: boolean;
    bypass_token: string | null;
}

export interface BackupFile {
    name: string;
    size: number;
    created_at: string;
}

export interface BackupSettings {
    scheduled_db_backup_enabled: boolean;
    scheduled_system_backup_enabled: boolean;
    db_backup_cron: string;
    system_backup_cron: string;
    retention_days: number;
}

export interface SystemBackupOptions {
    include_database: boolean;
    include_env: boolean;
    include_logs: boolean;
    include_storage: boolean;
}

export interface QueueStatus {
    pending_jobs: number;
    failed_jobs: number;
    worker_status: 'running' | 'stopped' | 'unknown';
}

export const systemService = {
    async getInfo(): Promise<ApiResponse<SystemInfo>> {
        return apiClient.get<ApiResponse<SystemInfo>>(
            API_ENDPOINTS.SYSTEM.INFO
        );
    },

    async clearAllCache(): Promise<ApiResponse<null>> {
        return apiClient.post<ApiResponse<null>>(
            API_ENDPOINTS.SYSTEM.CACHE_CLEAR,
            {}
        );
    },

    async clearConfigCache(): Promise<ApiResponse<null>> {
        return apiClient.post<ApiResponse<null>>(
            API_ENDPOINTS.SYSTEM.CACHE_CONFIG,
            {}
        );
    },

    async clearRouteCache(): Promise<ApiResponse<null>> {
        return apiClient.post<ApiResponse<null>>(
            API_ENDPOINTS.SYSTEM.CACHE_ROUTES,
            {}
        );
    },

    async clearViewCache(): Promise<ApiResponse<null>> {
        return apiClient.post<ApiResponse<null>>(
            API_ENDPOINTS.SYSTEM.CACHE_VIEWS,
            {}
        );
    },

    async getPublicMaintenanceStatus(): Promise<
        ApiResponse<MaintenanceModeStatus>
    > {
        return apiClient.get<ApiResponse<MaintenanceModeStatus>>(
            API_ENDPOINTS.PUBLIC.MAINTENANCE_STATUS
        );
    },

    async getMaintenanceMode(): Promise<ApiResponse<MaintenanceModeStatus>> {
        return apiClient.get<ApiResponse<MaintenanceModeStatus>>(
            API_ENDPOINTS.SYSTEM.MAINTENANCE_MODE
        );
    },

    async toggleMaintenanceMode(
        enabled: boolean
    ): Promise<ApiResponse<MaintenanceModeStatus>> {
        return apiClient.post<ApiResponse<MaintenanceModeStatus>>(
            API_ENDPOINTS.SYSTEM.MAINTENANCE_MODE,
            { enabled }
        );
    },

    async runMaintenance(): Promise<ApiResponse<null>> {
        return apiClient.post<ApiResponse<null>>(
            API_ENDPOINTS.SYSTEM.RUN_MAINTENANCE,
            {}
        );
    },

    async runBackup(): Promise<ApiResponse<{ output: string }>> {
        return apiClient.post<ApiResponse<{ output: string }>>(
            API_ENDPOINTS.SYSTEM.BACKUP,
            {}
        );
    },

    async runSystemBackup(
        options: SystemBackupOptions
    ): Promise<ApiResponse<{ output: string }>> {
        return apiClient.post<ApiResponse<{ output: string }>>(
            API_ENDPOINTS.SYSTEM.BACKUP_FULL,
            options
        );
    },

    async listBackups(): Promise<ApiResponse<BackupFile[]>> {
        return apiClient.get<ApiResponse<BackupFile[]>>(
            API_ENDPOINTS.SYSTEM.BACKUPS
        );
    },

    async getBackupSettings(): Promise<ApiResponse<BackupSettings>> {
        return apiClient.get<ApiResponse<BackupSettings>>(
            API_ENDPOINTS.SYSTEM.BACKUP_SETTINGS
        );
    },

    async updateBackupSettings(
        payload: Partial<BackupSettings>
    ): Promise<ApiResponse<BackupSettings>> {
        return apiClient.put<ApiResponse<BackupSettings>>(
            API_ENDPOINTS.SYSTEM.BACKUP_SETTINGS,
            payload
        );
    },

    async getQueueStatus(): Promise<ApiResponse<QueueStatus>> {
        return apiClient.get<ApiResponse<QueueStatus>>(
            API_ENDPOINTS.SYSTEM.QUEUE_STATUS
        );
    },

    async restartQueue(): Promise<ApiResponse<null>> {
        return apiClient.post<ApiResponse<null>>(
            API_ENDPOINTS.SYSTEM.QUEUE_RESTART,
            {}
        );
    },

    async flushFailedJobs(): Promise<ApiResponse<null>> {
        return apiClient.post<ApiResponse<null>>(
            API_ENDPOINTS.SYSTEM.QUEUE_FLUSH,
            {}
        );
    },

    async retryFailedJobs(): Promise<ApiResponse<null>> {
        return apiClient.post<ApiResponse<null>>(
            API_ENDPOINTS.SYSTEM.QUEUE_RETRY,
            {}
        );
    },

    async deleteBackup(filename: string): Promise<ApiResponse<null>> {
        return apiClient.delete<ApiResponse<null>>(
            API_ENDPOINTS.SYSTEM.BACKUP_DELETE(filename)
        );
    },

    async migrateStorage(target: 'media' | 's3'): Promise<ApiResponse<null>> {
        return apiClient.post<ApiResponse<null>>(
            API_ENDPOINTS.SYSTEM.STORAGE_MIGRATE,
            { target }
        );
    },

    async testS3Connection(): Promise<
        ApiResponse<{ success: boolean; error?: string }>
    > {
        return apiClient.post<ApiResponse<{ success: boolean; error?: string }>>(
            API_ENDPOINTS.SYSTEM.STORAGE_TEST_S3,
            {}
        );
    },

    async downloadBackup(filename: string): Promise<string> {
        const blob = await apiClient.get<Blob>(
            API_ENDPOINTS.SYSTEM.BACKUP_DOWNLOAD(filename),
            { responseType: 'blob' } as never
        );
        const downloadBlob = new Blob([blob], {
            type: 'application/octet-stream',
        });
        return URL.createObjectURL(downloadBlob);
    },
};
