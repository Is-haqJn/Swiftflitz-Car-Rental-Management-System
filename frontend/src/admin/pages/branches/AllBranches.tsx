import { useState, useCallback, useMemo, useEffect } from 'react';
import {
    Form,
    Row,
    Col,
    InputGroup,
    Badge,
    Dropdown,
    Modal,
    Button,
    Spinner,
} from 'react-bootstrap';
import type { Branch, BranchFilters } from '@/shared/types/branch.types';
import { branchService } from '@/services/branchService';
import {
    useBranches,
    useBranch,
    useDeleteBranch,
    useToggleBranchActive,
    useAssignBranchManagers,
    useVacateBranch,
    useActiveBranches,
    branchKeys,
} from '@/shared/hooks/queries/useBranches';
import { useUsers } from '@/shared/hooks/queries/useUsers';
import { useBulkDelete } from '@/shared/hooks/queries/useBulkDelete';
import DataTable, { type Column } from '@adminComponents/DataTable';
import FilterBox from '@adminComponents/ui/FilterBox';
import { ROLES } from '@/shared/config/roles';
import { PERMISSIONS } from '@/shared/config/permissions';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { usePermission, useTitle } from '@/shared/hooks';

interface AllBranchesProps {
    onAdd?: () => void;
    onEdit?: (branch: Branch) => void;
}

export default function AllBranches({ onAdd, onEdit }: AllBranchesProps) {
    const title = useTitle('Branches');
    const [filters, setFilters] = useState<BranchFilters>({
        page: 1,
        per_page: 15,
    });
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);
    const [vacateTarget, setVacateTarget] = useState<Branch | null>(null);
    const [vacateAction, setVacateAction] = useState<'unassign' | 'transfer'>(
        'unassign'
    );
    const [vacateTargetBranchId, setVacateTargetBranchId] = useState('');
    const [assignTarget, setAssignTarget] = useState<Branch | null>(null);
    const [assignMemberIds, setAssignMemberIds] = useState<string[]>([]);

    const { hasAnyPermission } = usePermission();
    const hasEdit = hasAnyPermission([PERMISSIONS.BRANCHES.EDIT]);
    const hasDelete = hasAnyPermission([PERMISSIONS.BRANCHES.DELETE]);
    const hasManageMembers = hasAnyPermission([
        PERMISSIONS.BRANCHES.MANAGE_MEMBERS,
    ]);
    const hasActions = hasEdit || hasDelete || hasManageMembers;

    const { data: response, isLoading, isError } = useBranches(filters);
    const deleteMutation = useDeleteBranch();
    const vacateMutation = useVacateBranch();
    const toggleActiveMutation = useToggleBranchActive();
    const assignMutation = useAssignBranchManagers();

    // Active branches for the vacate transfer dropdown
    const { data: activeBranchesRes } = useActiveBranches();
    const activeBranches = activeBranchesRes?.data ?? [];

    // Fetch branch detail (with members) only when the modal is open
    const { data: branchDetail, isLoading: branchDetailLoading } = useBranch(
        assignTarget?.id ?? ''
    );

    // Fetch all users for the member picker
    const { data: usersRes } = useUsers({ per_page: 200 });
    const allUsers = useMemo(
        () =>
            (usersRes?.data ?? []).filter(
                u => !u.roles?.some(r => r.name === ROLES.SUPER_ADMIN)
            ),
        [usersRes]
    );

    // Pre-populate member checkboxes when branch detail loads
    useEffect(() => {
        if (branchDetail?.data?.managers) {
            setAssignMemberIds(
                branchDetail.data.managers.map(m => String(m.id))
            );
        }
    }, [branchDetail?.data?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const { bulkDelete, isBulkDeleting } = useBulkDelete({
        deleteFn: (id: string) => branchService.delete(id),
        invalidateKeys: [branchKeys.lists()],
        entityName: 'branch',
        onSuccess: () => setSelectedIds([]),
    });

    const branches = useMemo<Branch[]>(() => response?.data ?? [], [response]);
    const meta = response?.meta ?? null;

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

    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }));
    }, []);

    const handleClearFilters = useCallback(() => {
        setSearch('');
        setFilters({ page: 1, per_page: 15 });
    }, []);

    // Route delete requests: no vehicles → simple confirm, has vehicles → vacate modal
    const handleDeleteRequest = useCallback((branch: Branch | null) => {
        if (!branch) {
            setDeleteTarget(null);
            return;
        }
        if ((branch.vehicles_count ?? 0) > 0) {
            setVacateAction('unassign');
            setVacateTargetBranchId('');
            setVacateTarget(branch);
        } else {
            setDeleteTarget(branch);
        }
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (!deleteTarget) return;
        deleteMutation.mutate(deleteTarget.id, {
            onSettled: () => setDeleteTarget(null),
        });
    }, [deleteTarget, deleteMutation]);

    const handleVacateAndDelete = useCallback(() => {
        if (!vacateTarget) return;
        vacateMutation.mutate(
            {
                id: vacateTarget.id,
                action: vacateAction,
                target_branch_id:
                    vacateAction === 'transfer'
                        ? vacateTargetBranchId
                        : undefined,
            },
            {
                onSuccess: () => {
                    deleteMutation.mutate(vacateTarget.id, {
                        onSettled: () => setVacateTarget(null),
                    });
                },
            }
        );
    }, [
        vacateTarget,
        vacateAction,
        vacateTargetBranchId,
        vacateMutation,
        deleteMutation,
    ]);

    const handleAssignSave = () => {
        if (!assignTarget) return;
        assignMutation.mutate(
            { id: assignTarget.id, userIds: assignMemberIds },
            { onSettled: () => setAssignTarget(null) }
        );
    };

    const toggleSelectAll = useCallback(() => {
        setSelectedIds(prev =>
            prev.length === branches.length ? [] : branches.map(b => b.id)
        );
    }, [branches]);

    const toggleOne = useCallback((id: string | number) => {
        setSelectedIds(prev =>
            prev.includes(String(id))
                ? prev.filter(x => x !== String(id))
                : [...prev, String(id)]
        );
    }, []);

    const columns: Column<Branch>[] = [
        {
            key: 'name',
            label: 'Branch',
            render: branch => (
                <div>
                    <span className="fw-bold">{branch.name}</span>
                    {branch.code && (
                        <Badge bg="secondary" className="ms-2">
                            {branch.code}
                        </Badge>
                    )}
                    {branch.address && (
                        <>
                            <br />
                            <small className="text-muted">
                                {branch.address}
                            </small>
                        </>
                    )}
                </div>
            ),
        },
        {
            key: 'members',
            label: 'Members / Vehicles',
            render: branch => (
                <span className="text-muted">
                    {branch.managers?.length ?? 0} member
                    {(branch.managers?.length ?? 0) !== 1 ? 's' : ''}
                    {(branch.vehicles_count ?? 0) > 0 && (
                        <span className="ms-2 text-secondary">
                            · {branch.vehicles_count} vehicle
                            {(branch.vehicles_count ?? 0) !== 1 ? 's' : ''}
                        </span>
                    )}
                </span>
            ),
        },
        {
            key: 'is_active',
            label: 'Active',
            render: branch => (
                <div className="form-switch ps-0">
                    <input
                        className="form-check-input ms-0"
                        type="checkbox"
                        role="switch"
                        id={`active_${branch.id}`}
                        checked={branch.is_active}
                        disabled={toggleActiveMutation.isPending}
                        onChange={() => toggleActiveMutation.mutate(branch.id)}
                    />
                </div>
            ),
        },
        ...(hasActions
            ? [
                  {
                      key: 'actions' as const,
                      label: 'Action',
                      className: 'text-end',
                      render: (branch: Branch) => (
                          <Dropdown align="end">
                              <Dropdown.Toggle
                                  as="button"
                                  className="btn btn-xs btn-outline-secondary"
                                  id={`actions-${branch.id}`}
                              >
                                  Actions
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                  {onEdit && hasEdit && (
                                      <Dropdown.Item
                                          onClick={() => onEdit(branch)}
                                      >
                                          Edit
                                      </Dropdown.Item>
                                  )}
                                  {hasManageMembers && (
                                      <Dropdown.Item
                                          onClick={() => {
                                              setAssignMemberIds([]);
                                              setAssignTarget(branch);
                                          }}
                                      >
                                          Assign Members
                                      </Dropdown.Item>
                                  )}
                                  {hasDelete && (
                                      <>
                                          <Dropdown.Divider />
                                          <Dropdown.Item
                                              className="text-danger"
                                              onClick={() =>
                                                  handleDeleteRequest(branch)
                                              }
                                          >
                                              Delete
                                          </Dropdown.Item>
                                      </>
                                  )}
                              </Dropdown.Menu>
                          </Dropdown>
                      ),
                  },
              ]
            : []),
    ];

    const headerActions = (
        <div className="d-flex gap-2">
            {onAdd && (
                <PermisssionGuard permission={PERMISSIONS.BRANCHES.CREATE}>
                    <button className="btn btn-primary btn-sm" onClick={onAdd}>
                        + Add Branch
                    </button>
                </PermisssionGuard>
            )}
        </div>
    );

    return (
        <>
            {title}
            <FilterBox>
                <Form onSubmit={handleSearch}>
                    <Row className="g-3 align-items-end">
                        <Col md={4}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Search
                            </Form.Label>
                            <InputGroup>
                                <Form.Control
                                    placeholder="Branch name..."
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
                        <Col md={2}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Status
                            </Form.Label>
                            <Form.Select
                                className="tw:h-[2.9rem]"
                                value={
                                    filters.is_active !== undefined
                                        ? String(filters.is_active)
                                        : ''
                                }
                                onChange={e =>
                                    setFilters(prev => ({
                                        ...prev,
                                        is_active:
                                            e.target.value === ''
                                                ? undefined
                                                : e.target.value,
                                        page: 1,
                                    }))
                                }
                            >
                                <option value="">All</option>
                                <option value="1">Active</option>
                                <option value="0">Inactive</option>
                            </Form.Select>
                        </Col>
                        <Col md={1}>
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

            <DataTable
                title="All Branches"
                data={branches}
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
                onDeleteRequest={handleDeleteRequest}
                onDeleteConfirm={handleDeleteConfirm}
                onDeleteCancel={() => setDeleteTarget(null)}
                isDeleting={deleteMutation.isPending}
                onPageChange={handlePageChange}
                headerActions={headerActions}
                emptyTitle="No branches found"
                emptyMessage="Add your first branch to get started."
            />

            {/* Vacate & Delete Modal */}
            <Modal
                show={!!vacateTarget}
                onHide={() => setVacateTarget(null)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Delete Branch</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="mb-1">
                        <strong>{vacateTarget?.name}</strong> has{' '}
                        <span className="text-danger fw-semibold">
                            {vacateTarget?.vehicles_count} vehicle
                            {(vacateTarget?.vehicles_count ?? 0) !== 1
                                ? 's'
                                : ''}
                        </span>{' '}
                        assigned. Choose what to do with them before deleting:
                    </p>
                    <hr />
                    <Form.Check
                        type="radio"
                        id="vacate-unassign"
                        name="vacateAction"
                        label="Unassign all vehicles (leave them without a branch)"
                        checked={vacateAction === 'unassign'}
                        onChange={() => {
                            setVacateAction('unassign');
                            setVacateTargetBranchId('');
                        }}
                        className="mb-2"
                    />
                    <Form.Check
                        type="radio"
                        id="vacate-transfer"
                        name="vacateAction"
                        label="Move all vehicles to another branch"
                        checked={vacateAction === 'transfer'}
                        onChange={() => setVacateAction('transfer')}
                        className="mb-3"
                    />
                    {vacateAction === 'transfer' && (
                        <Form.Select
                            className="tw:h-[2.9rem] ms-4"
                            value={vacateTargetBranchId}
                            onChange={e =>
                                setVacateTargetBranchId(e.target.value)
                            }
                            style={{ width: 'calc(100% - 1.5rem)' }}
                        >
                            <option value="">- Select a branch -</option>
                            {activeBranches
                                .filter(b => b.id !== vacateTarget?.id)
                                .map(b => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                        {b.code ? ` (${b.code})` : ''}
                                    </option>
                                ))}
                        </Form.Select>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="light"
                        onClick={() => setVacateTarget(null)}
                        disabled={
                            vacateMutation.isPending || deleteMutation.isPending
                        }
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleVacateAndDelete}
                        disabled={
                            vacateMutation.isPending ||
                            deleteMutation.isPending ||
                            (vacateAction === 'transfer' &&
                                !vacateTargetBranchId)
                        }
                    >
                        {vacateMutation.isPending ||
                        deleteMutation.isPending ? (
                            <>
                                <Spinner size="sm" className="me-1" />
                                {vacateMutation.isPending
                                    ? 'Moving vehicles...'
                                    : 'Deleting...'}
                            </>
                        ) : (
                            'Vacate & Delete Branch'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Assign Members Modal */}
            <Modal
                show={!!assignTarget}
                onHide={() => setAssignTarget(null)}
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        Assign Members -{' '}
                        <span className="text-primary">
                            {assignTarget?.name}
                        </span>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {branchDetailLoading ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" size="sm" />
                        </div>
                    ) : allUsers.length === 0 ? (
                        <p className="text-muted mb-0">No users found.</p>
                    ) : (
                        <>
                            <p className="text-muted small mb-3">
                                Selected users will be assigned to this branch
                                and will only see vehicles and rentals belonging
                                to it.
                            </p>
                            <Row className="g-2">
                                {allUsers.map(user => (
                                    <Col key={user.id} md={4}>
                                        <Form.Check
                                            type="checkbox"
                                            id={`assign-${user.id}`}
                                            label={
                                                <span>
                                                    {user.name}
                                                    {user.roles &&
                                                        user.roles.length >
                                                            0 && (
                                                            <small className="text-muted ms-1">
                                                                (
                                                                {typeof user
                                                                    .roles[0] ===
                                                                'string'
                                                                    ? user
                                                                          .roles[0]
                                                                    : (
                                                                          user
                                                                              .roles[0] as {
                                                                              name: string;
                                                                          }
                                                                      ).name}
                                                                )
                                                            </small>
                                                        )}
                                                </span>
                                            }
                                            checked={assignMemberIds.includes(
                                                String(user.id)
                                            )}
                                            onChange={() => {
                                                const uid = String(user.id);
                                                setAssignMemberIds(prev =>
                                                    prev.includes(uid)
                                                        ? prev.filter(
                                                              x => x !== uid
                                                          )
                                                        : [...prev, uid]
                                                );
                                            }}
                                        />
                                    </Col>
                                ))}
                            </Row>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="outline-secondary"
                        onClick={() => setAssignTarget(null)}
                        disabled={assignMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleAssignSave}
                        disabled={
                            assignMutation.isPending || branchDetailLoading
                        }
                    >
                        {assignMutation.isPending
                            ? 'Saving...'
                            : 'Save Assignment'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
