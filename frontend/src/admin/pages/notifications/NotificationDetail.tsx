import { Fragment } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Alert, Badge, Button, Card } from 'react-bootstrap';
import { DetailPageSkeleton } from '@adminComponents/skeletons/DetailPageSkeleton';
import {
    useNotification,
    useMarkAsRead,
    useMarkAsUnread,
    useDeleteNotification,
} from '@/shared/hooks/queries/useNotifications';
import { ROUTES } from '@/shared/routes';
import { useConfirm } from '@/shared/hooks/useConfirm';
import { useTitle } from '@/shared/hooks';
import { formatDateTime } from '@/shared/libs/utils';

function TypeBadge({ type }: { type: string }) {
    const label = type.split('.').pop()?.replace(/_/g, ' ') ?? type;
    return (
        <Badge bg="secondary" className="text-capitalize">
            {label}
        </Badge>
    );
}

export default function NotificationDetail() {
    const title = useTitle('Notification Details');
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { confirm } = useConfirm();

    const { data: res, isLoading, isError } = useNotification(id ?? '');
    const markAsReadMutation = useMarkAsRead();
    const markAsUnreadMutation = useMarkAsUnread();
    const deleteMutation = useDeleteNotification();

    const notification = res?.data;

    if (isLoading) {
        return <DetailPageSkeleton cards={1} />;
    }

    if (isError || !notification) {
        return (
            <Fragment>
                <Alert variant="danger">Notification not found.</Alert>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                        navigate(ROUTES.DASHBOARD.NOTIFICATIONS.ROOT)
                    }
                >
                    Back to Notifications
                </Button>
            </Fragment>
        );
    }

    const handleDelete = async () => {
        const ok = await confirm({
            title: 'Delete notification?',
            message: `"${notification.title}" will be permanently removed.`,
            confirmText: 'Delete',
            confirmVariant: 'danger',
        });
        if (ok) {
            deleteMutation.mutate(notification.id, {
                onSuccess: () => navigate(ROUTES.DASHBOARD.NOTIFICATIONS.ROOT),
            });
        }
    };

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <div className="d-flex align-items-center gap-2">
                    <Link
                        to={ROUTES.DASHBOARD.NOTIFICATIONS.ROOT}
                        className="btn btn-light btn-sm"
                    >
                        ← Back
                    </Link>
                    <h4 className="mb-0">Notification Detail</h4>
                </div>
            </div>

            <Card>
                <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2">
                        <TypeBadge type={notification.type} />
                        <Badge
                            bg={notification.read_at ? 'light' : 'primary'}
                            text={notification.read_at ? 'secondary' : 'white'}
                        >
                            {notification.read_at ? 'Read' : 'Unread'}
                        </Badge>
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                        {!notification.read_at ? (
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() =>
                                    markAsReadMutation.mutate(notification.id)
                                }
                                disabled={markAsReadMutation.isPending}
                            >
                                {markAsReadMutation.isPending
                                    ? 'Marking…'
                                    : 'Mark as Read'}
                            </Button>
                        ) : (
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() =>
                                    markAsUnreadMutation.mutate(notification.id)
                                }
                                disabled={markAsUnreadMutation.isPending}
                            >
                                {markAsUnreadMutation.isPending
                                    ? 'Marking…'
                                    : 'Mark as Unread'}
                            </Button>
                        )}
                        <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                        >
                            Delete
                        </Button>
                    </div>
                </Card.Header>

                <Card.Body>
                    <h5 className="mb-1">{notification.title}</h5>
                    <p className="text-muted small mb-3">
                        {formatDateTime(notification.created_at)}
                        {notification.read_at && (
                            <span className="ms-2">
                                · Read {formatDateTime(notification.read_at)}
                            </span>
                        )}
                    </p>

                    <p className="mb-4">{notification.message}</p>

                    {notification.action_url && (
                        <Link
                            to={notification.action_url}
                            className="btn btn-primary btn-sm"
                        >
                            View Details →
                        </Link>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}
