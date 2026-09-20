import { useState, useCallback, useMemo } from 'react';
import { Form, Row, Col, Dropdown, Badge } from 'react-bootstrap';
import type {
    AirportLocation,
    AirportLocationFilters,
    AirportLocationType,
} from '@/shared/types/airport-location.types';
import { airportLocationService } from '@/services/airportLocationService';
import {
    useAirportLocations,
    useDeleteAirportLocation,
    useToggleAirportLocationActive,
    airportLocationKeys,
} from '@/shared/hooks/queries/useAirportLocations';
import { useBulkDelete } from '@/shared/hooks/queries/useBulkDelete';
import DataTable, { type Column } from '@adminComponents/DataTable';
import FilterBox from '@adminComponents/ui/FilterBox';
import { PERMISSIONS } from '@/shared/config/permissions';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { usePermission, useTitle } from '@/shared/hooks';

interface AllAirportLocationsProps {
    onAdd?: () => void;
    onEdit?: (location: AirportLocation) => void;
}

export default function AllAirportLocations({
    onAdd,
    onEdit,
}: AllAirportLocationsProps) {
    const title = useTitle('Airport Locations');
    const [filters, setFilters] = useState<AirportLocationFilters>({
        page: 1,
        per_page: 15,
    });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<AirportLocation | null>(
        null
    );

    const { hasAnyPermission } = usePermission();
    const hasEdit = hasAnyPermission([
        PERMISSIONS.AIRPORT_TRANSFER.MANAGE_LOCATIONS,
    ]);
    const hasDelete = hasAnyPermission([PERMISSIONS.AIRPORT_TRANSFER.DELETE]);
    const hasActions = hasEdit || hasDelete;

    const { data: response, isLoading, isError } = useAirportLocations(filters);
    const deleteMutation = useDeleteAirportLocation();
    const toggleActiveMutation = useToggleAirportLocationActive();

    const { bulkDelete, isBulkDeleting } = useBulkDelete({
        deleteFn: (id: string) => airportLocationService.delete(id),
        invalidateKeys: [airportLocationKeys.lists()],
        entityName: 'location',
        onSuccess: () => setSelectedIds([]),
    });

    const locations = useMemo<AirportLocation[]>(
        () => response?.data ?? [],
        [response]
    );
    const meta = response?.meta ?? null;

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
            prev.length === locations.length ? [] : locations.map(l => l.id)
        );
    }, [locations]);

    const toggleOne = useCallback((id: string | number) => {
        setSelectedIds(prev =>
            prev.includes(String(id))
                ? prev.filter(x => x !== String(id))
                : [...prev, String(id)]
        );
    }, []);

    const getLinkedTo = (location: AirportLocation) => {
        if (location.location_type === 'terminal') {
            return location.airport?.name ?? '-';
        }
        return location.branch?.name ?? '-';
    };

    const columns: Column<AirportLocation>[] = [
        {
            key: 'name',
            label: 'Name',
            render: location => (
                <span className="fw-semibold">{location.name}</span>
            ),
        },
        {
            key: 'location_type',
            label: 'Type',
            render: location => (
                <Badge
                    bg={
                        location.location_type === 'terminal'
                            ? 'info'
                            : 'success'
                    }
                >
                    {location.location_type}
                </Badge>
            ),
        },
        {
            key: 'linked_to',
            label: 'Linked To',
            render: location => (
                <small className="text-muted">{getLinkedTo(location)}</small>
            ),
        },
        {
            key: 'has_charge',
            label: 'Has Charge',
            render: location =>
                location.has_charge ? (
                    <Badge bg="warning" text="dark">
                        {location.charge_amount}
                    </Badge>
                ) : (
                    <span className="text-muted small">No</span>
                ),
        },
        {
            key: 'is_active',
            label: 'Active',
            render: location => (
                <div className="form-switch ps-0">
                    <input
                        className="form-check-input ms-0"
                        type="checkbox"
                        role="switch"
                        id={`active_${location.id}`}
                        checked={location.is_active}
                        disabled={toggleActiveMutation.isPending}
                        onChange={() =>
                            toggleActiveMutation.mutate(location.id)
                        }
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
                      render: (location: AirportLocation) => (
                          <Dropdown align="end">
                              <Dropdown.Toggle
                                  as="button"
                                  className="btn btn-xs btn-outline-secondary"
                                  id={`actions-${location.id}`}
                              >
                                  Actions
                              </Dropdown.Toggle>
                              <Dropdown.Menu
                                  popperConfig={{ strategy: 'fixed' }}
                                  renderOnMount
                              >
                                  {onEdit && hasEdit && (
                                      <Dropdown.Item
                                          onClick={() => onEdit(location)}
                                      >
                                          Edit
                                      </Dropdown.Item>
                                  )}
                                  {hasDelete && (
                                      <>
                                          <Dropdown.Divider />
                                          <Dropdown.Item
                                              className="text-danger"
                                              onClick={() =>
                                                  setDeleteTarget(location)
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
                <PermisssionGuard
                    permission={PERMISSIONS.AIRPORT_TRANSFER.MANAGE_LOCATIONS}
                >
                    <button className="btn btn-primary btn-sm" onClick={onAdd}>
                        + Add Location
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
                    <Col md={2}>
                        <Form.Label className="small fw-semibold text-muted mb-1">
                            Type
                        </Form.Label>
                        <Form.Select
                            className="tw:h-[2.9rem]"
                            value={filters.location_type ?? ''}
                            onChange={e =>
                                setFilters(prev => ({
                                    ...prev,
                                    location_type:
                                        (e.target
                                            .value as AirportLocationType) ||
                                        undefined,
                                    page: 1,
                                }))
                            }
                        >
                            <option value="">All Types</option>
                            <option value="terminal">Terminals</option>
                            <option value="area">Areas</option>
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
                title="All Locations"
                data={locations}
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
                emptyTitle="No locations found"
                emptyMessage="Add your first airport terminal or area location."
            />
        </>
    );
}
