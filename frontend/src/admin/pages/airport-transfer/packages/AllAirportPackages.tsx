import { useState, useCallback, useMemo } from 'react';
import { Form, Row, Col, InputGroup, Dropdown, Badge } from 'react-bootstrap';
import type {
    AirportPackage,
    AirportPackageFilters,
} from '@/shared/types/airport-package.types';
import { airportPackageService } from '@/services/airportPackageService';
import {
    useAirportPackages,
    useDeleteAirportPackage,
    useToggleAirportPackageActive,
    airportPackageKeys,
} from '@/shared/hooks/queries/useAirportPackages';
import { useBulkDelete } from '@/shared/hooks/queries/useBulkDelete';
import DataTable, { type Column } from '@adminComponents/DataTable';
import FilterBox from '@adminComponents/ui/FilterBox';
import { PERMISSIONS } from '@/shared/config/permissions';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { usePermission, useTitle } from '@/shared/hooks';
import { FaPlane } from 'react-icons/fa6';

interface AllAirportPackagesProps {
    onAdd?: () => void;
    onEdit?: (pkg: AirportPackage) => void;
}

export default function AllAirportPackages({
    onAdd,
    onEdit,
}: AllAirportPackagesProps) {
    const title = useTitle('Airport Packages');
    const [filters, setFilters] = useState<AirportPackageFilters>({
        page: 1,
        per_page: 15,
    });
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<AirportPackage | null>(
        null
    );

    const { hasAnyPermission } = usePermission();
    const hasEdit = hasAnyPermission([
        PERMISSIONS.AIRPORT_TRANSFER.MANAGE_PACKAGES,
    ]);
    const hasDelete = hasAnyPermission([PERMISSIONS.AIRPORT_TRANSFER.DELETE]);
    const hasActions = hasEdit || hasDelete;

    const { data: response, isLoading, isError } = useAirportPackages(filters);
    const deleteMutation = useDeleteAirportPackage();
    const toggleActiveMutation = useToggleAirportPackageActive();

    const { bulkDelete, isBulkDeleting } = useBulkDelete({
        deleteFn: (id: string) => airportPackageService.delete(id),
        invalidateKeys: [airportPackageKeys.lists()],
        entityName: 'package',
        onSuccess: () => setSelectedIds([]),
    });

    const packages = useMemo<AirportPackage[]>(
        () => response?.data ?? [],
        [response]
    );
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
            prev.length === packages.length ? [] : packages.map(p => p.id)
        );
    }, [packages]);

    const toggleOne = useCallback((id: string | number) => {
        setSelectedIds(prev =>
            prev.includes(String(id))
                ? prev.filter(x => x !== String(id))
                : [...prev, String(id)]
        );
    }, []);

    const getDirectionBadges = (pkg: AirportPackage) => {
        const badges = [];
        if (pkg.is_available_for_pickup && pkg.is_available_for_dropoff) {
            badges.push(
                <Badge key="both" bg="primary" className="me-1">
                    Pickup &amp; Dropoff
                </Badge>
            );
        } else if (pkg.is_available_for_pickup) {
            badges.push(
                <Badge key="pickup" bg="info" className="me-1">
                    Pickup
                </Badge>
            );
        } else if (pkg.is_available_for_dropoff) {
            badges.push(
                <Badge key="dropoff" bg="success" className="me-1">
                    Dropoff
                </Badge>
            );
        }
        return badges;
    };

    const columns: Column<AirportPackage>[] = [
        {
            key: 'name',
            label: 'Package',
            render: pkg => (
                <div className="d-flex align-items-center gap-2">
                    {pkg.package_photo ? (
                        <img
                            src={pkg.package_photo.urls.thumb}
                            className="rounded"
                            style={{
                                width: 40,
                                height: 40,
                                objectFit: 'cover',
                                flexShrink: 0,
                            }}
                            alt={pkg.name}
                        />
                    ) : (
                        <div
                            className="rounded bg-light d-flex align-items-center justify-content-center text-muted"
                            style={{
                                width: 40,
                                height: 40,
                                flexShrink: 0,
                                fontSize: 18,
                            }}
                        >
                            <FaPlane />
                        </div>
                    )}
                    <div>
                        <span className="fw-bold">{pkg.name}</span>
                        {pkg.description && (
                            <>
                                <br />
                                <small className="text-muted">
                                    {pkg.description}
                                </small>
                            </>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'direction',
            label: 'Direction',
            render: pkg => <>{getDirectionBadges(pkg)}</>,
        },
        {
            key: 'auto_assign_vehicle',
            label: 'Auto-assign',
            render: pkg =>
                pkg.auto_assign_vehicle ? (
                    <Badge bg="secondary">Auto</Badge>
                ) : (
                    <span className="text-muted small">Manual</span>
                ),
        },
        {
            key: 'features',
            label: 'Features',
            render: pkg => (
                <span className="text-muted small">
                    {pkg.features.length} feature
                    {pkg.features.length !== 1 ? 's' : ''}
                </span>
            ),
        },
        {
            key: 'is_active',
            label: 'Active',
            render: pkg => (
                <div className="form-switch ps-0">
                    <input
                        className="form-check-input ms-0"
                        type="checkbox"
                        role="switch"
                        id={`active_${pkg.id}`}
                        checked={pkg.is_active}
                        disabled={toggleActiveMutation.isPending}
                        onChange={() => toggleActiveMutation.mutate(pkg.id)}
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
                      render: (pkg: AirportPackage) => (
                          <Dropdown align="end">
                              <Dropdown.Toggle
                                  as="button"
                                  className="btn btn-xs btn-outline-secondary"
                                  id={`actions-${pkg.id}`}
                              >
                                  Actions
                              </Dropdown.Toggle>
                              <Dropdown.Menu
                                  popperConfig={{ strategy: 'fixed' }}
                                  renderOnMount
                              >
                                  {onEdit && hasEdit && (
                                      <Dropdown.Item
                                          onClick={() => onEdit(pkg)}
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
                                                  setDeleteTarget(pkg)
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
                    permission={PERMISSIONS.AIRPORT_TRANSFER.MANAGE_PACKAGES}
                >
                    <button className="btn btn-primary btn-sm" onClick={onAdd}>
                        + Add Package
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
                                    placeholder="Package name..."
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
                title="All Packages"
                data={packages}
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
                emptyTitle="No packages found"
                emptyMessage="Add your first airport transfer package."
            />
        </>
    );
}
