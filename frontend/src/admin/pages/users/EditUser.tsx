import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Card,
    Form,
    Row,
    Col,
    Button,
    Spinner,
    Alert,
    Badge,
} from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    useUser,
    useUpdateUser,
    useAvailableRoles,
    useAssignUserBranches,
} from '@/shared/hooks/queries/useUsers';
import { useActiveBranches } from '@/shared/hooks/queries/useBranches';
import {
    editUserSchema,
    type EditUserFormData,
} from '@/shared/libs/validations';
import type { Role } from '@/shared/types';
import { ROUTES } from '@/shared/routes';
import { formatRoleName, applyServerErrors } from '@/shared/libs/utils';
import {
    PERMISSION_GROUPS,
    PERMISSION_LABELS,
} from '@/shared/config/permissions';
import { usePermission, useTitle } from '@/shared/hooks';

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

export default function EditUser() {
    const title = useTitle('Edit User');
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isSuperAdmin } = usePermission();

    const { data: userRes, isLoading: userLoading } = useUser(id!);
    const { data: rolesRes, isLoading: rolesLoading } = useAvailableRoles();
    const { data: branchesRes } = useActiveBranches();
    const updateMutation = useUpdateUser();
    const assignBranchesMutation = useAssignUserBranches();

    const user = userRes?.data;
    const allBranches = branchesRes?.data ?? [];

    /* Branch assignment state */
    const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);

    useEffect(() => {
        if (user?.branches) {
            setSelectedBranchIds(user.branches.map(b => b.id));
        }
    }, [user?.id, user?.branches]);

    const handleToggleBranch = (branchId: string) => {
        setSelectedBranchIds(prev =>
            prev.includes(branchId)
                ? prev.filter(id => id !== branchId)
                : [...prev, branchId]
        );
    };

    const handleSaveBranches = () => {
        assignBranchesMutation.mutate({
            id: id!,
            branchIds: selectedBranchIds,
        });
    };
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

    const [checkedPermissions, setCheckedPermissions] = useState<string[]>([]);
    const prevRolePermsRef = useRef<string[]>([]);
    // Guard: don't run the role-sync effect until the form has been seeded
    // with both user data and available roles.  Without this, a race between
    // the two async responses wipes or re-adds intentionally revoked perms.
    const initializedRef = useRef(false);

    const {
        register,
        handleSubmit,
        control,
        reset,
        setError,
        formState: { errors },
    } = useForm<EditUserFormData>({
        resolver: zodResolver(editUserSchema),
    });

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

    // Sync role permission changes into checkedPermissions.
    // Skip until both user and roles are loaded so revoked permissions are
    // not accidentally re-added during the async loading window.
    useEffect(() => {
        if (!initializedRef.current) {
            return;
        }
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

    useEffect(() => {
        // Wait for both user data and available roles before initialising the
        // form.  This prevents the role-sync effect from firing before roles
        // are known, which would clear all checked permissions.
        if (!user || rolesLoading || initializedRef.current) {
            return;
        }

        initializedRef.current = true;

        //? Compute role permissions from availableRoles (full Role objects)
        //? because user.roles from the API are plain strings - accessing
        //? r.permissions on a string yields undefined and produces an empty
        //? set, which would cause the sync effect to re-add every revoked perm.
        const userRoleNames = (user.roles ?? []).map(r =>
            typeof r === 'string' ? r : (r as { name: string }).name
        );
        const serverRolePerms = [
            ...new Set(
                userRoleNames.flatMap(roleName => {
                    const role = availableRoles.find(r => r.name === roleName);
                    return role?.permissions?.map(p => p.name) ?? [];
                })
            ),
        ];
        prevRolePermsRef.current = serverRolePerms;

        reset({
            name: user.name,
            email: user.email,
            username: user.username ?? '',
            password: '',
            password_confirmation: '',
            roles:
                user.roles?.map(r => (typeof r === 'string' ? r : r.name)) ??
                [],
            permissions: [],
            is_active: user.is_active,
        });

        setCheckedPermissions(user.all_permissions ?? []);
    }, [user, rolesLoading, availableRoles, reset]);

    const onSubmit = (data: EditUserFormData) => {
        const payload: Record<string, unknown> = {
            name: data.name,
            email: data.email,
            username: data.username || undefined,
            roles: data.roles ?? [],
            permissions: checkedPermissions,
            is_active: data.is_active,
        };
        if (data.password && data.password !== '') {
            payload.password = data.password;
            payload.password_confirmation = data.password_confirmation;
        }
        updateMutation.mutate(
            {
                id: id!,
                payload: payload as Parameters<
                    typeof updateMutation.mutate
                >[0]['payload'],
            },
            {
                onSuccess: () => navigate(ROUTES.DASHBOARD.USERS.VIEW(id!)),
                onError: error => applyServerErrors(error, setError),
            }
        );
    };

    if (userLoading) {
        return <SettingsFormSkeleton cards={2} />;
    }

    if (!user) {
        return <Alert variant="danger">User not found.</Alert>;
    }

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>Edit User</h4>
                <p className="text-muted mb-0">
                    Update user information, roles and direct permissions.
                </p>
            </div>

            <Form onSubmit={handleSubmit(onSubmit)}>
                {updateMutation.isError && (
                    <Alert variant="danger" className="mb-3">
                        Failed to update user. Please check your inputs and try
                        again.
                    </Alert>
                )}

                {/* Basic Info */}
                <Card className="mb-3">
                    <Card.Header>
                        <h5 className="mb-0">Basic Information</h5>
                    </Card.Header>
                    <Card.Body>
                        <Row className="g-3">
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
                                    <Form.Control.Feedback type="invalid">
                                        {errors.username?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6} />
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>
                                        New Password{' '}
                                        <span className="text-muted small">
                                            (leave blank to keep current)
                                        </span>
                                    </Form.Label>
                                    <Form.Control
                                        type="password"
                                        {...register('password')}
                                        isInvalid={!!errors.password}
                                        placeholder="Min 8 characters"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.password?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>
                                        Confirm New Password
                                    </Form.Label>
                                    <Form.Control
                                        type="password"
                                        {...register('password_confirmation')}
                                        isInvalid={
                                            !!errors.password_confirmation
                                        }
                                        placeholder="Repeat new password"
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
                                            defaultValue={[]}
                                            render={({ field }) => (
                                                <div className="d-flex flex-wrap gap-3 mt-1">
                                                    {availableRoles.map(
                                                        role => (
                                                            <Form.Check
                                                                key={role.name}
                                                                type="checkbox"
                                                                label={formatRoleName(
                                                                    role.label ??
                                                                        role.name
                                                                )}
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
                    </Card.Body>
                </Card>

                {/* Branch Assignment */}
                {allBranches.length > 0 && (
                    <Card className="mb-3">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="mb-0">Branch Assignment</h5>
                                <small className="text-muted">
                                    Assign this user to one or more branches.
                                    They will only see vehicles in their
                                    assigned branches.
                                </small>
                            </div>
                            <Badge bg="secondary">
                                {selectedBranchIds.length} assigned
                            </Badge>
                        </Card.Header>
                        <Card.Body>
                            <Row className="g-2 mb-3">
                                {allBranches.map(branch => (
                                    <Col key={branch.id} md={4} xl={3}>
                                        <Form.Check
                                            type="checkbox"
                                            id={`branch-${branch.id}`}
                                            label={branch.name}
                                            checked={selectedBranchIds.includes(
                                                branch.id
                                            )}
                                            onChange={() =>
                                                handleToggleBranch(branch.id)
                                            }
                                        />
                                    </Col>
                                ))}
                            </Row>
                            <div className="d-flex justify-content-end">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleSaveBranches}
                                    disabled={assignBranchesMutation.isPending}
                                >
                                    {assignBranchesMutation.isPending
                                        ? 'Saving...'
                                        : 'Save Branch Assignment'}
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                )}

                {/* Permissions */}
                {selectedRoles.length > 0 && (
                    <Card className="mb-3">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <div>
                                <div className="d-flex align-items-center gap-2">
                                    <h5 className="mb-0">Permissions</h5>
                                    {rolePermissions.length > 0 && (
                                        <Badge bg="primary">
                                            {rolePermissions.length} from roles
                                        </Badge>
                                    )}
                                    {checkedPermissions.length > 0 && (
                                        <Badge bg="success">
                                            {checkedPermissions.length} granted
                                        </Badge>
                                    )}
                                </div>
                                <small className="text-muted">
                                    Role permissions are pre-checked. You can
                                    adjust any permission individually.
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
                                    onClick={() => setCheckedPermissions([])}
                                >
                                    Clear all
                                </button>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            {rolesLoading ? (
                                <div className="text-center py-3">
                                    <Spinner animation="border" size="sm" />
                                </div>
                            ) : (
                                filteredGroups.map(group => {
                                    const groupPerms = group.permissions;
                                    const checkedInGroup = groupPerms.filter(
                                        p => checkedPermissions.includes(p)
                                    ).length;
                                    const allGroupSelected =
                                        checkedInGroup === groupPerms.length;

                                    return (
                                        <div key={group.name} className="mb-4">
                                            <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom">
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="fw-semibold small">
                                                        {group.name}
                                                    </span>
                                                    <Badge
                                                        bg={
                                                            checkedInGroup > 0
                                                                ? 'primary'
                                                                : 'secondary'
                                                        }
                                                        className="small"
                                                    >
                                                        {checkedInGroup}/
                                                        {groupPerms.length}
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
                                                    checked={allGroupSelected}
                                                    onChange={() =>
                                                        toggleGroup(groupPerms)
                                                    }
                                                />
                                            </div>
                                            <Row className="g-2">
                                                {groupPerms.map(perm => {
                                                    const fromRole =
                                                        rolePermissions.includes(
                                                            perm
                                                        );
                                                    return (
                                                        <Col
                                                            key={perm}
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
                                                })}
                                            </Row>
                                        </div>
                                    );
                                })
                            )}
                        </Card.Body>
                    </Card>
                )}

                <div className="d-flex justify-content-end gap-2">
                    <Button
                        variant="outline-secondary"
                        onClick={() =>
                            navigate(ROUTES.DASHBOARD.USERS.VIEW(id!))
                        }
                        disabled={updateMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={updateMutation.isPending}
                    >
                        {updateMutation.isPending
                            ? 'Saving...'
                            : 'Save Changes'}
                    </Button>
                </div>
            </Form>
        </div>
    );
}
