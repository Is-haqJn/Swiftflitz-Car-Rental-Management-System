import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Dropdown } from 'react-bootstrap';
import type { AppNotification, GenericFilters } from '@/shared/types';
import {
    useNotifications,
    useMarkAsRead,
    useMarkAsUnread,
    useMarkAllAsRead,
    useDeleteNotification,
    useDeleteAllRead,
} from '@/shared/hooks/queries/useNotifications';
import DataTable, { type Column } from '@adminComponents/DataTable';
import { SVGICON } from '@adminConstants/theme';
import { useConfirm } from '@/shared/hooks/useConfirm';
import { useTitle } from '@/shared/hooks';
import { ROUTES } from '@/shared/routes';
import { formatDateTime } from '@/shared/libs/utils';

export default function AllNotifications() {
    const title = useTitle('Notifications');
    const [filters, setFilters] = useState<GenericFilters>({ per_page: 20 });

    const { data: response, isLoading, isError } = useNotifications(filters);
    const markAsReadMutation = useMarkAsRead();
    const markAsUnreadMutation = useMarkAsUnread();
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

    const handleDelete = useCallback(
        async (n: AppNotification) => {
            const ok = await confirm({
                title: 'Delete notification?',
                message: `"${n.title}" will be permanently removed.`,
                confirmText: 'Delete',
                confirmVariant: 'danger',
            });
            if (ok) {
                deleteMutation.mutate(n.id);
            }
        },
        [confirm, deleteMutation]
    );

    const handleDeleteAllRead = useCallback(async () => {
        const ok = await confirm({
            title: 'Clear read notifications?',
            message: 'All read notifications will be permanently deleted.',
            confirmText: 'Clear',
            confirmVariant: 'danger',
        });
        if (ok) {
            deleteAllReadMutation.mutate();
        }
    }, [confirm, deleteAllReadMutation]);

    const columns: Column<AppNotification>[] = [
        {
            key: 'status',
            label: '',
            render: n => (
                <span
                    className={`d-inline-block rounded-circle ${n.read_at ? 'bg-secondary' : 'bg-primary'}`}
                    style={{ width: 8, height: 8 }}
                />
            ),
        },
        {
            key: 'title',
            label: 'Notification',
            render: n => (
                <div>
                    <div
                        className={`fw-semibold ${!n.read_at ? 'text-dark' : 'text-muted'}`}
                    >
                        {n.title}
                    </div>
                    <small className="text-muted">{n.message}</small>
                </div>
            ),
        },
        {
            key: 'type',
            label: 'Type',
            render: n => (
                <Badge bg="secondary" className="text-capitalize">
                    {n.type.split('.').pop()?.replace('_', ' ') ?? n.type}
                </Badge>
            ),
        },
        {
            key: 'read_at',
            label: 'Status',
            render: n => (
                <Badge
                    bg={n.read_at ? 'light' : 'primary'}
                    text={n.read_at ? 'secondary' : 'white'}
                >
                    {n.read_at ? 'Read' : 'Unread'}
                </Badge>
            ),
        },
        {
            key: 'date',
            label: 'Date',
            render: n => (
                <small className="text-muted">
                    {formatDateTime(n.created_at)}
                </small>
            ),
        },
        {
            key: 'actions',
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
                    <Dropdown.Menu
                        popperConfig={{ strategy: 'fixed' }}
                        renderOnMount
                    >
                        <Dropdown.Item
                            as={Link}
                            to={ROUTES.DASHBOARD.NOTIFICATIONS.VIEW(n.id)}
                        >
                            {SVGICON.eye} View
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        {!n.read_at && (
                            <Dropdown.Item
                                onClick={() => markAsReadMutation.mutate(n.id)}
                                disabled={markAsReadMutation.isPending}
                            >
                                {SVGICON.done} Mark as Read
                            </Dropdown.Item>
                        )}
                        {n.read_at && (
                            <Dropdown.Item
                                onClick={() =>
                                    markAsUnreadMutation.mutate(n.id)
                                }
                                disabled={markAsUnreadMutation.isPending}
                            >
                                {SVGICON.notification} Mark as Unread
                            </Dropdown.Item>
                        )}
                        <Dropdown.Divider />
                        <Dropdown.Item
                            className="text-danger"
                            onClick={() => handleDelete(n)}
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
                onClick={handleDeleteAllRead}
                disabled={deleteAllReadMutation.isPending}
            >
                Clear Read
            </Button>
        </div>
    );

    return (
        <>
            {title}
            <DataTable
                title="Notifications"
                data={notifications}
                columns={columns}
                meta={meta}
                isLoading={isLoading}
                isError={isError}
                onPageChange={handlePageChange}
                headerActions={headerActions}
                emptyTitle="No notifications"
                emptyMessage="You're all caught up!"
            />
        </>
    );
}
