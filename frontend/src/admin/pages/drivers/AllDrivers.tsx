import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Dropdown, Form, Row, Col, InputGroup } from 'react-bootstrap';
import { FaUser, FaTriangleExclamation } from 'react-icons/fa6';
import type { Driver, DriverFilters } from '@/shared/types/driver.types';
import { ROUTES } from '@/shared/routes';
import { driverService } from '@/services/driverService';
import {
    useDrivers,
    useDeleteDriver,
    driverKeys,
} from '@/shared/hooks/queries/useDrivers';
import { useBulkDelete } from '@/shared/hooks/queries/useBulkDelete';
import { usePermission, useTitle } from '@/shared/hooks';
import { PERMISSIONS } from '@/shared/config/permissions';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import DataTable, { type Column } from '@adminComponents/DataTable';
import FilterBox from '@adminComponents/ui/FilterBox';

/* Types */
interface AllDriversProps {
    onAdd?: () => void;
    onEdit?: (driver: Driver) => void;
}

/* Helpers */
function statusBadge(driver: Driver) {
    const map: Record<string, string> = {
        available: 'success',
        on_trip: 'primary',
        off_duty: 'secondary',
        suspended: 'danger',
        inactive: 'dark',
    };
    const label: Record<string, string> = {
        available: 'Available',
        on_trip: 'On Trip',
        off_duty: 'Off Duty',
        suspended: 'Suspended',
        inactive: 'Inactive',
    };
    const status =
        typeof driver.status === 'string'
            ? driver.status
            : (driver.status as { value: string }).value;
    return (
        <Badge bg={map[status] ?? 'secondary'}>{label[status] ?? status}</Badge>
    );
}

/* Component */
export default function AllDrivers({ onAdd, onEdit }: AllDriversProps) {
    const title = useTitle('Drivers');
    const navigate = useNavigate();
    const { hasAnyPermission } = usePermission();
    const hasEdit = hasAnyPermission([PERMISSIONS.DRIVERS.EDIT]);
    const hasDelete = hasAnyPermission([PERMISSIONS.DRIVERS.DELETE]);

    const [filters, setFilters] = useState<DriverFilters>({
        page: 1,
        per_page: 15,
    });
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);

    const { data: response, isLoading, isError } = useDrivers(filters);
    const deleteMutation = useDeleteDriver();
    const { bulkDelete, isBulkDeleting } = useBulkDelete({
        deleteFn: (id: string) => driverService.delete(id),
        invalidateKeys: [driverKeys.lists()],
        entityName: 'driver',
        onSuccess: () => setSelectedIds([]),
    });

    const drivers = useMemo<Driver[]>(() => response?.data ?? [], [response]);
    const meta = response?.meta ?? null;

    /* Handlers */
    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }));
    }, []);

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

    const handleClearFilters = useCallback(() => {
        setSearch('');
        setFilters({ page: 1, per_page: 15 });
    }, []);

    const toggleSelectAll = useCallback(() => {
        setSelectedIds(prev =>
            prev.length === drivers.length ? [] : drivers.map(d => d.id)
        );
    }, [drivers]);

    const toggleOne = useCallback((id: string | number) => {
        setSelectedIds(prev =>
            prev.includes(String(id))
                ? prev.filter(x => x !== String(id))
                : [...prev, String(id)]
        );
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (!deleteTarget) return;
        deleteMutation.mutate(deleteTarget.id, {
            onSettled: () => setDeleteTarget(null),
        });
    }, [deleteTarget, deleteMutation]);

    /* Columns */
    const columns: Column<Driver>[] = [
        {
            key: 'photo' as const,
            label: 'Photo',
            render: driver =>
                driver.driver_photo ? (
                    <img
                        src={
                            driver.driver_photo.urls.thumb ??
                            driver.driver_photo.urls.original
                        }
                        alt={driver.full_name}
                        // className="rounded-circle"
                        style={{ width: 80, height: 80, objectFit: 'cover' }}
                    />
                ) : (
                    <div
                        className=" bg-light border d-flex align-items-center justify-content-center"
                        style={{ width: 60, height: 60 }}
                    >
                        <FaUser size={18} className="text-muted" />
                    </div>
                ),
        },
        {
            key: 'name',
            label: 'Name',
            render: driver => (
                <div>
                    <span className="fw-semibold">{driver.full_name}</span>
                    <br />
                    <small className="text-muted">{driver.phone_number}</small>
                    {(driver.license_expired ||
                        driver.license_expires_soon) && (
                        <>
                            <br />
                            <small
                                className={
                                    driver.license_expired
                                        ? 'text-danger'
                                        : 'text-warning'
                                }
                            >
                                <FaTriangleExclamation className="me-1" />
                                {driver.license_expired
                                    ? 'License expired'
                                    : 'License expiring soon'}
                            </small>
                        </>
                    )}
                </div>
            ),
        },
        {
            key: 'license',
            label: 'License',
            render: driver => (
                <div>
                    <span>{driver.license_number}</span>
                    <br />
                    <small className="text-muted">{driver.license_class}</small>
                </div>
            ),
        },
        {
            key: 'expiry',
            label: 'Expires',
            render: driver => (
                <span
                    className={
                        driver.license_expired
                            ? 'text-danger fw-semibold'
                            : driver.license_expires_soon
                              ? 'text-warning fw-semibold'
                              : ''
                    }
                >
                    {driver.license_expiry_date}
                </span>
            ),
        },
        {
            key: 'services',
            label: 'Services',
            render: driver => (
                <div className="d-flex gap-1 flex-wrap">
                    {driver.available_for_chauffeur && (
                        <Badge bg="info" text="dark">
                            Chauffeur
                        </Badge>
                    )}
                    {driver.available_for_airport && (
                        <Badge bg="warning" text="dark">
                            Airport
                        </Badge>
                    )}
                    {!driver.available_for_chauffeur &&
                        !driver.available_for_airport && (
                            <span className="text-muted small">-</span>
                        )}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: driver => statusBadge(driver),
        },
        {
            key: 'actions' as const,
            label: 'Action',
            className: 'text-end',
            render: (driver: Driver) => (
                <Dropdown align="end">
                    <Dropdown.Toggle
                        variant=""
                        className="btn-link i-false p-0"
                    >
                        <svg
                            width="20px"
                            height="20px"
                            viewBox="0 0 24 24"
                            version="1.1"
                        >
                            <g
                                stroke="none"
                                strokeWidth="1"
                                fill="none"
                                fillRule="evenodd"
                            >
                                <rect x="0" y="0" width="24" height="24" />
                                <circle fill="#000000" cx="5" cy="12" r="2" />
                                <circle fill="#000000" cx="12" cy="12" r="2" />
                                <circle fill="#000000" cx="19" cy="12" r="2" />
                            </g>
                        </svg>
                    </Dropdown.Toggle>
                    <Dropdown.Menu
                        popperConfig={{ strategy: 'fixed' }}
                        renderOnMount
                    >
                        <Dropdown.Item
                            onClick={() =>
                                navigate(
                                    ROUTES.DASHBOARD.DRIVERS.VIEW(driver.id)
                                )
                            }
                        >
                            View
                        </Dropdown.Item>
                        {onEdit && hasEdit && (
                            <>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={() => onEdit(driver)}>
                                    Edit
                                </Dropdown.Item>
                            </>
                        )}
                        {hasDelete && (
                            <>
                                <Dropdown.Divider />
                                <Dropdown.Item
                                    className="text-danger"
                                    onClick={() => setDeleteTarget(driver)}
                                >
                                    Delete
                                </Dropdown.Item>
                            </>
                        )}
                    </Dropdown.Menu>
                </Dropdown>
            ),
        },
    ];

    const headerActions = (
        <PermisssionGuard permission={PERMISSIONS.DRIVERS.CREATE}>
            {onAdd && (
                <button className="btn btn-primary btn-sm" onClick={onAdd}>
                    + Add Driver
                </button>
            )}
        </PermisssionGuard>
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
                                    placeholder="Name, phone, license..."
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
                                value={filters.status ?? ''}
                                onChange={e =>
                                    setFilters(prev => ({
                                        ...prev,
                                        status:
                                            (e.target
                                                .value as DriverFilters['status']) ||
                                            undefined,
                                        page: 1,
                                    }))
                                }
                            >
                                <option value="">All Statuses</option>
                                <option value="available">Available</option>
                                <option value="on_trip">On Trip</option>
                                <option value="off_duty">Off Duty</option>
                                <option value="suspended">Suspended</option>
                                <option value="inactive">Inactive</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Service
                            </Form.Label>
                            <Form.Select
                                className="tw:h-[2.9rem]"
                                onChange={e => {
                                    const val = e.target.value;
                                    setFilters(prev => ({
                                        ...prev,
                                        available_for_chauffeur:
                                            val === 'chauffeur'
                                                ? true
                                                : undefined,
                                        available_for_airport:
                                            val === 'airport'
                                                ? true
                                                : undefined,
                                        page: 1,
                                    }));
                                }}
                            >
                                <option value="">All Services</option>
                                <option value="chauffeur">Chauffeur</option>
                                <option value="airport">Airport</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                License
                            </Form.Label>
                            <Form.Select
                                className="tw:h-[2.9rem]"
                                value={filters.license_status ?? ''}
                                onChange={e =>
                                    setFilters(prev => ({
                                        ...prev,
                                        license_status:
                                            (e.target
                                                .value as DriverFilters['license_status']) ||
                                            undefined,
                                        page: 1,
                                    }))
                                }
                            >
                                <option value="">All</option>
                                <option value="expiring_soon">
                                    Expiring Soon
                                </option>
                                <option value="expired">Expired</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
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
                title="All Drivers"
                data={drivers}
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
                        ? `${deleteTarget.first_name} ${deleteTarget.last_name}`
                        : undefined
                }
                onDeleteRequest={setDeleteTarget}
                onDeleteConfirm={handleDeleteConfirm}
                onDeleteCancel={() => setDeleteTarget(null)}
                isDeleting={deleteMutation.isPending}
                onPageChange={handlePageChange}
                headerActions={headerActions}
                emptyTitle="No drivers found"
                emptyMessage="Add your first driver to get started."
            />
        </>
    );
}
