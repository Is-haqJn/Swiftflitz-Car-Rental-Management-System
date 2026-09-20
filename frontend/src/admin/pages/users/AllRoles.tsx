import { useState, useCallback, type ReactNode, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Role } from '@/shared/types';
import { useRoles, useDeleteRole } from '@/shared/hooks/queries/useUsers';
import { SVGICON } from '@adminConstants/theme';
import DataTable, { type Column } from '@adminComponents/DataTable';
import { Dropdown, Badge } from 'react-bootstrap';
import { formatRoleName } from '@/shared/libs/utils';
import { ROUTES } from '@/shared/routes';
import { PERMISSION_LABELS } from '@/shared/config/permissions';
import { PERMISSIONS } from '@/shared/config/permissions';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { useTitle } from '@/shared/hooks';

export default function AllRoles() {
    const title = useTitle('Roles');
    const navigate = useNavigate();
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

    const { data: response, isLoading, isError } = useRoles();
    const deleteMutation = useDeleteRole();

    const roles = useMemo<Role[]>(() => {
        const raw = response?.data;
        if (!raw) return [];
        return Array.isArray(raw) ? raw : [];
    }, [response]);

    const toggleSelectAll = useCallback(() => {
        setSelectedIds(prev =>
            prev.length === roles.length ? [] : roles.map(r => r.id)
        );
    }, [roles]);

    const toggleOne = useCallback((id: string | number) => {
        const numId = Number(id);
        setSelectedIds(prev =>
            prev.includes(numId)
                ? prev.filter(x => x !== numId)
                : [...prev, numId]
        );
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (!deleteTarget) return;
        deleteMutation.mutate(deleteTarget.id, {
            onSettled: () => setDeleteTarget(null),
        });
    }, [deleteTarget, deleteMutation]);

    const openCreate = useCallback(() => {
        navigate(ROUTES.DASHBOARD.USERS.CREATE_ROLE);
    }, [navigate]);

    const openEdit = useCallback(
        (role: Role) => {
            navigate(ROUTES.DASHBOARD.USERS.EDIT_ROLE(role.id));
        },
        [navigate]
    );

    const columns: Column<Role>[] = [
        {
            key: 'name',
            label: 'Role Name',
            render: role => (
                <span className="fw-semibold">
                    {formatRoleName(role.label ?? role.name)}
                    {role.is_system && (
                        <Badge bg="secondary" className="ms-2 small">
                            System
                        </Badge>
                    )}
                </span>
            ),
        },
        {
            key: 'description',
            label: 'Description',
            render: role => (
                <span className="text-muted small">
                    {role.description ?? (
                        <em className="text-muted">No description</em>
                    )}
                </span>
            ),
        },
        {
            key: 'permissions',
            label: 'Permissions',
            render: role => {
                const perms = role.permissions ?? [];
                const total = role.permissions_count ?? perms.length;
                const visible = perms.slice(0, 2);
                const overflow = total - visible.length;
                return (
                    <div>
                        <small className="text-muted d-block mb-1">
                            {total} permissions
                        </small>
                        <div className="d-flex flex-wrap gap-1">
                            {visible.map(p => (
                                <Badge
                                    key={p.name}
                                    bg="light"
                                    text="dark"
                                    className="border small fw-normal"
                                >
                                    {PERMISSION_LABELS[p.name] ?? p.name}
                                </Badge>
                            ))}
                            {overflow > 0 && (
                                <Badge bg="secondary" className="small">
                                    +{overflow} more
                                </Badge>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'actions',
            label: 'Action',
            className: 'text-end',
            render: role => (
                <Dropdown align="end">
                    <Dropdown.Toggle
                        variant="light"
                        size="sm"
                        className="btn-xs"
                    >
                        Actions
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        <PermisssionGuard permission={PERMISSIONS.ROLES.EDIT}>
                            <Dropdown.Item onClick={() => openEdit(role)}>
                                {SVGICON.pencil} Edit
                            </Dropdown.Item>
                        </PermisssionGuard>
                        {!role.is_system && (
                            <PermisssionGuard
                                permission={PERMISSIONS.ROLES.DELETE}
                            >
                                <>
                                    <Dropdown.Divider />
                                    <Dropdown.Item
                                        className="text-danger"
                                        onClick={() => setDeleteTarget(role)}
                                    >
                                        {SVGICON.trash} Delete
                                    </Dropdown.Item>
                                </>
                            </PermisssionGuard>
                        )}
                    </Dropdown.Menu>
                </Dropdown>
            ),
        },
    ];

    const headerActions: ReactNode = (
        <PermisssionGuard permission={PERMISSIONS.ROLES.CREATE}>
            <button
                type="button"
                onClick={openCreate}
                className="btn btn-primary btn-sm"
            >
                {SVGICON.plus} Add Role
            </button>
        </PermisssionGuard>
    );

    return (
        <>
            {title}
            <DataTable
                title="Roles & Permissions"
                data={roles}
                columns={columns}
                meta={null}
                isLoading={isLoading}
                isError={isError}
                selectedIds={selectedIds}
                onSelectAll={toggleSelectAll}
                onSelectOne={toggleOne}
                deleteTarget={deleteTarget}
                deleteTargetName={deleteTarget?.name}
                onDeleteRequest={setDeleteTarget}
                onDeleteConfirm={handleDeleteConfirm}
                onDeleteCancel={() => setDeleteTarget(null)}
                isDeleting={deleteMutation.isPending}
                headerActions={headerActions}
                emptyTitle="No roles found"
                emptyMessage="Create your first role to assign permissions."
            />
        </>
    );
}
