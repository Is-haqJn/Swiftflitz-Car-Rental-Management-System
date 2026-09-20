import { useMemo, useState } from 'react';
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Form,
    Row,
    Spinner,
} from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useNavigate, useParams } from 'react-router-dom';
import { usePermission } from '@/shared/hooks';
import { useUpdateRole, useRoles } from '@/shared/hooks/queries/useUsers';
import {
    PERMISSION_GROUPS,
    PERMISSION_LABELS,
} from '@/shared/config/permissions';
import { ROUTES } from '@/shared/routes';
import { formatRoleName } from '@/shared/libs/utils';
import type { Role } from '@/shared/types';

/** Permissions visible only to super admins - hidden when editing roles as non-super-admin */
const SUPER_ADMIN_ONLY_PERMS = [
    'settings.view_backup',
    'settings.manage_backup',
    'settings.edit_backup',
    'settings.delete_backup',
    'settings.view_logs',
    'settings.clear_cache',
    'settings.edit_whatsapp',
    'settings.edit_sms',
    'settings.edit_payment',
    'users.impersonate',
    'settings.test_email',
    'settings.test_whatsapp',
    'settings.test_sms',
    'settings.view_seo',
    'settings.edit_seo',
];

/* Inner form - receives role as a required prop so state initialises directly */
function EditRoleForm({ role }: { role: Role }) {
    const navigate = useNavigate();
    const updateMutation = useUpdateRole();
    const { isSuperAdmin } = usePermission();

    const [name, setName] = useState(role.name);
    const [description, setDescription] = useState(role.description ?? '');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
        () => role.permissions?.map(p => p.name) ?? []
    );

    const isPending = updateMutation.isPending;

    /** Strip backup/super-admin-only perms for non-super-admin callers */
    const filteredGroups = useMemo(
        () =>
            PERMISSION_GROUPS.map(group => ({
                ...group,
                permissions: isSuperAdmin()
                    ? group.permissions
                    : group.permissions.filter(
                          p => !SUPER_ADMIN_ONLY_PERMS.includes(p)
                      ),
            })).filter(g => g.permissions.length > 0),
        [isSuperAdmin]
    );

    const togglePermission = (perm: string) => {
        setSelectedPermissions(prev =>
            prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
        );
    };

    const toggleGroup = (groupPermissions: string[]) => {
        const allSelected = groupPermissions.every(p =>
            selectedPermissions.includes(p)
        );
        if (allSelected) {
            setSelectedPermissions(prev =>
                prev.filter(p => !groupPermissions.includes(p))
            );
        } else {
            setSelectedPermissions(prev => [
                ...prev,
                ...groupPermissions.filter(p => !prev.includes(p)),
            ]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        updateMutation.mutate(
            {
                id: role.name,
                payload: {
                    name,
                    description: description.trim() || undefined,
                    permissions: selectedPermissions,
                },
            },
            { onSuccess: () => navigate(ROUTES.DASHBOARD.USERS.ROLES) }
        );
    };

    return (
        <div className="pb-4">
            <div className="page-titles mb-3 d-flex justify-content-between align-items-start">
                <div>
                    <h4>
                        Edit Role: {formatRoleName(role.label ?? role.name)}
                    </h4>
                    <p className="text-muted mb-0">
                        Update role details and permissions.
                    </p>
                </div>
                <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => navigate(ROUTES.DASHBOARD.USERS.ROLES)}
                >
                    Back to Roles
                </Button>
            </div>

            {role.is_system && (
                <Alert variant="info" className="mb-3">
                    This is a system role. Role name changes may have limited
                    effect.
                </Alert>
            )}

            <Form onSubmit={handleSubmit}>
                {/* Section 1: Role Details */}
                <Card className="mb-4">
                    <Card.Header>
                        <Card.Title className="mb-0">Role Details</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>
                                        Role Name{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        disabled={role.is_system}
                                        required
                                    />
                                    {role.is_system && (
                                        <Form.Text className="text-muted">
                                            System role names cannot be changed.
                                        </Form.Text>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        // as="textarea"
                                        // rows={1}
                                        value={description}
                                        onChange={e =>
                                            setDescription(e.target.value)
                                        }
                                        placeholder="Optional description of this role..."
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Section 2: Permissions Grid */}
                <Card className="mb-4">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2">
                            <Card.Title className="mb-0">
                                Permissions
                            </Card.Title>
                            <Badge
                                bg={
                                    selectedPermissions.length > 0
                                        ? 'primary'
                                        : 'secondary'
                                }
                            >
                                {selectedPermissions.length} selected
                            </Badge>
                        </div>
                        <div className="d-flex gap-2">
                            <button
                                type="button"
                                className="btn btn-link btn-sm p-0 text-primary"
                                onClick={() =>
                                    setSelectedPermissions(
                                        filteredGroups.flatMap(
                                            g => g.permissions
                                        )
                                    )
                                }
                            >
                                Select all
                            </button>
                            <button
                                type="button"
                                className="btn btn-link btn-sm p-0 text-muted"
                                onClick={() => setSelectedPermissions([])}
                            >
                                Clear all
                            </button>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        {filteredGroups.map(group => {
                            const groupPerms = group.permissions;
                            const selectedInGroup = groupPerms.filter(p =>
                                selectedPermissions.includes(p)
                            ).length;
                            const allSelected =
                                selectedInGroup === groupPerms.length;

                            return (
                                <div key={group.name} className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom">
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="fw-semibold">
                                                {group.name}
                                            </span>
                                            <Badge
                                                bg={
                                                    selectedInGroup > 0
                                                        ? 'primary'
                                                        : 'secondary'
                                                }
                                                className="small"
                                            >
                                                {selectedInGroup}/
                                                {groupPerms.length}
                                            </Badge>
                                        </div>
                                        <Form.Check
                                            type="checkbox"
                                            id={`group-all-${group.name}`}
                                            label={
                                                <small className="text-muted">
                                                    {allSelected
                                                        ? 'Deselect all'
                                                        : 'Select all'}
                                                </small>
                                            }
                                            checked={allSelected}
                                            onChange={() =>
                                                toggleGroup(groupPerms)
                                            }
                                        />
                                    </div>
                                    <Row className="g-2">
                                        {groupPerms.map(perm => (
                                            <Col key={perm} md={4} xl={3}>
                                                <Form.Check
                                                    type="checkbox"
                                                    id={`perm-${perm}`}
                                                    label={
                                                        <span className="small">
                                                            {PERMISSION_LABELS[
                                                                perm
                                                            ] ?? perm}
                                                        </span>
                                                    }
                                                    checked={selectedPermissions.includes(
                                                        perm
                                                    )}
                                                    onChange={() =>
                                                        togglePermission(perm)
                                                    }
                                                />
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                            );
                        })}
                    </Card.Body>
                </Card>

                <div className="d-flex justify-content-end gap-2">
                    <Button
                        variant="outline-secondary"
                        onClick={() => navigate(ROUTES.DASHBOARD.USERS.ROLES)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={isPending || !name.trim()}
                    >
                        {isPending ? (
                            <>
                                <Spinner
                                    animation="border"
                                    size="sm"
                                    className="me-1"
                                />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </Button>
                </div>
            </Form>
        </div>
    );
}

/* Outer shell - handles data fetching and loading/not-found states */
export default function EditRole() {
    const { id } = useParams<{ id: string }>();
    const { data: rolesRes, isLoading } = useRoles();

    const roles = rolesRes?.data ?? [];
    const role = Array.isArray(roles)
        ? roles.find(r => String(r.id) === id)
        : undefined;

    if (isLoading) {
        return <SettingsFormSkeleton cards={2} />;
    }

    if (!role) {
        return <Alert variant="danger">Role not found.</Alert>;
    }

    // key={role.id} ensures EditRoleForm re-mounts (and resets state) if the
    // user navigates from one edit page directly to another.
    return <EditRoleForm key={role.id} role={role} />;
}
