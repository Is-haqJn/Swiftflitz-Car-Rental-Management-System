import { useState, useCallback, type ReactNode, useMemo } from 'react';
import { useAppSelector, useAppDispatch, persistor } from '@/store';
import { selectAuthUser } from '@/store/slices/authSlice';
import { clearActiveBranch } from '@/store/slices/activeBranchSlice';
import { Link } from 'react-router-dom';
import FilterBox from '@adminComponents/ui/FilterBox';
import { userService } from '@/services';
import { Form, Row, Col, Badge, InputGroup, Dropdown } from 'react-bootstrap';
import type { UserAccess } from '@/shared/types';
import {
    useUsers,
    useDeleteUser,
    useToggleUserActive,
    useImpersonateUser,
    userKeys,
} from '@/shared/hooks/queries/useUsers';
import { useBulkDelete } from '@/shared/hooks/queries/useBulkDelete';
import { SVGICON } from '@adminConstants/theme';
import DataTable, { type Column } from '@adminComponents/DataTable';
import type { GenericFilters } from '@/shared/types';
import { ROUTES } from '@/shared/routes';
import { formatRoleName, formatDate } from '@/shared/libs/utils';
import { tokenManager } from '@/shared/config/tokenManager';
import { PERMISSIONS } from '@/shared/config/permissions';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { useConfirm } from '@/shared/hooks/useConfirm';
import { FaUserShield } from 'react-icons/fa6';
import { useTitle } from '@/shared/hooks';

interface AllUsersProps {
    onAdd?: () => void;
}

export default function AllUsers({ onAdd }: AllUsersProps) {
    const title = useTitle('Users');
    const [filters, setFilters] = useState<GenericFilters>({ per_page: 15 });
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<UserAccess | null>(null);

    const currentUser = useAppSelector(selectAuthUser);
    const dispatch = useAppDispatch()();
    const { data: response, isLoading, isError } = useUsers(filters);
    const deleteMutation = useDeleteUser();
    const { bulkDelete, isBulkDeleting } = useBulkDelete({
        deleteFn: id => userService.delete(id),
        invalidateKeys: [userKeys.lists()],
        entityName: 'user',
        onSuccess: () => setSelectedIds([]),
    });
    const toggleActiveMutation = useToggleUserActive();
    const impersonateMutation = useImpersonateUser();
    const { confirm } = useConfirm();

    const handleImpersonate = useCallback(
        async (user: UserAccess) => {
            const ok = await confirm({
                title: 'Confirm Login As',
                message: `Log in as "${user.name}"? This will switch your active session.`,
                confirmText: 'Login As',
                cancelText: 'Cancel',
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
        },
        [impersonateMutation, confirm, currentUser, dispatch]
    );

    const users = useMemo<UserAccess[]>(() => response?.data ?? [], [response]);
    const meta = response?.meta ?? null;

    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }));
    }, []);

    const handleSearch = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            setFilters(prev => ({
                ...prev,
                search: search || undefined,
                page: 1,
            }));
        },
        [search]
    );

    const handleStatusFilter = useCallback((value: string) => {
        setFilters(prev => ({
            ...prev,
            'filter[is_active]':
                value === '' ? undefined : value === 'active' ? '1' : '0',
            page: 1,
        }));
    }, []);

    const handleClearFilters = useCallback(() => {
        setSearch('');
        setFilters({ per_page: 15 });
    }, []);

    const toggleSelectAll = useCallback(() => {
        setSelectedIds(prev =>
            prev.length === users.length ? [] : users.map(u => String(u.id))
        );
    }, [users]);

    const toggleOne = useCallback((id: string | number) => {
        setSelectedIds(prev =>
            prev.includes(String(id))
                ? prev.filter(x => x !== String(id))
                : [...prev, String(id)]
        );
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (!deleteTarget) return;
        deleteMutation.mutate(deleteTarget.id, {
            onSettled: () => setDeleteTarget(null),
        });
    }, [deleteTarget, deleteMutation]);

    const columns: Column<UserAccess>[] = [
        {
            key: 'user',
            label: 'User',
            render: user => (
                <div className="d-flex align-items-center gap-2">
                    {user.profile_photo_url ? (
                        <img
                            src={user.profile_photo_url}
                            alt={user.name}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                flexShrink: 0,
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                flexShrink: 0,
                                fontSize: 14,
                                fontWeight: 600,
                            }}
                            className="bg-secondary text-white d-flex align-items-center justify-content-center"
                        >
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <div className="fw-bold">{user.name}</div>
                        <small className="text-muted">{user.email}</small>
                    </div>
                </div>
            ),
        },
        {
            key: 'username',
            label: 'Username',
            render: user => (
                <span className="text-muted">@{user.username}</span>
            ),
        },
        {
            key: 'phone',
            label: 'Phone',
            render: user => <span>{user.phone ?? '-'}</span>,
        },
        {
            key: 'status',
            label: 'Status',
            render: user => (
                <Badge bg={user.is_active ? 'success' : 'secondary'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
        {
            key: 'last_login',
            label: 'Last Login',
            render: user => (
                <small className="text-muted">
                    {formatDate(user.last_login_at)}
                </small>
            ),
        },
        {
            key: 'roles',
            label: 'Roles',
            render: user => (
                <div className="d-flex flex-wrap gap-1">
                    {(user.roles ?? []).length === 0 ? (
                        <span className="text-muted small">-</span>
                    ) : (
                        (user.roles ?? []).map(role => (
                            <Badge key={role.id} bg="primary" className="small">
                                {formatRoleName(role.label ?? role.name)}
                            </Badge>
                        ))
                    )}
                </div>
            ),
        },
        {
            key: 'actions',
            label: 'Action',
            className: 'text-end',
            render: user => (
                <Dropdown align="end">
                    <Dropdown.Toggle
                        variant="light"
                        size="sm"
                        className="btn-xs"
                    >
                        Actions
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        <Dropdown.Item
                            as={Link}
                            to={ROUTES.DASHBOARD.USERS.VIEW(user.id)}
                        >
                            {SVGICON.eye} View
                        </Dropdown.Item>
                        <PermisssionGuard permission={PERMISSIONS.USERS.EDIT}>
                            <Dropdown.Item
                                as={Link}
                                to={ROUTES.DASHBOARD.USERS.EDIT(user.id)}
                            >
                                {SVGICON.pencil} Edit
                            </Dropdown.Item>
                        </PermisssionGuard>
                        <PermisssionGuard permission={PERMISSIONS.USERS.EDIT}>
                            <Dropdown.Item
                                onClick={() =>
                                    toggleActiveMutation.mutate(user.id)
                                }
                                disabled={toggleActiveMutation.isPending}
                            >
                                {user.is_active ? (
                                    <>{SVGICON.closeredcircle} Deactivate</>
                                ) : (
                                    <>{SVGICON.done} Activate</>
                                )}
                            </Dropdown.Item>
                        </PermisssionGuard>
                        <PermisssionGuard
                            permission={PERMISSIONS.USERS.IMPERSONATE}
                        >
                            <Dropdown.Item
                                onClick={() => handleImpersonate(user)}
                                disabled={impersonateMutation.isPending}
                            >
                                <FaUserShield className="me-1" /> Login As
                            </Dropdown.Item>
                        </PermisssionGuard>
                        <PermisssionGuard permission={PERMISSIONS.USERS.DELETE}>
                            <>
                                <Dropdown.Divider />
                                <Dropdown.Item
                                    className="text-danger"
                                    onClick={() => setDeleteTarget(user)}
                                >
                                    {SVGICON.trash} Delete
                                </Dropdown.Item>
                            </>
                        </PermisssionGuard>
                    </Dropdown.Menu>
                </Dropdown>
            ),
        },
    ];

    const headerActions: ReactNode = onAdd ? (
        <PermisssionGuard permission={PERMISSIONS.USERS.CREATE}>
            <button
                type="button"
                onClick={onAdd}
                className="btn btn-primary btn-sm"
            >
                {SVGICON.plus} Add User
            </button>
        </PermisssionGuard>
    ) : null;

    return (
        <>
            {title}
            {/* Filter Box */}
            <FilterBox title="Filter Users">
                <Form onSubmit={handleSearch}>
                    <Row className="g-3 align-items-end">
                        <Col md={5}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Search
                            </Form.Label>
                            <InputGroup>
                                <Form.Control
                                    placeholder="Name or email…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    Search
                                </button>
                            </InputGroup>
                        </Col>
                        <Col md={3}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Status
                            </Form.Label>
                            <Form.Select
                                className="tw:h-[2.9rem]"
                                onChange={e =>
                                    handleStatusFilter(e.target.value)
                                }
                                defaultValue=""
                            >
                                <option value="">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Per Page
                            </Form.Label>
                            <Form.Select
                                className="tw:h-[2.9rem]"
                                value={filters.per_page ?? 15}
                                onChange={e =>
                                    setFilters(prev => ({
                                        ...prev,
                                        per_page: Number(e.target.value),
                                        page: 1,
                                    }))
                                }
                            >
                                <option value={10}>10</option>
                                <option value={15}>15</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <button
                                type="button"
                                className="btn btn-outline-secondary w-100"
                                onClick={handleClearFilters}
                            >
                                Clear
                            </button>
                        </Col>
                    </Row>
                </Form>
            </FilterBox>

            {/* Data Table */}
            <DataTable
                title="All Users"
                data={users}
                columns={columns}
                meta={meta}
                isLoading={isLoading}
                isError={isError}
                selectedIds={selectedIds}
                onSelectAll={toggleSelectAll}
                onSelectOne={toggleOne}
                onBulkDelete={() => bulkDelete(selectedIds)}
                isBulkDeleting={isBulkDeleting}
                deleteTarget={deleteTarget}
                deleteTargetName={deleteTarget?.name}
                onDeleteRequest={setDeleteTarget}
                onDeleteConfirm={handleDeleteConfirm}
                onDeleteCancel={() => setDeleteTarget(null)}
                isDeleting={deleteMutation.isPending}
                onPageChange={handlePageChange}
                headerActions={headerActions}
                emptyTitle="No users found"
                emptyMessage="Add your first user or try a different search."
            />
        </>
    );
}
