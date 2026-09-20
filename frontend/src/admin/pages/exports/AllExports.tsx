import { useMemo } from 'react';
import { Badge, Button, Card, Spinner, Alert } from 'react-bootstrap';
import { SkeletonTableRows } from '@/shared/components/ui/Skeleton';
import { FiRefreshCw, FiFileText, FiDownload, FiTrash } from 'react-icons/fi';
import type { ExportRecord } from '@/shared/types';
import {
    useExports,
    useDeleteExport,
    useDownloadExport,
} from '@/shared/hooks/queries/useExports';
import { useConfirm } from '@/shared/hooks/useConfirm';
import DataTable, { type Column } from '@adminComponents/DataTable';
import { formatDateTime, formatBytes } from '@/shared/libs/utils';

const STATUS_VARIANT: Record<ExportRecord['status'], string> = {
    pending: 'warning',
    processing: 'info',
    ready: 'success',
    failed: 'danger',
};

/* Component */
export default function AllExports() {
    const { data: response, isLoading, isError, refetch } = useExports();
    const deleteMutation = useDeleteExport();
    const downloadMutation = useDownloadExport();
    const { confirm } = useConfirm();

    const records = useMemo<ExportRecord[]>(
        () => response?.data ?? [],
        [response]
    );

    const columns: Column<ExportRecord>[] = [
        {
            key: 'type',
            label: 'Type',
            render: r => (
                <span className="text-capitalize fw-semibold">{r.type}</span>
            ),
        },
        {
            key: 'format',
            label: 'Format',
            render: r => (
                <Badge
                    bg={r.format === 'pdf' ? 'danger' : 'success'}
                    className="text-uppercase"
                >
                    {r.format}
                </Badge>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: r => (
                <Badge
                    bg={STATUS_VARIANT[r.status]}
                    className="text-capitalize"
                >
                    {r.status === 'processing' && (
                        <Spinner
                            animation="border"
                            size="sm"
                            className="me-1"
                            style={{ width: 10, height: 10 }}
                        />
                    )}
                    {r.status}
                </Badge>
            ),
        },
        {
            key: 'filename',
            label: 'File',
            render: r => (
                <span className="text-muted small">{r.filename ?? '-'}</span>
            ),
        },
        {
            key: 'file_size',
            label: 'Size',
            render: r => formatBytes(r.file_size),
        },
        {
            key: 'expires_at',
            label: 'Expires',
            render: r => (
                <span className="text-muted small">
                    {formatDateTime(r.expires_at)}
                </span>
            ),
        },
        {
            key: 'created_at',
            label: 'Requested',
            render: r => (
                <span className="text-muted small">
                    {formatDateTime(r.created_at)}
                </span>
            ),
        },
        {
            key: 'id',
            label: 'Actions',
            render: r => (
                <div className="d-flex gap-2">
                    {r.status === 'ready' && (
                        <Button
                            variant="outline-primary"
                            size="sm"
                            disabled={
                                downloadMutation.isPending &&
                                downloadMutation.variables?.id === r.id
                            }
                            onClick={async () => {
                                const ok = await confirm({
                                    title: 'Download export?',
                                    message: `Download "${r.filename ?? `${r.type}-export.${r.format}`}"?`,
                                    confirmText: 'Download',
                                    confirmVariant: 'primary',
                                });
                                if (ok) {
                                    downloadMutation.mutate({
                                        id: r.id,
                                        filename:
                                            r.filename ??
                                            `${r.type}-export.${r.format}`,
                                    });
                                }
                            }}
                        >
                            {downloadMutation.isPending &&
                            downloadMutation.variables?.id === r.id ? (
                                <Spinner
                                    animation="border"
                                    size="sm"
                                    className="me-1"
                                    style={{ width: 12, height: 12 }}
                                />
                            ) : (
                                <FiDownload className="me-1" />
                            )}
                            Download
                        </Button>
                    )}
                    <Button
                        variant="outline-danger"
                        size="sm"
                        disabled={deleteMutation.isPending}
                        onClick={async () => {
                            const ok = await confirm({
                                title: 'Delete export?',
                                message:
                                    'This file will be permanently removed. This cannot be undone.',
                                confirmText: 'Delete',
                                confirmVariant: 'danger',
                            });
                            if (ok) deleteMutation.mutate(r.id);
                        }}
                    >
                        <FiTrash className="me-1" />
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="pb-4">
            <div className="page-titles mb-3 d-flex justify-content-between align-items-center">
                <div>
                    <h4>Exports</h4>
                    <p className="text-muted mb-0">
                        Download your queued export files here. Files expire
                        after 24 hours.
                    </p>
                </div>
                <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => void refetch()}
                    disabled={isLoading}
                >
                    <FiRefreshCw className="me-1" />
                    Refresh
                </Button>
            </div>

            <Card>
                <Card.Body>
                    {isLoading ? (
                        <table className="table mb-0">
                            <tbody>
                                <SkeletonTableRows rows={5} cols={5} />
                            </tbody>
                        </table>
                    ) : isError ? (
                        <Alert variant="danger">
                            Failed to load exports. Please try again.
                        </Alert>
                    ) : records.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <FiFileText
                                size={48}
                                className="d-block mx-auto mb-3 text-muted opacity-50"
                            />
                            No exports yet. Head to any list page and click{' '}
                            <strong>Export</strong> to generate a file.
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={records}
                            title={''}
                        />
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}
