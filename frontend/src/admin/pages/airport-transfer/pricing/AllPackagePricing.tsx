import { useState, useCallback, useMemo } from 'react';
import {
    Form,
    Row,
    Col,
    Dropdown,
    Modal,
    Button,
    Spinner,
} from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type {
    AirportPackageAssignment,
    AirportPackageAssignmentFilters,
} from '@/shared/types/airport-package-assignment.types';
import { airportPackageAssignmentService } from '@/services/airportPackageAssignmentService';
import {
    useAirportPackageAssignments,
    useDeleteAirportPackageAssignment,
    useToggleAirportPackageAssignmentActive,
    useUpdateAirportPackageAssignment,
    airportPackageAssignmentKeys,
} from '@/shared/hooks/queries/useAirportPackageAssignments';
import { useActiveAirports } from '@/shared/hooks/queries/useAirports';
import { useBulkDelete } from '@/shared/hooks/queries/useBulkDelete';
import DataTable, { type Column } from '@adminComponents/DataTable';
import FilterBox from '@adminComponents/ui/FilterBox';
import { PERMISSIONS } from '@/shared/config/permissions';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { usePermission, useTitle } from '@/shared/hooks';
import { getErrorMessage } from '@/shared/libs/utils';
import toast from 'react-hot-toast';

/* Edit price schema */
const editPriceSchema = z.object({
    base_price: z.number().positive('Price must be greater than 0'),
});
type EditPriceFormData = z.infer<typeof editPriceSchema>;

interface AllPackagePricingProps {
    onAdd?: () => void;
}

export default function AllPackagePricing({ onAdd }: AllPackagePricingProps) {
    const title = useTitle('Package Pricing');
    const [filters, setFilters] = useState<AirportPackageAssignmentFilters>({
        page: 1,
        per_page: 15,
    });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] =
        useState<AirportPackageAssignment | null>(null);
    const [editTarget, setEditTarget] =
        useState<AirportPackageAssignment | null>(null);

    const { hasAnyPermission } = usePermission();
    const hasEdit = hasAnyPermission([
        PERMISSIONS.AIRPORT_TRANSFER.MANAGE_PACKAGES,
    ]);
    const hasDelete = hasAnyPermission([PERMISSIONS.AIRPORT_TRANSFER.DELETE]);
    const hasActions = hasEdit || hasDelete;

    const {
        data: response,
        isLoading,
        isError,
    } = useAirportPackageAssignments(filters);
    const { data: airportsRes } = useActiveAirports();
    const airports = airportsRes?.data ?? [];

    const deleteMutation = useDeleteAirportPackageAssignment();
    const toggleActiveMutation = useToggleAirportPackageAssignmentActive();
    const updateMutation = useUpdateAirportPackageAssignment();

    const { bulkDelete, isBulkDeleting } = useBulkDelete({
        deleteFn: (id: string) => airportPackageAssignmentService.delete(id),
        invalidateKeys: [airportPackageAssignmentKeys.lists()],
        entityName: 'pricing assignment',
        onSuccess: () => setSelectedIds([]),
    });

    const assignments = useMemo<AirportPackageAssignment[]>(
        () => response?.data ?? [],
        [response]
    );
    const meta = response?.meta ?? null;

    // Edit price form
    const {
        register,
        handleSubmit,
        reset: resetEditForm,
        formState: { errors: editErrors },
    } = useForm<EditPriceFormData>({
        resolver: zodResolver(editPriceSchema),
    });

    const openEditModal = (assignment: AirportPackageAssignment) => {
        setEditTarget(assignment);
        resetEditForm({ base_price: parseFloat(assignment.base_price) });
    };

    const closeEditModal = () => {
        setEditTarget(null);
    };

    const onEditSubmit = (data: EditPriceFormData) => {
        if (!editTarget) return;
        updateMutation.mutate(
            { id: editTarget.id, payload: { base_price: data.base_price } },
            {
                onSuccess: () => closeEditModal(),
                onError: error =>
                    toast.error(
                        getErrorMessage(error, 'Failed to update price')
                    ),
            }
        );
    };

    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }));
    }, []);

    const handleClearFilters = useCallback(() => {
        setFilters({ page: 1, per_page: 15 });
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (!deleteTarget) return;
        deleteMutation.mutate(deleteTarget.id, {
            onSettled: () => setDeleteTarget(null),
        });
    }, [deleteTarget, deleteMutation]);

    const toggleSelectAll = useCallback(() => {
        setSelectedIds(prev =>
            prev.length === assignments.length ? [] : assignments.map(a => a.id)
        );
    }, [assignments]);

    const toggleOne = useCallback((id: string | number) => {
        setSelectedIds(prev =>
            prev.includes(String(id))
                ? prev.filter(x => x !== String(id))
                : [...prev, String(id)]
        );
    }, []);

    const columns: Column<AirportPackageAssignment>[] = [
        {
            key: 'package',
            label: 'Package',
            render: a => (
                <span className="fw-semibold">
                    {a.package?.name ?? a.package_id}
                </span>
            ),
        },
        {
            key: 'airport',
            label: 'Airport',
            render: a => (
                <span className="text-muted">
                    {a.airport?.name ?? a.airport_id}
                </span>
            ),
        },
        {
            key: 'base_price',
            label: 'Base Price',
            render: a => <span className="fw-semibold">{a.base_price}</span>,
        },
        {
            key: 'is_active',
            label: 'Active',
            render: a => (
                <div className="form-switch ps-0">
                    <input
                        className="form-check-input ms-0"
                        type="checkbox"
                        role="switch"
                        id={`active_${a.id}`}
                        checked={a.is_active}
                        disabled={toggleActiveMutation.isPending}
                        onChange={() => toggleActiveMutation.mutate(a.id)}
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
                      render: (a: AirportPackageAssignment) => (
                          <Dropdown align="end">
                              <Dropdown.Toggle
                                  as="button"
                                  className="btn btn-xs btn-outline-secondary"
                                  id={`actions-${a.id}`}
                              >
                                  Actions
                              </Dropdown.Toggle>
                              <Dropdown.Menu
                                  popperConfig={{ strategy: 'fixed' }}
                                  renderOnMount
                              >
                                  {hasEdit && (
                                      <Dropdown.Item
                                          onClick={() => openEditModal(a)}
                                      >
                                          Edit Price
                                      </Dropdown.Item>
                                  )}
                                  {hasDelete && (
                                      <>
                                          <Dropdown.Divider />
                                          <Dropdown.Item
                                              className="text-danger"
                                              onClick={() => setDeleteTarget(a)}
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
                <PermisssionGuard
                    permission={PERMISSIONS.AIRPORT_TRANSFER.MANAGE_PACKAGES}
                >
                    <button className="btn btn-primary btn-sm" onClick={onAdd}>
                        + Add Pricing
                    </button>
                </PermisssionGuard>
            )}
        </div>
    );

    return (
        <>
            {title}
            <FilterBox>
                <Row className="g-3 align-items-end">
                    <Col md={3}>
                        <Form.Label className="small fw-semibold text-muted mb-1">
                            Airport
                        </Form.Label>
                        <Form.Select
                            className="tw:h-[2.9rem]"
                            value={filters.airport_id ?? ''}
                            onChange={e =>
                                setFilters(prev => ({
                                    ...prev,
                                    airport_id: e.target.value || undefined,
                                    page: 1,
                                }))
                            }
                        >
                            <option value="">All Airports</option>
                            {airports.map(airport => (
                                <option key={airport.id} value={airport.id}>
                                    {airport.name}
                                </option>
                            ))}
                        </Form.Select>
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
            </FilterBox>

            <DataTable
                title="Package Pricing"
                data={assignments}
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
                deleteTargetName={
                    deleteTarget
                        ? `${deleteTarget.package?.name ?? ''} - ${deleteTarget.airport?.name ?? ''}`
                        : undefined
                }
                onDeleteRequest={setDeleteTarget}
                onDeleteConfirm={handleDeleteConfirm}
                onDeleteCancel={() => setDeleteTarget(null)}
                isDeleting={deleteMutation.isPending}
                onPageChange={handlePageChange}
                headerActions={headerActions}
                emptyTitle="No pricing assignments found"
                emptyMessage="Assign packages to airports to set up pricing."
            />

            {/* Edit Price Modal */}
            <Modal show={!!editTarget} onHide={closeEditModal} centered>
                <Form onSubmit={handleSubmit(onEditSubmit)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Edit Price</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p className="text-muted small mb-3">
                            <strong>{editTarget?.package?.name}</strong> at{' '}
                            <strong>{editTarget?.airport?.name}</strong>
                        </p>
                        <Form.Group>
                            <Form.Label>Base Price</Form.Label>
                            <Form.Control
                                type="number"
                                step="0.01"
                                min="0"
                                {...register('base_price', {
                                    valueAsNumber: true,
                                })}
                                isInvalid={!!editErrors.base_price}
                            />
                            <Form.Control.Feedback type="invalid">
                                {editErrors.base_price?.message}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="light"
                            onClick={closeEditModal}
                            disabled={updateMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending ? (
                                <>
                                    <Spinner size="sm" className="me-1" />
                                    Saving...
                                </>
                            ) : (
                                'Save Price'
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
}
