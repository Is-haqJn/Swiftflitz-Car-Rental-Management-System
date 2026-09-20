import { useState, useCallback, useMemo } from 'react';
import { Badge, Button, Dropdown } from 'react-bootstrap';
import type { AppNotification, GenericFilters } from '@/shared/types';
import {
    useNotifications,
    useMarkAsRead,
    useMarkAllAsRead,
    useDeleteNotification,
    useDeleteAllRead,
} from '@/shared/hooks/queries/useNotifications';
import DataTable, { type Column } from '@adminComponents/DataTable';
import { SVGICON } from '@adminConstants/theme';
import { useConfirm } from '@/shared/hooks/useConfirm';
import { formatDateTime } from '@/shared/libs/utils';

interface FilteredNotificationPageProps {
    title: string;
    subtitle: string;
    typeFilter: string;
    emptyMessage?: string;
}

export default function FilteredNotificationPage({
    title,
    subtitle,
    typeFilter,
    emptyMessage = 'No notifications found.',
}: FilteredNotificationPageProps) {
    const [filters, setFilters] = useState<GenericFilters>({
        per_page: 20,
        'filter[type]': typeFilter,
    });

    const { data: response, isLoading, isError } = useNotifications(filters);
    const markAsReadMutation = useMarkAsRead();
    const markAllAsReadMutation = useMarkAllAsRead();
    const deleteMutation = useDeleteNotification();
    const deleteAllReadMutation = useDeleteAllRead();
    const { confirm } = useConfirm();

    const notifications = useMemo<AppNotification[]>(
        () => response?.data ?? [],
        [response]
    );
    const meta = response?.meta ?? null;

    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }));
    }, []);

    const handleDeleteAllRead = async () => {
        const ok = await confirm({
            title: 'Clear all read?',
            message:
                'This will permanently delete all read notifications in this category.',
            confirmText: 'Clear',
            confirmVariant: 'danger',
        });
        if (ok) deleteAllReadMutation.mutate();
    };

    const columns: Column<AppNotification>[] = [
        {
            key: 'status',
            label: '',
            render: n => (
                <span
                    className="d-inline-block rounded-circle"
                    style={{
                        width: 8,
                        height: 8,
                        background: n.read_at ? '#adb5bd' : '#0d6efd',
                    }}
                />
            ),
        },
        {
            key: 'title',
            label: 'Notification',
            render: n => (
                <div>
                    <div className={`mb-0 ${!n.read_at ? 'fw-semibold' : ''}`}>
                        {n.title}
                    </div>
                    <small className="text-muted">{n.message}</small>
                </div>
            ),
        },
        {
            key: 'read_at',
            label: 'Status',
            render: n => (
                <Badge bg={n.read_at ? 'secondary' : 'primary'}>
                    {n.read_at ? 'Read' : 'Unread'}
                </Badge>
            ),
        },
        {
            key: 'created_at',
            label: 'Date',
            render: n => (
                <small className="text-muted">
                    {formatDateTime(n.created_at)}
                </small>
            ),
        },
        {
            key: 'id',
            label: 'Action',
            className: 'text-end',
            render: n => (
                <Dropdown align="end">
                    <Dropdown.Toggle
                        variant="light"
                        size="sm"
                        className="btn-xs"
                    >
                        Actions
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        {!n.read_at && (
                            <Dropdown.Item
                                onClick={() => markAsReadMutation.mutate(n.id)}
                                disabled={markAsReadMutation.isPending}
                            >
                                {SVGICON.done} Mark as Read
                            </Dropdown.Item>
                        )}
                        <Dropdown.Divider />
                        <Dropdown.Item
                            className="text-danger"
                            onClick={() => deleteMutation.mutate(n.id)}
                            disabled={deleteMutation.isPending}
                        >
                            {SVGICON.trash} Delete
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            ),
        },
    ];

    const headerActions = (
        <div className="d-flex gap-2">
            <Button
                variant="outline-primary"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
            >
                Mark All Read
            </Button>
            <Button
                variant="outline-danger"
                size="sm"
                onClick={() => void handleDeleteAllRead()}
                disabled={deleteAllReadMutation.isPending}
            >
                Clear Read
            </Button>
        </div>
    );

    return (
        <div>
            <div className="page-titles mb-3">
                <h4>{title}</h4>
                <p className="text-muted mb-0">{subtitle}</p>
            </div>

            <DataTable
                title=""
                data={notifications}
                columns={columns}
                meta={meta}
                isLoading={isLoading}
                isError={isError}
                onPageChange={handlePageChange}
                headerActions={headerActions}
                emptyTitle="No notifications"
                emptyMessage={emptyMessage}
            />
        </div>
    );
}
