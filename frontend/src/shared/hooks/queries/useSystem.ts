import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    systemService,
    type BackupSettings,
    type SystemBackupOptions,
} from '@/services/systemService';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';

export const systemKeys = {
    info: ['system', 'info'] as const,
    maintenanceMode: ['system', 'maintenance-mode'] as const,
    publicMaintenanceStatus: ['public', 'maintenance-status'] as const,
    backups: ['system', 'backups'] as const,
    backupSettings: ['system', 'backup-settings'] as const,
    queueStatus: ['system', 'queue-status'] as const,
};

export function useSystemInfo() {
    return useQuery({
        queryKey: systemKeys.info,
        queryFn: () => systemService.getInfo(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useClearAllCache() {
    return useMutation({
        mutationFn: () => systemService.clearAllCache(),
        onSuccess: res =>
            toast.success(res.message ?? 'All caches cleared', {
                id: 'cache-clear-all',
            }),
        onError: error =>
            toast.error(getErrorMessage(error, 'Failed to clear cache'), {
                id: 'cache-clear-all-error',
            }),
    });
}

export function useClearConfigCache() {
    return useMutation({
        mutationFn: () => systemService.clearConfigCache(),
        onSuccess: res =>
            toast.success(res.message ?? 'Config cache cleared', {
                id: 'cache-clear-config',
            }),
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to clear config cache'),
                {
                    id: 'cache-clear-config-error',
                }
            ),
    });
}

export function useClearRouteCache() {
    return useMutation({
        mutationFn: () => systemService.clearRouteCache(),
        onSuccess: res =>
            toast.success(res.message ?? 'Route cache cleared', {
                id: 'cache-clear-routes',
            }),
        onError: error =>
            toast.error(getErrorMessage(error, 'Failed to clear route cache'), {
                id: 'cache-clear-routes-error',
            }),
    });
}

export function useClearViewCache() {
    return useMutation({
        mutationFn: () => systemService.clearViewCache(),
        onSuccess: res =>
            toast.success(res.message ?? 'View cache cleared', {
                id: 'cache-clear-views',
            }),
        onError: error =>
            toast.error(getErrorMessage(error, 'Failed to clear view cache'), {
                id: 'cache-clear-views-error',
            }),
    });
}

export function usePublicMaintenanceStatus() {
    return useQuery({
        queryKey: systemKeys.publicMaintenanceStatus,
        queryFn: () => systemService.getPublicMaintenanceStatus(),
        staleTime: 1000 * 30, // 30 seconds - poll-friendly for unauthenticated visitors
        retry: false,
    });
}

export function useMaintenanceMode() {
    return useQuery({
        queryKey: systemKeys.maintenanceMode,
        queryFn: () => systemService.getMaintenanceMode(),
        staleTime: 1000 * 60,
    });
}

export function useToggleMaintenanceMode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (enabled: boolean) =>
            systemService.toggleMaintenanceMode(enabled),
        onSuccess: res => {
            queryClient.setQueryData(systemKeys.maintenanceMode, res);
            const status = res.data?.enabled ? 'enabled' : 'disabled';
            toast.success(`Maintenance mode ${status}.`, {
                id: 'maintenance-mode-toggle',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to toggle maintenance mode.'),
                {
                    id: 'maintenance-mode-error',
                }
            ),
    });
}

export function useRunMaintenance() {
    return useMutation({
        mutationFn: () => systemService.runMaintenance(),
        onSuccess: res =>
            toast.success(res.message ?? 'Maintenance job queued.', {
                id: 'maintenance-run',
            }),
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to queue maintenance job.'),
                {
                    id: 'maintenance-run-error',
                }
            ),
    });
}

export function useRunBackup() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => systemService.runBackup(),
        onSuccess: res => {
            toast.success(res.message ?? 'Backup completed.', {
                id: 'backup-run',
            });
            queryClient.invalidateQueries({ queryKey: systemKeys.backups });
        },
        onError: error =>
            toast.error(
                getErrorMessage(
                    error,
                    'Backup failed. Ensure mysqldump is available.'
                ),
                { id: 'backup-run-error' }
            ),
    });
}

export function useRunSystemBackup() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (options: SystemBackupOptions) =>
            systemService.runSystemBackup(options),
        onSuccess: res => {
            toast.success(res.message ?? 'System backup completed.', {
                id: 'system-backup-run',
            });
            queryClient.invalidateQueries({ queryKey: systemKeys.backups });
        },
        onError: error =>
            toast.error(
                getErrorMessage(
                    error,
                    'System backup failed. Ensure mysqldump is available.'
                ),
                { id: 'system-backup-run-error' }
            ),
    });
}

export function useListBackups() {
    return useQuery({
        queryKey: systemKeys.backups,
        queryFn: () => systemService.listBackups(),
    });
}

export function useBackupSettings() {
    return useQuery({
        queryKey: systemKeys.backupSettings,
        queryFn: () => systemService.getBackupSettings(),
        staleTime: 1000 * 60,
    });
}

export function useUpdateBackupSettings() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: Partial<BackupSettings>) =>
            systemService.updateBackupSettings(payload),
        onSuccess: res => {
            queryClient.setQueryData(systemKeys.backupSettings, res);
            toast.success(res.message ?? 'Backup settings updated.', {
                id: 'backup-settings-update',
            });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to update backup settings.'),
                { id: 'backup-settings-update-error' }
            ),
    });
}

export function useQueueStatus() {
    return useQuery({
        queryKey: systemKeys.queueStatus,
        queryFn: () => systemService.getQueueStatus(),
        staleTime: 0,
        refetchInterval: 1000 * 5,
    });
}

export function useRestartQueue() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => systemService.restartQueue(),
        onSuccess: res => {
            toast.success(res.message ?? 'Queue workers restarted.', {
                id: 'queue-restart',
            });
            queryClient.invalidateQueries({ queryKey: systemKeys.queueStatus });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to restart queue workers.'),
                { id: 'queue-restart-error' }
            ),
    });
}

export function useFlushFailedJobs() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => systemService.flushFailedJobs(),
        onSuccess: res => {
            toast.success(res.message ?? 'Failed jobs cleared.', {
                id: 'queue-flush',
            });
            queryClient.invalidateQueries({ queryKey: systemKeys.queueStatus });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to clear failed jobs.'),
                { id: 'queue-flush-error' }
            ),
    });
}

export function useRetryFailedJobs() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => systemService.retryFailedJobs(),
        onSuccess: res => {
            toast.success(res.message ?? 'Failed jobs queued for retry.', {
                id: 'queue-retry',
            });
            queryClient.invalidateQueries({ queryKey: systemKeys.queueStatus });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to retry failed jobs.'),
                { id: 'queue-retry-error' }
            ),
    });
}

export function useDeleteBackup() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (filename: string) => systemService.deleteBackup(filename),
        onSuccess: res => {
            toast.success(res.message ?? 'Backup deleted.', {
                id: 'backup-delete',
            });
            queryClient.invalidateQueries({ queryKey: systemKeys.backups });
        },
        onError: error =>
            toast.error(getErrorMessage(error, 'Failed to delete backup.'), {
                id: 'backup-delete-error',
            }),
    });
}

export function useDownloadBackup() {
    return useMutation({
        mutationFn: (filename: string) =>
            systemService.downloadBackup(filename),
        onSuccess: (objectUrl, filename) => {
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(objectUrl);
        },
        onError: error =>
            toast.error(getErrorMessage(error, 'Download failed.'), {
                id: 'backup-download-error',
            }),
    });
}

export function useMigrateStorage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (target: 'media' | 's3') =>
            systemService.migrateStorage(target),
        onSuccess: res => {
            toast.success(
                res.message ?? 'Storage migration queued. You will be notified when complete.',
                { id: 'storage-migrate' }
            );
            queryClient.invalidateQueries({ queryKey: ['settings', 'general'] });
        },
        onError: error =>
            toast.error(
                getErrorMessage(error, 'Failed to queue storage migration.'),
                { id: 'storage-migrate-error' }
            ),
    });
}

export function useTestS3Connection() {
    return useMutation({
        mutationFn: () => systemService.testS3Connection(),
        onError: error =>
            toast.error(
                getErrorMessage(error, 'S3 connection test failed.'),
                { id: 'storage-test-s3-error' }
            ),
    });
}
