import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectActiveBranchId } from '@/store/slices/activeBranchSlice';
import { Badge, Dropdown, Form, Row, Col, InputGroup } from 'react-bootstrap';
import { FaTruck, FaTriangleExclamation } from 'react-icons/fa6';
import type {
    FleetVehicle,
    FleetVehicleFilters,
    FleetVehicleStatus,
} from '@/shared/types/fleetVehicle.types';
import { ROUTES } from '@/shared/routes';
import { fleetVehicleService } from '@/services/fleetVehicleService';
import {
    useFleetVehicles,
    useDeleteFleetVehicle,
    fleetVehicleKeys,
} from '@/shared/hooks/queries/useFleetVehicles';
import { useBulkDelete } from '@/shared/hooks/queries/useBulkDelete';
import { usePermission, useTitle } from '@/shared/hooks';
import { PERMISSIONS } from '@/shared/config/permissions';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import DataTable, { type Column } from '@adminComponents/DataTable';
import FilterBox from '@adminComponents/ui/FilterBox';
import AssignServiceModal from './AssignServiceModal';

/* Types */
interface AllFleetVehiclesProps {
    onAdd?: () => void;
    onEdit?: (vehicle: FleetVehicle) => void;
}

/* Helpers */
const STATUS_VARIANT: Record<FleetVehicleStatus, string> = {
    available: 'success',
    on_trip: 'primary',
    maintenance: 'warning',
    inactive: 'secondary',
    retired: 'dark',
};

const STATUS_LABEL: Record<FleetVehicleStatus, string> = {
    available: 'Available',
    on_trip: 'On Trip',
    maintenance: 'Maintenance',
    inactive: 'Inactive',
    retired: 'Retired',
};

function statusBadge(vehicle: FleetVehicle) {
    const s = (
        typeof vehicle.status === 'string'
            ? vehicle.status
            : (vehicle.status as { value: string }).value
    ) as FleetVehicleStatus;
    return (
        <Badge bg={STATUS_VARIANT[s] ?? 'secondary'}>
            {STATUS_LABEL[s] ?? s}
        </Badge>
    );
}

/* Component */
export default function AllFleetVehicles({
    onAdd,
    onEdit,
}: AllFleetVehiclesProps) {
    const title = useTitle('Chauffeured Fleet');
    const navigate = useNavigate();
    const activeBranchId = useSelector(selectActiveBranchId);
    const { hasAnyPermission } = usePermission();
    const hasEdit = hasAnyPermission([PERMISSIONS.FLEET_VEHICLES.EDIT]);
    const hasDelete = hasAnyPermission([PERMISSIONS.FLEET_VEHICLES.DELETE]);

    const [filters, setFilters] = useState<FleetVehicleFilters>({
        page: 1,
        per_page: 15,
        ...(activeBranchId ? { 'filter[branch_id]': activeBranchId } : {}),
    });

    useEffect(() => {
        setFilters(prev => ({
            ...prev,
            'filter[branch_id]': activeBranchId ?? undefined,
            page: 1,
        }));
    }, [activeBranchId]);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<FleetVehicle | null>(null);
    const [assignTarget, setAssignTarget] = useState<FleetVehicle | null>(null);

    const { data: response, isLoading, isError } = useFleetVehicles(filters);
    const deleteMutation = useDeleteFleetVehicle();
    const { bulkDelete, isBulkDeleting } = useBulkDelete({
        deleteFn: (id: string) => fleetVehicleService.delete(id),
        invalidateKeys: [fleetVehicleKeys.lists()],
        entityName: 'fleet vehicle',
        onSuccess: () => setSelectedIds([]),
    });

    const vehicles = useMemo<FleetVehicle[]>(
        () => response?.data ?? [],
        [response]
    );
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
            prev.length === vehicles.length ? [] : vehicles.map(v => v.id)
        );
    }, [vehicles]);

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
    const columns: Column<FleetVehicle>[] = [
        {
            key: 'photo' as const,
            label: 'Photo',
            render: vehicle => {
                const thumb = vehicle.photos?.[0]?.urls?.thumb;
                return thumb ? (
                    <img
                        src={thumb}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        style={{ width: 60, height: 60, objectFit: 'cover' }}
                    />
                ) : (
                    <div
                        className="bg-light border d-flex align-items-center justify-content-center"
                        style={{ width: 60, height: 60 }}
                    >
                        <FaTruck size={18} className="text-muted" />
                    </div>
                );
            },
        },
        {
            key: 'vehicle',
            label: 'Vehicle',
            render: vehicle => (
                <div>
                    <span className="fw-semibold">
                        {vehicle.make} {vehicle.model}
                    </span>
                    <br />
                    <small className="text-muted">
                        {vehicle.year} · {vehicle.color}
                    </small>
                    {(() => {
                        const insExpired =
                            vehicle.has_insurance && vehicle.insurance_expired;
                        const insWarn =
                            vehicle.has_insurance &&
                            vehicle.insurance_expires_soon;
                        const rwExpired =
                            vehicle.has_roadworthy &&
                            vehicle.roadworthy_expired;
                        const rwWarn =
                            vehicle.has_roadworthy &&
                            vehicle.roadworthy_expires_soon;
                        if (!insExpired && !insWarn && !rwExpired && !rwWarn)
                            return null;
                        return (
                            <>
                                <br />
                                {(insExpired || insWarn) && (
                                    <small className="text-danger d-block">
                                        <FaTriangleExclamation className="me-1" />
                                        {insExpired
                                            ? 'Ins expired'
                                            : 'Ins expiring soon'}
                                    </small>
                                )}
                                {(rwExpired || rwWarn) && (
                                    <small className="text-danger d-block">
                                        <FaTriangleExclamation className="me-1" />
                                        {rwExpired
                                            ? 'RW expired'
                                            : 'RW expiring soon'}
                                    </small>
                                )}
                            </>
                        );
                    })()}
                </div>
            ),
        },
        {
            key: 'license_plate',
            label: 'Plate / Seats',
            render: vehicle => (
                <div>
                    <span className="fw-semibold">{vehicle.license_plate}</span>
                    <br />
                    <small className="text-muted">{vehicle.seats} seats</small>
                </div>
            ),
        },
        {
            key: 'services',
            label: 'Services',
            render: vehicle => {
                const assignments = vehicle.service_assignments ?? [];
                const hasAirport = assignments.some(
                    a => a.service_type === 'airport' && a.is_active
                );
                const hasChauffeur = assignments.some(
                    a => a.service_type === 'chauffeur' && a.is_active
                );
                return (
                    <div className="d-flex gap-1 flex-wrap">
                        {hasAirport && (
                            <Badge bg="warning" text="dark">
                                Airport
                            </Badge>
                        )}
                        {hasChauffeur && (
                            <Badge bg="info" text="dark">
                                Chauffeur
                            </Badge>
                        )}
                        {!hasAirport && !hasChauffeur && (
                            <span className="text-muted small">-</span>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'branch',
            label: 'Branch',
            render: vehicle => (
                <span className="text-muted small">
                    {vehicle.branch?.name ?? '-'}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: vehicle => statusBadge(vehicle),
        },
        {
            key: 'actions' as const,
            label: 'Action',
            className: 'text-end',
            render: (vehicle: FleetVehicle) => (
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
                                    ROUTES.DASHBOARD.FLEET_VEHICLES.VIEW(
                                        vehicle.id
                                    )
                                )
                            }
                        >
                            View
                        </Dropdown.Item>
                        {hasEdit && (
                            <>
                                <Dropdown.Divider />
                                <Dropdown.Item
                                    onClick={() => setAssignTarget(vehicle)}
                                >
                                    Assign Service
                                </Dropdown.Item>
                            </>
                        )}
                        {onEdit && hasEdit && (
                            <>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={() => onEdit(vehicle)}>
                                    Edit
                                </Dropdown.Item>
                            </>
                        )}
                        {hasDelete && (
                            <>
                                <Dropdown.Divider />
                                <Dropdown.Item
                                    className="text-danger"
                                    onClick={() => setDeleteTarget(vehicle)}
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
        <PermisssionGuard permission={PERMISSIONS.FLEET_VEHICLES.CREATE}>
            {onAdd && (
                <button className="btn btn-primary btn-sm" onClick={onAdd}>
                    + Add Chauffeured Vehicle
                </button>
            )}
        </PermisssionGuard>
    );

    return (
        <>
            {title}
            <AssignServiceModal
                vehicle={assignTarget}
                show={!!assignTarget}
                onHide={() => setAssignTarget(null)}
            />
            <FilterBox>
                <Form onSubmit={handleSearch}>
                    <Row className="g-3 align-items-end">
                        <Col md={4}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Search
                            </Form.Label>
                            <InputGroup>
                                <Form.Control
                                    placeholder="Make, model, plate..."
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
                                value={filters['filter[status]'] ?? ''}
                                onChange={e =>
                                    setFilters(prev => ({
                                        ...prev,
                                        'filter[status]':
                                            (e.target
                                                .value as FleetVehicleStatus) ||
                                            undefined,
                                        page: 1,
                                    }))
                                }
                            >
                                <option value="">All Statuses</option>
                                <option value="available">Available</option>
                                <option value="on_trip">On Trip</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="inactive">Inactive</option>
                                <option value="retired">Retired</option>
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
                title="Chauffeured Fleet"
                data={vehicles}
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
                        ? `${deleteTarget.make} ${deleteTarget.model} (${deleteTarget.license_plate})`
                        : undefined
                }
                onDeleteRequest={setDeleteTarget}
                onDeleteConfirm={handleDeleteConfirm}
                onDeleteCancel={() => setDeleteTarget(null)}
                isDeleting={deleteMutation.isPending}
                onPageChange={handlePageChange}
                headerActions={headerActions}
                emptyTitle="No fleet vehicles found"
                emptyMessage="Add your first fleet vehicle to get started."
            />
        </>
    );
}
