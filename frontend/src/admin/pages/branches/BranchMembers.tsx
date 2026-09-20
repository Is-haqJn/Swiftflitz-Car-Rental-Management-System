import { useEffect, useMemo, useState } from 'react';
import {
    Badge,
    Button,
    Col,
    Dropdown,
    Form,
    Modal,
    Row,
    Spinner,
    Alert,
} from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useQueryClient } from '@tanstack/react-query';
import { useBranches, branchKeys } from '@/shared/hooks/queries/useBranches';
import { useActiveBranches } from '@/shared/hooks/queries/useBranches';
import { useAssignUserBranches } from '@/shared/hooks/queries/useUsers';
import type { Branch } from '@/shared/types/branch.types';
import type { User } from '@/shared/types/users.types';
import FilterBox from '@adminComponents/ui/FilterBox';
import { ROLES } from '@/shared/config/roles';
import { PERMISSIONS } from '@/shared/config/permissions';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { formatRoleName } from '@/shared/libs/utils';

/* Types */
interface MemberRow {
    user: User;
    branches: Branch[];
    roles: string[];
}

/* Helpers */
function getRoleNames(user: User): string[] {
    if (!user.roles || user.roles.length === 0) return [];
    return user.roles.map(r =>
        typeof r === 'string' ? r : (r as { name: string }).name
    );
}

function roleBadgeVariant(role: string): string {
    switch (role) {
        case ROLES.SUPER_ADMIN:
            return 'danger';
        case ROLES.ADMIN:
            return 'warning';
        case ROLES.MANAGER:
            return 'primary';
        default:
            return 'secondary';
    }
}

/* Component */
export default function BranchMembers() {
    const queryClient = useQueryClient();

    const [roleFilter, setRoleFilter] = useState('');
    const [search, setSearch] = useState('');

    // Reassign modal state
    const [assignTarget, setAssignTarget] = useState<MemberRow | null>(null);
    const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);

    // Fetch all branches - managers are in default includes
    const {
        data: response,
        isLoading,
        isError,
    } = useBranches({ per_page: 200 });
    const branches = response?.data ?? [];

    // All active branches for the reassign modal
    const { data: activeBranchesRes } = useActiveBranches();
    const activeBranches = activeBranchesRes?.data ?? [];

    const assignMutation = useAssignUserBranches();

    // Pre-populate checkboxes when modal opens
    useEffect(() => {
        if (assignTarget) {
            setSelectedBranchIds(assignTarget.branches.map(b => b.id));
        }
    }, [assignTarget?.user.id]);

    // Pivot: build user → branches map
    const allRows = useMemo<MemberRow[]>(() => {
        const map = new Map<string, MemberRow>();

        branches.forEach(branch => {
            branch.managers?.forEach(user => {
                const uid = String(user.id);
                if (map.has(uid)) {
                    map.get(uid)!.branches.push(branch);
                } else {
                    map.set(uid, {
                        user,
                        branches: [branch],
                        roles: getRoleNames(user),
                    });
                }
            });
        });

        return Array.from(map.values()).sort((a, b) =>
            a.user.name.localeCompare(b.user.name)
        );
    }, [branches]);

    // Apply filters
    const filteredRows = useMemo(() => {
        let rows = allRows;

        if (roleFilter) {
            rows = rows.filter(r => r.roles.includes(roleFilter));
        }

        if (search.trim()) {
            const q = search.trim().toLowerCase();
            rows = rows.filter(
                r =>
                    r.user.name.toLowerCase().includes(q) ||
                    r.user.email.toLowerCase().includes(q) ||
                    r.branches.some(b => b.name.toLowerCase().includes(q))
            );
        }

        return rows;
    }, [allRows, roleFilter, search]);

    // Unique roles for the filter dropdown
    const availableRoles = useMemo(() => {
        const set = new Set<string>();
        allRows.forEach(r => r.roles.forEach(role => set.add(role)));
        return Array.from(set).sort();
    }, [allRows]);

    function toggleBranch(id: string) {
        setSelectedBranchIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }

    function handleSaveAssignment() {
        if (!assignTarget) return;
        assignMutation.mutate(
            {
                id: String(assignTarget.user.id),
                branchIds: selectedBranchIds,
            },
            {
                onSuccess: () => {
                    queryClient.invalidateQueries({
                        queryKey: branchKeys.lists(),
                    });
                    setAssignTarget(null);
                },
            }
        );
    }

    if (isLoading) {
        return <SettingsFormSkeleton cards={2} />;
    }

    if (isError) {
        return (
            <Alert variant="danger">
                Failed to load branch members. Please try again.
            </Alert>
        );
    }

    return (
        <>
            <div className="page-titles mb-3">
                <h4>Branch Members</h4>
                <p className="text-muted mb-0">
                    All users assigned to one or more branches.
                </p>
            </div>

            <FilterBox>
                <Row className="g-3 align-items-end">
                    <Col md={4}>
                        <Form.Label className="small fw-semibold text-muted mb-1">
                            Search
                        </Form.Label>
                        <Form.Control
                            placeholder="Name, email or branch..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </Col>
                    <Col md={3}>
                        <Form.Label className="small fw-semibold text-muted mb-1">
                            Role
                        </Form.Label>
                        <Form.Select
                            className="tw:h-[2.9rem]"
                            value={roleFilter}
                            onChange={e => setRoleFilter(e.target.value)}
                        >
                            <option value="">All Roles</option>
                            {availableRoles.map(role => (
                                <option key={role} value={role}>
                                    {formatRoleName(role)}
                                </option>
                            ))}
                        </Form.Select>
                    </Col>
                    <Col md={2}>
                        <button
                            type="button"
                            className="btn btn-outline-secondary w-100"
                            onClick={() => {
                                setSearch('');
                                setRoleFilter('');
                            }}
                        >
                            Clear
                        </button>
                    </Col>
                </Row>
            </FilterBox>

            <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Branch Members</h5>
                    <Badge bg="secondary">{filteredRows.length} members</Badge>
                </div>
                <div className="card-body p-0">
                    {filteredRows.length === 0 ? (
                        <div className="text-center py-5">
                            <p className="text-muted mb-1 fw-semibold">
                                No members found
                            </p>
                            <small className="text-muted">
                                {allRows.length === 0
                                    ? 'No users have been assigned to any branch yet.'
                                    : 'Try adjusting your filters.'}
                            </small>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role(s)</th>
                                        <th>Assigned Branch(es)</th>
                                        <th className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRows.map(row => (
                                        <tr key={String(row.user.id)}>
                                            <td className="fw-semibold align-middle">
                                                {row.user.name}
                                            </td>
                                            <td className="text-muted align-middle">
                                                {row.user.email}
                                            </td>
                                            <td className="align-middle">
                                                <div className="d-flex flex-wrap gap-1">
                                                    {row.roles.length > 0 ? (
                                                        row.roles.map(role => (
                                                            <Badge
                                                                key={role}
                                                                bg={roleBadgeVariant(
                                                                    role
                                                                )}
                                                                className="text-capitalize"
                                                            >
                                                                {formatRoleName(
                                                                    role
                                                                )}
                                                            </Badge>
                                                        ))
                                                    ) : (
                                                        <span className="text-muted small">
                                                            -
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="align-middle">
                                                <div className="d-flex flex-wrap gap-1">
                                                    {row.branches.map(b => (
                                                        <Badge
                                                            key={b.id}
                                                            bg="light"
                                                            text="dark"
                                                            className="border"
                                                        >
                                                            {b.code
                                                                ? `${b.name} (${b.code})`
                                                                : b.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="align-middle text-end">
                                                <Dropdown align="end">
                                                    <Dropdown.Toggle
                                                        variant="light"
                                                        size="sm"
                                                        className="border"
                                                    >
                                                        Actions
                                                    </Dropdown.Toggle>
                                                    <Dropdown.Menu>
                                                        <PermisssionGuard
                                                            permission={
                                                                PERMISSIONS
                                                                    .BRANCHES
                                                                    .MANAGE_MEMBERS
                                                            }
                                                        >
                                                            <Dropdown.Item
                                                                onClick={() =>
                                                                    setAssignTarget(
                                                                        row
                                                                    )
                                                                }
                                                            >
                                                                Reassign
                                                                Branches
                                                            </Dropdown.Item>
                                                        </PermisssionGuard>
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Reassign Branches Modal */}
            <Modal
                show={!!assignTarget}
                onHide={() => setAssignTarget(null)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        Reassign Branches
                        {assignTarget && (
                            <small className="d-block text-muted fw-normal fs-6 mt-1">
                                {assignTarget.user.name}
                            </small>
                        )}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {activeBranches.length === 0 ? (
                        <p className="text-muted mb-0">
                            No active branches available.
                        </p>
                    ) : (
                        <div className="d-flex flex-column gap-2">
                            {activeBranches.map(branch => (
                                <Form.Check
                                    key={branch.id}
                                    id={`branch-${branch.id}`}
                                    type="checkbox"
                                    label={
                                        branch.code
                                            ? `${branch.name} (${branch.code})`
                                            : branch.name
                                    }
                                    checked={selectedBranchIds.includes(
                                        branch.id
                                    )}
                                    onChange={() => toggleBranch(branch.id)}
                                />
                            ))}
                        </div>
                    )}
                    {selectedBranchIds.length === 0 && (
                        <p className="text-warning small mt-2 mb-0">
                            Saving with no branches selected will remove this
                            user from all branches.
                        </p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="light"
                        onClick={() => setAssignTarget(null)}
                        disabled={assignMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSaveAssignment}
                        disabled={assignMutation.isPending}
                    >
                        {assignMutation.isPending ? (
                            <>
                                <Spinner size="sm" className="me-1" />
                                Saving...
                            </>
                        ) : (
                            'Save Assignment'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
