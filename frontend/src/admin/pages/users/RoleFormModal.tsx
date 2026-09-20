import { useMemo, useState } from 'react';
import {
    Modal,
    Form,
    Button,
    Spinner,
    Badge,
    Accordion,
} from 'react-bootstrap';
import type { Role } from '@/shared/types';
import {
    useCreateRole,
    useUpdateRole,
    useRolePermissions,
} from '@/shared/hooks/queries/useUsers';
import {
    PERMISSION_GROUPS,
    PERMISSION_LABELS,
} from '@/shared/config/permissions';
import { usePermission } from '@/shared/hooks';

/** Permissions only super admins can assign - hidden from admin/manager editors */
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
];

interface RoleFormModalProps {
    show: boolean;
    role?: Role | null;
    onHide: () => void;
}

export default function RoleFormModal({
    show,
    role,
    onHide,
}: RoleFormModalProps) {
    const isEdit = !!role;

    const { isLoading: permLoading } = useRolePermissions();
    const createMutation = useCreateRole();
    const updateMutation = useUpdateRole();
    const { isSuperAdmin } = usePermission();

    const [name, setName] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
        []
    );

    /* Strip super-admin-only perms for non-super-admin callers */
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

    // Pre-populate when editing
    if (show) {
        setName(role?.name ?? '');
        setSelectedPermissions(role?.permissions?.map(p => p.name) ?? []);
    }

    const isPending = createMutation.isPending || updateMutation.isPending;

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

        if (isEdit && role) {
            updateMutation.mutate(
                {
                    id: role.name,
                    payload: { name, permissions: selectedPermissions },
                },
                { onSuccess: onHide }
            );
        } else {
            createMutation.mutate(
                { name: name.trim(), permissions: selectedPermissions },
                { onSuccess: onHide }
            );
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>
                    {isEdit ? `Edit Role: ${role?.name}` : 'Create Role'}
                </Modal.Title>
            </Modal.Header>

            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {/* Role Name */}
                    <Form.Group className="mb-4">
                        <Form.Label>
                            Role Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. manager, staff, viewer"
                            required
                        />
                    </Form.Group>

                    {/* Permissions */}
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <Form.Label className="mb-0">Permissions</Form.Label>
                        <div className="d-flex gap-2">
                            <Badge bg="secondary">
                                {selectedPermissions.length} selected
                            </Badge>
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
                    </div>

                    {permLoading ? (
                        <div className="text-center py-3">
                            <Spinner animation="border" size="sm" />
                        </div>
                    ) : (
                        <Accordion>
                            {filteredGroups.map((group, idx) => {
                                const groupPerms = group.permissions;
                                const selectedInGroup = groupPerms.filter(p =>
                                    selectedPermissions.includes(p)
                                ).length;
                                const allSelected =
                                    selectedInGroup === groupPerms.length;

                                return (
                                    <Accordion.Item
                                        eventKey={String(idx)}
                                        key={group.name}
                                    >
                                        <Accordion.Header>
                                            <div className="d-flex align-items-center gap-2 w-100 me-3">
                                                <span className="fw-semibold">
                                                    {group.name}
                                                </span>
                                                <Badge
                                                    bg={
                                                        selectedInGroup > 0
                                                            ? 'primary'
                                                            : 'secondary'
                                                    }
                                                    className="ms-2"
                                                >
                                                    {selectedInGroup}/
                                                    {groupPerms.length}
                                                </Badge>
                                            </div>
                                        </Accordion.Header>
                                        <Accordion.Body>
                                            <div className="mb-2">
                                                <Form.Check
                                                    type="checkbox"
                                                    label={
                                                        <strong>
                                                            {allSelected
                                                                ? 'Deselect all'
                                                                : 'Select all'}
                                                        </strong>
                                                    }
                                                    checked={allSelected}
                                                    onChange={() =>
                                                        toggleGroup(groupPerms)
                                                    }
                                                />
                                            </div>
                                            <div className="ms-3 d-flex flex-wrap gap-2">
                                                {groupPerms.map(perm => (
                                                    <div
                                                        key={perm}
                                                        className="form-check"
                                                        style={{
                                                            minWidth: '240px',
                                                        }}
                                                    >
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id={`perm-${perm}`}
                                                            checked={selectedPermissions.includes(
                                                                perm
                                                            )}
                                                            onChange={() =>
                                                                togglePermission(
                                                                    perm
                                                                )
                                                            }
                                                        />
                                                        <label
                                                            className="form-check-label small"
                                                            htmlFor={`perm-${perm}`}
                                                        >
                                                            {PERMISSION_LABELS[
                                                                perm
                                                            ] ?? perm}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </Accordion.Body>
                                    </Accordion.Item>
                                );
                            })}
                        </Accordion>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="outline-secondary"
                        onClick={onHide}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={isPending || !name.trim()}
                    >
                        {isPending
                            ? 'Saving...'
                            : isEdit
                              ? 'Save Changes'
                              : 'Create Role'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
