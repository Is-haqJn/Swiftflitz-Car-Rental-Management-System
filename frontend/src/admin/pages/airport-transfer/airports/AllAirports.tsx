import { useState, useCallback, useMemo } from 'react';
import { Form, Row, Col, InputGroup, Dropdown } from 'react-bootstrap';
import type { Airport, AirportFilters } from '@/shared/types/airport.types';
import { airportService } from '@/services/airportService';
import {
    useAirports,
    useDeleteAirport,
    useToggleAirportActive,
    useSetAirportAsDefault,
    airportKeys,
} from '@/shared/hooks/queries/useAirports';
import { useBulkDelete } from '@/shared/hooks/queries/useBulkDelete';
import DataTable, { type Column } from '@adminComponents/DataTable';
import FilterBox from '@adminComponents/ui/FilterBox';
import { PERMISSIONS } from '@/shared/config/permissions';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { usePermission, useTitle } from '@/shared/hooks';
import { FaStar } from 'react-icons/fa6';

interface AllAirportsProps {
    onAdd?: () => void;
    onEdit?: (airport: Airport) => void;
}

export default function AllAirports({ onAdd, onEdit }: AllAirportsProps) {
    const title = useTitle('Airports');
    const [filters, setFilters] = useState<AirportFilters>({
        page: 1,
        per_page: 15,
    });
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<Airport | null>(null);

    const { hasAnyPermission } = usePermission();
    const hasEdit = hasAnyPermission([PERMISSIONS.AIRPORT_TRANSFER.EDIT]);
    const hasDelete = hasAnyPermission([PERMISSIONS.AIRPORT_TRANSFER.DELETE]);
    const hasActions = hasEdit || hasDelete;

    const { data: response, isLoading, isError } = useAirports(filters);
    const deleteMutation = useDeleteAirport();
    const toggleActiveMutation = useToggleAirportActive();
    const setAsDefaultMutation = useSetAirportAsDefault();

    const { bulkDelete, isBulkDeleting } = useBulkDelete({
        deleteFn: (id: string) => airportService.delete(id),
        invalidateKeys: [airportKeys.lists()],
        entityName: 'airport',
        onSuccess: () => setSelectedIds([]),
    });

    const airports = useMemo<Airport[]>(() => response?.data ?? [], [response]);
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

    const handleDeleteConfirm = useCallback(() => {
        if (!deleteTarget) return;
        deleteMutation.mutate(deleteTarget.id, {
            onSettled: () => setDeleteTarget(null),
        });
    }, [deleteTarget, deleteMutation]);

    const toggleSelectAll = useCallback(() => {
        setSelectedIds(prev =>
            prev.length === airports.length ? [] : airports.map(a => a.id)
        );
    }, [airports]);

    const toggleOne = useCallback((id: string | number) => {
        setSelectedIds(prev =>
            prev.includes(String(id))
                ? prev.filter(x => x !== String(id))
                : [...prev, String(id)]
        );
    }, []);

    const columns: Column<Airport>[] = [
        {
            key: 'name',
            label: 'Airport',
            render: airport => (
                <div>
                    <span className="fw-bold">{airport.name}</span>
                    <br />
                    <small className="text-muted">
                        {airport.city}, {airport.country}
                    </small>
                </div>
            ),
        },
        {
            key: 'is_active',
            label: 'Active',
            render: airport => (
                <div className="form-switch ps-0">
                    <input
                        className="form-check-input ms-0"
                        type="checkbox"
                        role="switch"
                        id={`active_${airport.id}`}
                        checked={airport.is_active}
                        disabled={toggleActiveMutation.isPending}
                        onChange={() => toggleActiveMutation.mutate(airport.id)}
                    />
                </div>
            ),
        },
        {
            key: 'is_default',
            label: 'Default',
            render: airport =>
                airport.is_default ? (
                    <span className="badge bg-success">
                        <FaStar className="me-1" /> Default
                    </span>
                ) : (
                    <button
                        type="button"
                        className="btn btn-xs btn-outline-secondary"
                        disabled={setAsDefaultMutation.isPending}
                        onClick={() => setAsDefaultMutation.mutate(airport.id)}
                        title="Set as default airport"
                    >
                        Set Default
                    </button>
                ),
        },
        ...(hasActions
            ? [
                  {
                      key: 'actions' as const,
                      label: 'Action',
                      className: 'text-end',
                      render: (airport: Airport) => (
                          <Dropdown align="end">
                              <Dropdown.Toggle
                                  as="button"
                                  className="btn btn-xs btn-outline-secondary"
                                  id={`actions-${airport.id}`}
                              >
                                  Actions
                              </Dropdown.Toggle>
                              <Dropdown.Menu
                                  popperConfig={{ strategy: 'fixed' }}
                                  renderOnMount
                              >
                                  {onEdit && hasEdit && (
                                      <Dropdown.Item
                                          onClick={() => onEdit(airport)}
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
                                                  setDeleteTarget(airport)
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
                    permission={PERMISSIONS.AIRPORT_TRANSFER.CREATE}
                >
                    <button className="btn btn-primary btn-sm" onClick={onAdd}>
                        + Add Airport
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
                                    placeholder="Airport name..."
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
                title="All Airports"
                data={airports}
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
                emptyTitle="No airports found"
                emptyMessage="Add your first airport to get started."
            />
        </>
    );
}
