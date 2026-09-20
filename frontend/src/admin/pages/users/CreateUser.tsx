import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Badge,
    Card,
    Form,
    Row,
    Col,
    Button,
    Spinner,
    Alert,
} from 'react-bootstrap';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import {
    useCreateUser,
    useAvailableRoles,
    useAssignUserBranches,
} from '@/shared/hooks/queries/useUsers';
import { useActiveBranches } from '@/shared/hooks/queries/useBranches';
import { formatRoleName, applyServerErrors } from '@/shared/libs/utils';
import {
    createUserSchema,
    type CreateUserFormData,
} from '@/shared/libs/validations';
import type { Role } from '@/shared/types';
import { ROUTES } from '@/shared/routes';
import { usePermission, useTitle } from '@/shared/hooks';
import {
    PERMISSION_GROUPS,
    PERMISSION_LABELS,
} from '@/shared/config/permissions';

const SUPER_ADMIN_ONLY_PERMS = [
    'settings.view_backup',
    'settings.manage_backup',
    'settings.edit_backup',
    'settings.delete_backup',
    'settings.view_logs',
    'settings.clear_cache',
    'users.impersonate',
];

export default function CreateUser() {
    const title = useTitle('Add User');
    const navigate = useNavigate();
    const { isSuperAdmin } = usePermission();
    const createMutation = useCreateUser();
    const assignBranchesMutation = useAssignUserBranches();
    const { data: rolesRes, isLoading: rolesLoading } = useAvailableRoles();
    const { data: branchesRes } = useActiveBranches();
    const activeBranches = branchesRes?.data ?? [];
    const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);

    const availableRoles = useMemo<Role[]>(
        () => rolesRes?.data ?? [],
        [rolesRes?.data]
    );

    //? filter out super-admin-only permissions if current user is not super admin
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

    const {
        register,
        handleSubmit,
        control,
        setError,
        formState: { errors },
    } = useForm<CreateUserFormData>({
        resolver: zodResolver(createUserSchema),
        defaultValues: { roles: [], is_active: true },
    });

    const [checkedPermissions, setCheckedPermissions] = useState<string[]>([]);
    const prevRolePermsRef = useRef<string[]>([]);

    const watchedRoles = useWatch({ control, name: 'roles', defaultValue: [] });
    const selectedRoles = useMemo(() => watchedRoles ?? [], [watchedRoles]);

    //? derive permissions from the currently selected roles
    const rolePermissions = useMemo(() => {
        const perms = new Set<string>();
        selectedRoles.forEach(roleName => {
            const matched = availableRoles.find(r => r.name === roleName);
            matched?.permissions?.forEach(p => perms.add(p.name));
        });
        return [...perms];
    }, [selectedRoles, availableRoles]);

    // Sync role permission changes into checkedPermissions
    useEffect(() => {
        const prev = new Set(prevRolePermsRef.current);
        const curr = new Set(rolePermissions);
        const added = rolePermissions.filter(p => !prev.has(p));
        const removed = prevRolePermsRef.current.filter(p => !curr.has(p));
        if (added.length > 0 || removed.length > 0) {
            setCheckedPermissions(prevChecked => {
                const result = new Set(prevChecked);
                added.forEach(p => result.add(p));
                removed.forEach(p => result.delete(p));
                return [...result];
            });
        }
        prevRolePermsRef.current = rolePermissions;
    }, [rolePermissions]);

    const togglePermission = (perm: string) => {
        setCheckedPermissions(prev =>
            prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
        );
    };

    const toggleGroup = (groupPermissions: string[]) => {
        const allSelected = groupPermissions.every(p =>
            checkedPermissions.includes(p)
        );
        if (allSelected) {
            setCheckedPermissions(prev =>
                prev.filter(p => !groupPermissions.includes(p))
            );
        } else {
            setCheckedPermissions(prev => [
                ...prev,
                ...groupPermissions.filter(p => !prev.includes(p)),
            ]);
        }
    };

    const onSubmit = (data: CreateUserFormData) => {
        const payload = {
            ...data,
            roles: data.roles ?? [],
            permissions: checkedPermissions,
            username: data.username || undefined,
            password: data.password || '',
            password_confirmation: data.password_confirmation || '',
        };
        createMutation.mutate(payload, {
            onSuccess: res => {
                const userId = String(
                    (res as { data?: { id?: string | number } })?.data?.id ?? ''
                );
                if (userId && selectedBranchIds.length > 0) {
                    assignBranchesMutation.mutate(
                        { id: userId, branchIds: selectedBranchIds },
                        {
                            onSettled: () =>
                                navigate(ROUTES.DASHBOARD.USERS.ROOT),
                        }
                    );
                } else {
                    navigate(ROUTES.DASHBOARD.USERS.ROOT);
                }
            },
            onError: error => applyServerErrors(error, setError),
        });
    };

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>Create User</h4>
                <p className="text-muted mb-0">
                    Add a new admin user to the system.
                </p>
            </div>

            <Card>
                <Card.Body>
                    {createMutation.isError && (
                        <Alert variant="danger" className="mb-3">
                            Failed to create user. Please check your inputs and
                            try again.
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <Row className="g-3">
                            {/* Personal Info */}
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>
                                        Full Name{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        {...register('name')}
                                        isInvalid={!!errors.name}
                                        placeholder="John Doe"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.name?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>
                                        Email Address{' '}
                                        <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="email"
                                        {...register('email')}
                                        isInvalid={!!errors.email}
                                        placeholder="john@example.com"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.email?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Username</Form.Label>
                                    <Form.Control
                                        {...register('username')}
                                        isInvalid={!!errors.username}
                                        placeholder="e.g. johndoe"
                                    />
                                    <Form.Text className="text-muted">
                                        Leave empty to auto-generate from email
                                        (e.g. <em>john_doe</em> from
                                        john.doe@gmail.com)
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.username?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6} />
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        {...register('password')}
                                        isInvalid={!!errors.password}
                                        placeholder="Min 8 characters"
                                    />
                                    <Form.Text className="text-muted">
                                        Leave empty to use the default password:{' '}
                                        <strong>password</strong>
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.password?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Confirm Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        {...register('password_confirmation')}
                                        isInvalid={
                                            !!errors.password_confirmation
                                        }
                                        placeholder="Repeat password"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.password_confirmation?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            {/* Roles */}
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Roles</Form.Label>
                                    {rolesLoading ? (
                                        <div>
                                            <Spinner
                                                animation="border"
                                                size="sm"
                                            />{' '}
                                            Loading roles...
                                        </div>
                                    ) : (
                                        <Controller
                                            name="roles"
                                            control={control}
                                            render={({ field }) => (
                                                <div className="d-flex flex-wrap gap-3 mt-1">
                                                    {availableRoles.map(
                                                        role => (
                                                            <Form.Check
                                                                key={role.name}
                                                                type="checkbox"
                                                                label={
                                                                    <span className="text-capitalize">
                                                                        {formatRoleName(
                                                                            role.label ??
                                                                                role.name
                                                                        )}
                                                                    </span>
                                                                }
                                                                checked={(
                                                                    field.value ??
                                                                    []
                                                                ).includes(
                                                                    role.name
                                                                )}
                                                                onChange={e => {
                                                                    const current =
                                                                        field.value ??
                                                                        [];
                                                                    const next =
                                                                        e.target
                                                                            .checked
                                                                            ? [
                                                                                  ...current,
                                                                                  role.name,
                                                                              ]
                                                                            : current.filter(
                                                                                  r =>
                                                                                      r !==
                                                                                      role.name
                                                                              );
                                                                    field.onChange(
                                                                        next
                                                                    );
                                                                }}
                                                            />
                                                        )
                                                    )}
                                                    {availableRoles.length ===
                                                        0 && (
                                                        <span className="text-muted small">
                                                            No roles available.
                                                        </span>
                                                    )}
                                                    <Link
                                                        to={
                                                            ROUTES.DASHBOARD
                                                                .USERS
                                                                .CREATE_ROLE
                                                        }
                                                        className="small text-primary align-self-center"
                                                    >
                                                        + Add new role
                                                    </Link>
                                                </div>
                                            )}
                                        />
                                    )}
                                </Form.Group>
                            </Col>

                            {/* Status */}
                            <Col md={12}>
                                <Controller
                                    name="is_active"
                                    control={control}
                                    render={({ field }) => (
                                        <Form.Check
                                            type="switch"
                                            id="is_active"
                                            label="Active (user can log in)"
                                            checked={field.value ?? true}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </Col>
                        </Row>

                        {/* Branch Assignment */}
                        {activeBranches.length > 0 && (
                            <Card className="mt-3">
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h5 className="mb-0">
                                            Branch Assignment
                                        </h5>
                                        <small className="text-muted">
                                            Assign this user to one or more
                                            branches. They will only see data
                                            for their assigned branches.
                                        </small>
                                    </div>
                                    {selectedBranchIds.length > 0 && (
                                        <Badge bg="secondary">
                                            {selectedBranchIds.length} selected
                                        </Badge>
                                    )}
                                </Card.Header>
                                <Card.Body>
                                    <Row className="g-2">
                                        {activeBranches.map(branch => (
                                            <Col key={branch.id} md={4} xl={3}>
                                                <Form.Check
                                                    type="checkbox"
                                                    id={`branch-new-${branch.id}`}
                                                    label={branch.name}
                                                    checked={selectedBranchIds.includes(
                                                        branch.id
                                                    )}
                                                    onChange={() =>
                                                        setSelectedBranchIds(
                                                            prev =>
                                                                prev.includes(
                                                                    branch.id
                                                                )
                                                                    ? prev.filter(
                                                                          x =>
                                                                              x !==
                                                                              branch.id
                                                                      )
                                                                    : [
                                                                          ...prev,
                                                                          branch.id,
                                                                      ]
                                                        )
                                                    }
                                                />
                                            </Col>
                                        ))}
                                    </Row>
                                </Card.Body>
                            </Card>
                        )}
                        {/* Permissions */}
                        {selectedRoles.length > 0 && (
                            <Card className="mt-3">
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <div className="d-flex align-items-center gap-2">
                                            <h5 className="mb-0">
                                                Permissions
                                            </h5>
                                            {rolePermissions.length > 0 && (
                                                <Badge bg="primary">
                                                    {rolePermissions.length}{' '}
                                                    from roles
                                                </Badge>
                                            )}
                                            {checkedPermissions.length > 0 && (
                                                <Badge bg="success">
                                                    {checkedPermissions.length}{' '}
                                                    granted
                                                </Badge>
                                            )}
                                        </div>
                                        <small className="text-muted">
                                            Role permissions are pre-checked.
                                            You can adjust any permission
                                            individually.
                                        </small>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-link btn-sm p-0 text-primary"
                                            onClick={() =>
                                                setCheckedPermissions(
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
                                            onClick={() =>
                                                setCheckedPermissions([])
                                            }
                                        >
                                            Clear all
                                        </button>
                                    </div>
                                </Card.Header>
                                <Card.Body>
                                    {rolesLoading ? (
                                        <div className="text-center py-3">
                                            <Spinner
                                                animation="border"
                                                size="sm"
                                            />
                                        </div>
                                    ) : (
                                        filteredGroups.map(group => {
                                            const groupPerms =
                                                group.permissions;
                                            const checkedInGroup =
                                                groupPerms.filter(p =>
                                                    checkedPermissions.includes(
                                                        p
                                                    )
                                                ).length;
                                            const allGroupSelected =
                                                checkedInGroup ===
                                                groupPerms.length;

                                            return (
                                                <div
                                                    key={group.name}
                                                    className="mb-4"
                                                >
                                                    <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span className="fw-semibold small">
                                                                {group.name}
                                                            </span>
                                                            <Badge
                                                                bg={
                                                                    checkedInGroup >
                                                                    0
                                                                        ? 'primary'
                                                                        : 'secondary'
                                                                }
                                                                className="small"
                                                            >
                                                                {checkedInGroup}
                                                                /
                                                                {
                                                                    groupPerms.length
                                                                }
                                                            </Badge>
                                                        </div>
                                                        <Form.Check
                                                            type="checkbox"
                                                            id={`group-all-${group.name}`}
                                                            label={
                                                                <small className="text-muted">
                                                                    {allGroupSelected
                                                                        ? 'Deselect all'
                                                                        : 'Select all'}
                                                                </small>
                                                            }
                                                            checked={
                                                                allGroupSelected
                                                            }
                                                            onChange={() =>
                                                                toggleGroup(
                                                                    groupPerms
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <Row className="g-2">
                                                        {groupPerms.map(
                                                            perm => {
                                                                const fromRole =
                                                                    rolePermissions.includes(
                                                                        perm
                                                                    );
                                                                return (
                                                                    <Col
                                                                        key={
                                                                            perm
                                                                        }
                                                                        md={4}
                                                                        xl={3}
                                                                    >
                                                                        <Form.Check
                                                                            type="checkbox"
                                                                            id={`perm-${perm}`}
                                                                            label={
                                                                                <span className="small d-flex align-items-center gap-1">
                                                                                    {PERMISSION_LABELS[
                                                                                        perm
                                                                                    ] ??
                                                                                        perm}
                                                                                    {fromRole && (
                                                                                        <Badge
                                                                                            bg="primary"
                                                                                            className="ms-1"
                                                                                            style={{
                                                                                                fontSize:
                                                                                                    '0.65rem',
                                                                                            }}
                                                                                        >
                                                                                            Role
                                                                                        </Badge>
                                                                                    )}
                                                                                </span>
                                                                            }
                                                                            checked={checkedPermissions.includes(
                                                                                perm
                                                                            )}
                                                                            onChange={() =>
                                                                                togglePermission(
                                                                                    perm
                                                                                )
                                                                            }
                                                                        />
                                                                    </Col>
                                                                );
                                                            }
                                                        )}
                                                    </Row>
                                                </div>
                                            );
                                        })
                                    )}
                                </Card.Body>
                            </Card>
                        )}

                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <Button
                                variant="outline-secondary"
                                onClick={() =>
                                    navigate(ROUTES.DASHBOARD.USERS.ROOT)
                                }
                                disabled={createMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={createMutation.isPending}
                            >
                                {createMutation.isPending
                                    ? 'Creating...'
                                    : 'Create User'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
}
