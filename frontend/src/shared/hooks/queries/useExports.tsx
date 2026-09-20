import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEcho } from '@laravel/echo-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';
import { exportService } from '@/services/exportService';
import type { ExportRecord, QueueExportPayload } from '@/shared/types';
import { useAppSelector } from '@/store';
import { selectAuthUser } from '@/store/slices/authSlice';
import { ROUTES } from '@/shared/routes';
import { Link } from 'react-router-dom';

/* Query Keys */
export const exportKeys = {
    all: ['exports'] as const,
    list: () => [...exportKeys.all, 'list'] as const,
};

/* Queries */
export function useExports() {
    return useQuery({
        queryKey: exportKeys.list(),
        queryFn: () => exportService.list(),
        staleTime: 1000 * 30,
        // ? Poll every 5 s while any export is pending/processing so the UI
        //   updates without requiring a manual refresh (broadcast is disabled).
        refetchInterval: query => {
            const records = query.state.data?.data ?? [];
            const hasActive = records.some(
                r => r.status === 'pending' || r.status === 'processing'
            );
            return hasActive ? 5_000 : false;
        },
    });
}

/* Mutations */
export function useQueueExport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: QueueExportPayload) =>
            exportService.queue(payload),
        onSuccess: () => {
            toast.success(
                'Export queued – you will be notified when it is ready.'
            );
            queryClient.invalidateQueries({ queryKey: exportKeys.list() });
        },
        onError: error => {
            toast.error(
                getErrorMessage(
                    error,
                    'Failed to queue export. Please try again.'
                )
            );
        },
    });
}

export function useDeleteExport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => exportService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: exportKeys.list() });
        },
    });
}

export function useDownloadExport() {
    return useMutation({
        mutationFn: async ({
            id,
            filename,
        }: {
            id: string;
            filename: string;
        }) => {
            const objectUrl = await exportService.download(id);
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(objectUrl);
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Download failed. Please try again.')
            );
        },
    });
}

/**
 * Queue an export and automatically trigger a browser download once the job
 * completes. Leverages the existing polling in useExports so no extra requests
 * are made beyond the shared query.
 */
export function useQueueAndDownloadExport() {
    const queryClient = useQueryClient();
    const [pendingId, setPendingId] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    // Shares the same cached + polling query - no duplicate requests.
    const { data: exportsData } = useExports();

    useEffect(() => {
        if (!pendingId) {
            return;
        }

        const readyRecord = (exportsData?.data ?? []).find(
            r => r.id === pendingId && r.status === 'ready'
        );

        if (!readyRecord) {
            return;
        }

        // ? Export is ready - clear pending state and trigger download
        exportService
            .download(readyRecord.id)
            .then(objectUrl => {
                const a = document.createElement('a');
                a.href = objectUrl;
                a.download =
                    readyRecord.filename ??
                    `${readyRecord.type}-export.${readyRecord.format}`;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(objectUrl);
                toast.success('Export downloaded!');
            })
            .catch(e =>
                toast.error(
                    getErrorMessage(e, 'Download failed. Please try again.')
                )
            )
            .finally(() => {
                setPendingId(null);
                setIsDownloading(false);
            });
    }, [exportsData, pendingId]);

    const mutation = useMutation({
        mutationFn: (payload: QueueExportPayload) =>
            exportService.queue(payload),
        onSuccess: data => {
            toast.success(
                'Exporting… your download will start automatically when ready.'
            );
            setPendingId(data.data.id);
            queryClient.invalidateQueries({ queryKey: exportKeys.list() });
        },
        onError: error => {
            toast.error(
                getErrorMessage(
                    error,
                    'Failed to queue export. Please try again.'
                )
            );
        },
    });

    return {
        mutate: mutation.mutate,
        /** True while the job is queued, processing, or file is downloading. */
        isPending: mutation.isPending || !!pendingId || isDownloading,
        /** True while the export job is still pending/processing on the server. */
        isWaiting: !!pendingId,
        isDownloading,
    };
}

/* Realtime (Reverb / Echo) */
/**
 * Subscribe to the private exports channel for the authenticated user.
 * When an ExportReady event is received, update the query cache and toast.
 * Channel auto-leaves on unmount via @laravel/echo-react.
 */
export function useExportListener(): void {
    const user = useAppSelector(selectAuthUser);
    const queryClient = useQueryClient();

    useEcho<{ export: ExportRecord }>(
        `exports.${user?.id ?? ''}`,
        '.ExportReady',
        data => {
            const label = data.export.filename ?? data.export.type ?? 'file';
            toast.success(
                <span>
                    Export ready: {label} -{' '}
                    <Link
                        to={ROUTES.DASHBOARD.EXPORTS.ROOT}
                        style={{
                            color: 'inherit',
                            fontWeight: 600,
                            textDecoration: 'underline',
                        }}
                    >
                        View Downloads
                    </Link>
                </span>,
                { id: `export-ready-${data.export.id}`, duration: 8000 }
            );

            // ? Update the cached list immediately without a round-trip refetch
            queryClient.setQueryData(
                exportKeys.list(),
                (old: { data: ExportRecord[] } | undefined) => {
                    if (!old) return old;

                    return {
                        ...old,
                        data: old.data.map(record =>
                            record.id === data.export.id ? data.export : record
                        ),
                    };
                }
            );
        },
        [user?.id, queryClient]
    );
}
