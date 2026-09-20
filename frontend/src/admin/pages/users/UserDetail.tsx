import { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch, persistor } from '@/store';
import { selectAuthUser } from '@/store/slices/authSlice';
import { clearActiveBranch } from '@/store/slices/activeBranchSlice';
import { Row, Col, Card, Badge, Alert } from 'react-bootstrap';
import { DetailPageSkeleton } from '@adminComponents/skeletons/DetailPageSkeleton';
import {
    useUser,
    useDeleteUser,
    useToggleUserActive,
    useImpersonateUser,
} from '@/shared/hooks/queries/useUsers';
import { ROUTES } from '@/shared/routes';
import { SVGICON } from '@adminConstants/theme';
import {
    PERMISSION_GROUPS,
    PERMISSION_LABELS,
    PERMISSIONS,
} from '@/shared/config/permissions';
import { formatRoleName, formatDateTime } from '@/shared/libs/utils';
import { tokenManager } from '@/shared/config/tokenManager';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { useConfirm } from '@/shared/hooks/useConfirm';
import { useTitle } from '@/shared/hooks/useTitle';

/* Helpers */
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="d-flex align-items-start py-2 border-bottom">
            <span
                className="text-muted small"
                style={{ minWidth: 130, flexShrink: 0 }}
            >
                {label}
            </span>
            <span className="fw-semibold small">{value ?? '-'}</span>
        </div>
    );
}

/* Main Component */
export default function UserDetail() {
    const title = useTitle('User Details');
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const currentUser = useAppSelector(selectAuthUser);
    const dispatch = useAppDispatch()();
    const { data: userRes, isLoading, isError } = useUser(id!);
    const deleteMutation = useDeleteUser();
    const toggleActiveMutation = useToggleUserActive();
    const impersonateMutation = useImpersonateUser();
    const { confirm } = useConfirm();

    const user = userRes?.data;

    //? group effective permissions (already filtered by revoked_permissions on backend) by category
    const groupedPermissions = useMemo(() => {
        if (!user) return [];
        const allPerms = new Set(user.all_permissions ?? []);
        return PERMISSION_GROUPS.map(group => ({
            ...group,
            granted: group.permissions.filter(p => allPerms.has(p)),
        })).filter(g => g.granted.length > 0);
    }, [user]);

    const totalPermissions = user?.all_permissions?.length ?? 0;

    if (isLoading) {
        return <DetailPageSkeleton cards={2} />;
    }

    if (isError || !user) {
        return (
            <Alert variant="danger">User not found or failed to load.</Alert>
        );
    }

    const roles = user.roles ?? [];

    const handleDelete = async () => {
        // if (!confirm(`Delete user "${user.name}"? This cannot be undone.`))
        //     return;
        const ok = await confirm({
            title: 'Delete User?',
            message: `Are you sure you want to delete "${user.name}"? This action cannot be undone.`,
            confirmText: 'Delete',
            confirmVariant: 'danger',
        });
        if (!ok) return;

        deleteMutation.mutate(user.id, {
            onSuccess: () => navigate(ROUTES.DASHBOARD.USERS.ROOT),
        });
    };

    const handleImpersonate = async () => {
        const ok = await confirm({
            title: 'Impersonate User?',
            message: `Are you sure you want to impersonate "${user.name}"? This will switch your session to this user.`,
            confirmText: 'Impersonate',
            confirmVariant: 'primary',
        });
        if (!ok) return;

        impersonateMutation.mutate(user.id, {
            onSuccess: async res => {
                if (tokenManager.isTokenMode() && res?.token) {
                    tokenManager.startImpersonation(
                        res.token,
                        currentUser?.name
                    );
                }
                dispatch(clearActiveBranch());
                await persistor.flush();
                window.location.href = ROUTES.DASHBOARD.ROOT;
            },
        });
    };

    return (
        <div className="pb-4">
            {title}
            {/* Page header */}
            <div className="page-titles mb-4 d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div>
                    <h4 className="mb-1">{user.name}</h4>
                    <p className="text-muted mb-0 small">
                        User Details &nbsp;·&nbsp;
                        <span className="text-muted">#{user.id}</span>
                    </p>
                </div>
                <div className="d-flex flex-wrap gap-2">
                    <Link
                        to={ROUTES.DASHBOARD.USERS.ROOT}
                        className="btn btn-outline-secondary btn-sm"
                    >
                        ← All Users
                    </Link>
                    <PermisssionGuard permission={PERMISSIONS.USERS.EDIT}>
                        <Link
                            to={ROUTES.DASHBOARD.USERS.EDIT(user.id)}
                            className="btn btn-primary btn-sm"
                        >
                            {SVGICON.pencil} Edit
                        </Link>
                    </PermisssionGuard>

                    <PermisssionGuard permission={PERMISSIONS.USERS.EDIT}>
                        <button
                            type="button"
                            className={`btn btn-sm ${user.is_active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            onClick={() => toggleActiveMutation.mutate(user.id)}
                            disabled={toggleActiveMutation.isPending}
                        >
                            {toggleActiveMutation.isPending
                                ? '...'
                                : user.is_active
                                  ? 'Deactivate'
                                  : 'Activate'}
                        </button>
                    </PermisssionGuard>

                    <PermisssionGuard
                        permission={PERMISSIONS.USERS.IMPERSONATE}
                    >
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={handleImpersonate}
                            disabled={impersonateMutation.isPending}
                            title="Log in as this user"
                        >
                            {SVGICON.eye}{' '}
                            {impersonateMutation.isPending
                                ? 'Starting...'
                                : 'Login As'}
                        </button>
                    </PermisssionGuard>

                    <PermisssionGuard permission={PERMISSIONS.USERS.DELETE}>
                        <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                        >
                            {SVGICON.trash}{' '}
                            {deleteMutation.isPending
                                ? 'Deleting...'
                                : 'Delete'}
                        </button>
                    </PermisssionGuard>
                </div>
            </div>

            <Row className="g-3">
                {/* Left column: Profile + Account Info */}
                <Col lg={4}>
                    <Row>
                        <Col lg={12}>
                            {/* Profile card */}
                            <Card className="mb-3">
                                <Card.Body className="text-center pt-4 pb-3">
                                    {user.profile_photo_url ? (
                                        <img
                                            src={user.profile_photo_url}
                                            alt={user.name}
                                            className="rounded-circle mb-3 border"
                                            style={{
                                                width: 96,
                                                height: 96,
                                                objectFit: 'cover',
                                            }}
                                        />
                                    ) : (
                                        <div
                                            className="rounded-circle bg-primary d-inline-flex align-items-center justify-content-center text-white fw-bold mb-3"
                                            style={{
                                                width: 96,
                                                height: 96,
                                                fontSize: 36,
                                            }}
                                        >
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    <h5 className="mb-0 fw-semibold">
                                        {user.name}
                                    </h5>
                                    <p className="text-muted small mb-3">
                                        @{user.username}
                                    </p>

                                    <div className="d-flex justify-content-center gap-2 mb-3">
                                        <Badge
                                            bg={
                                                user.is_active
                                                    ? 'success'
                                                    : 'secondary'
                                            }
                                        >
                                            {user.is_active
                                                ? 'Active'
                                                : 'Inactive'}
                                        </Badge>
                                        <Badge
                                            bg={
                                                user.email_verified
                                                    ? 'success'
                                                    : 'warning'
                                            }
                                            text={
                                                user.email_verified
                                                    ? undefined
                                                    : 'dark'
                                            }
                                        >
                                            {user.email_verified
                                                ? 'Verified'
                                                : 'Unverified'}
                                        </Badge>
                                    </div>

                                    {/* Quick stats */}
                                    <Row className="g-0 text-center border-top pt-3">
                                        <Col xs={6} className="border-end">
                                            <div className="fw-bold fs-5 mb-0">
                                                {roles.length}
                                            </div>
                                            <div className="text-muted small">
                                                Roles
                                            </div>
                                        </Col>
                                        <Col xs={6}>
                                            <div className="fw-bold fs-5 mb-0">
                                                {totalPermissions}
                                            </div>
                                            <div className="text-muted small">
                                                Permissions
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col lg={12}>
                            {/* Account info */}
                            <Card>
                                <Card.Header>
                                    <Card.Title className="mb-0 fs-6">
                                        Account Info
                                    </Card.Title>
                                </Card.Header>
                                <Card.Body className="p-3">
                                    <InfoRow label="Email" value={user.email} />
                                    <InfoRow
                                        label="Phone"
                                        value={user.phone ?? '-'}
                                    />
                                    <InfoRow
                                        label="Last Login"
                                        value={formatDateTime(
                                            user.last_login_at
                                        )}
                                    />
                                    <InfoRow
                                        label="Member Since"
                                        value={formatDateTime(user.created_at)}
                                    />
                                    {user.branches &&
                                        user.branches.length > 0 && (
                                            <InfoRow
                                                label="Branches"
                                                value={
                                                    <div className="d-flex flex-wrap gap-1">
                                                        {user.branches.map(
                                                            branch => (
                                                                <Badge
                                                                    key={
                                                                        branch.id
                                                                    }
                                                                    bg="secondary"
                                                                    className="small"
                                                                >
                                                                    {
                                                                        branch.name
                                                                    }
                                                                </Badge>
                                                            )
                                                        )}
                                                    </div>
                                                }
                                            />
                                        )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Col>
                {/* Right column: Roles + Permissions */}
                <Col lg={8}>
                    <Row>
                        <Col lg={12}>
                            {/* Roles */}
                            <Card className="mb-3">
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center gap-2">
                                        <Card.Title className="mb-0 fs-6">
                                            Assigned Roles
                                        </Card.Title>
                                        <Badge
                                            bg={
                                                roles.length > 0
                                                    ? 'primary'
                                                    : 'secondary'
                                            }
                                        >
                                            {roles.length}
                                        </Badge>
                                    </div>
                                    <PermisssionGuard
                                        permission={
                                            PERMISSIONS.USERS.ASSIGN_ROLES
                                        }
                                    >
                                        <Link
                                            to={ROUTES.DASHBOARD.USERS.EDIT(
                                                user.id
                                            )}
                                            className="btn btn-sm btn-outline-primary"
                                        >
                                            Manage Roles
                                        </Link>
                                    </PermisssionGuard>
                                </Card.Header>
                                <Card.Body>
                                    {roles.length === 0 ? (
                                        <p className="text-muted small mb-0">
                                            No roles assigned to this user.
                                        </p>
                                    ) : (
                                        <div className="d-flex flex-wrap gap-2">
                                            {roles.map(role => (
                                                <div
                                                    key={role.id}
                                                    className="d-flex align-items-start gap-2 border rounded px-3 py-2"
                                                >
                                                    <div>
                                                        <div className="fw-semibold small">
                                                            {formatRoleName(
                                                                role.label ??
                                                                    role.name
                                                            )}
                                                        </div>
                                                        {role.permissions_count !==
                                                            undefined && (
                                                            <div
                                                                className="text-muted"
                                                                style={{
                                                                    fontSize: 11,
                                                                }}
                                                            >
                                                                {
                                                                    role.permissions_count
                                                                }{' '}
                                                                permission
                                                                {role.permissions_count !==
                                                                1
                                                                    ? 's'
                                                                    : ''}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={12}>
                            {/* Effective permissions grouped by category */}
                            <Card>
                                <Card.Header className="d-flex align-items-center gap-2">
                                    <Card.Title className="mb-0 fs-6">
                                        Effective Permissions
                                    </Card.Title>
                                    <Badge
                                        bg={
                                            totalPermissions > 0
                                                ? 'primary'
                                                : 'secondary'
                                        }
                                    >
                                        {totalPermissions}
                                    </Badge>
                                    <small className="text-muted">
                                        (effective)
                                    </small>
                                </Card.Header>
                                <Card.Body>
                                    {groupedPermissions.length === 0 ? (
                                        <p className="text-muted small mb-0">
                                            No permissions granted. Assign a
                                            role to grant access.
                                        </p>
                                    ) : (
                                        groupedPermissions.map(group => (
                                            <div
                                                key={group.name}
                                                className="mb-4"
                                            >
                                                <div className="d-flex align-items-center gap-2 mb-2 pb-1 border-bottom">
                                                    <span className="fw-semibold small">
                                                        {group.name}
                                                    </span>
                                                    <Badge
                                                        bg="primary"
                                                        className="small"
                                                    >
                                                        {group.granted.length}/
                                                        {
                                                            group.permissions
                                                                .length
                                                        }
                                                    </Badge>
                                                </div>
                                                <div className="d-flex flex-wrap gap-2">
                                                    {group.granted.map(perm => (
                                                        <Badge
                                                            key={perm}
                                                            bg="light"
                                                            text="dark"
                                                            className="border small"
                                                        >
                                                            {PERMISSION_LABELS[
                                                                perm
                                                            ] ?? perm}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </div>
    );
}
