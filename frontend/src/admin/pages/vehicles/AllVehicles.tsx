import {
    useState,
    useCallback,
    useEffect,
    type ReactNode,
    useMemo,
} from 'react';
import { useSelector } from 'react-redux';
import StatusChangeDropdown from '@adminPages/vehicles/StatusChangeDropdown';
import VehicleExpenseModal from '@adminPages/vehicles/VehicleExpenseModal';
import { Link } from 'react-router-dom';
import { Form, Row, Col, InputGroup } from 'react-bootstrap';
import type { Vehicle, VehicleFilters } from '@/shared/types/vehicles.types';
import { vehicleService } from '@/services';
import {
    useVehicles,
    useDeleteVehicle,
    useToggleFeatured,
    useTogglePriceVisible,
    vehicleKeys,
} from '@/shared/hooks/queries/useVehicles';
import { useActiveBranches } from '@/shared/hooks/queries/useBranches';
import { selectAuthUser } from '@/store/slices/authSlice';
import { selectActiveBranchId } from '@/store/slices/activeBranchSlice';
import { useBulkDelete } from '@/shared/hooks/queries/useBulkDelete';
import { useQueueExport } from '@/shared/hooks/queries/useExports';
import { useConfirm } from '@/shared/hooks/useConfirm';
import { useTitle } from '@/shared/hooks';
import { SVGICON } from '@adminConstants/theme';
import { PERMISSIONS } from '@/shared/config/permissions';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import DataTable, { type Column } from '@adminComponents/DataTable';
import { FaCar } from 'react-icons/fa';
import FilterBox from '@adminComponents/ui/FilterBox';
import DatePickerField from '@adminComponents/DatePickerField';
import { useFormatCurrency } from '@/shared/hooks/queries/useSettings';
import { formatWithSymbol } from '@/shared/libs/currency';

/* Types */
interface AllVehiclesProps {
    onAdd?: () => void;
    onEdit?: (vehicle: Vehicle) => void;
}

/* Helper */
function getVehicleThumb(vehicle: Vehicle): string | null {
    if (!vehicle.images || vehicle.images.length === 0) return null;
    const primary = vehicle.images.find(img => img.is_primary);
    return (primary ?? vehicle.images[0]).urls.thumb;
}

/* Main Component */
export default function AllVehicles({ onAdd, onEdit }: AllVehiclesProps) {
    const formatCurrency = useFormatCurrency();
    const title = useTitle('Self-Drive Fleet');
    const authUser = useSelector(selectAuthUser);
    const activeBranchId = useSelector(selectActiveBranchId);
    const userBranches = authUser?.branches ?? [];
    const hasGlobalBranchAccess = !userBranches.length;
    const { data: branchesResponse } = useActiveBranches();
    const allBranches = branchesResponse?.data ?? [];

    const [filters, setFilters] = useState<VehicleFilters>({
        page: 1,
        per_page: 15,
        sort_by: 'created_at',
        sort_order: 'desc',
        ...(activeBranchId ? { branch_id: activeBranchId } : {}),
    });

    useEffect(() => {
        setFilters(prev => ({
            ...prev,
            branch_id: activeBranchId ?? undefined,
            page: 1,
        }));
    }, [activeBranchId]);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
    const [expenseTarget, setExpenseTarget] = useState<Vehicle | null>(null);

    const { data: response, isLoading, isError } = useVehicles(filters);
    const deleteMutation = useDeleteVehicle();
    const { bulkDelete, isBulkDeleting } = useBulkDelete({
        deleteFn: id => vehicleService.delete(id),
        invalidateKeys: [vehicleKeys.lists()],
        entityName: 'vehicle',
        onSuccess: () => setSelectedIds([]),
    });
    const toggleFeaturedMutation = useToggleFeatured();
    const togglePriceVisibleMutation = useTogglePriceVisible();
    const queueExportMutation = useQueueExport();
    const { confirm } = useConfirm();

    const vehicles = useMemo<Vehicle[]>(() => response?.data ?? [], [response]);
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

    const handleStatusFilter = useCallback((value: string) => {
        setFilters(prev => ({
            ...prev,
            status: (value as VehicleFilters['status']) || undefined,
            page: 1,
        }));
    }, []);

    const handleDateFilter = useCallback(
        (key: 'from_date' | 'to_date', value: string) => {
            setFilters(prev => ({
                ...prev,
                [key]: value || undefined,
                page: 1,
            }));
        },
        []
    );

    const handleExpiryFilter = useCallback(
        (
            key: 'roadworthy_expiry_status' | 'insurance_expiry_status',
            value: string
        ) => {
            setFilters(prev => ({
                ...prev,
                [key]: (value as VehicleFilters[typeof key]) || undefined,
                page: 1,
            }));
        },
        []
    );

    const handleClearFilters = useCallback(() => {
        setSearch('');
        setFilters({
            per_page: 15,
            page: 1,
            sort_by: 'created_at',
            sort_order: 'desc',
            roadworthy_expiry_status: undefined,
            insurance_expiry_status: undefined,
        });
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

    /* Column Definitions */
    const columns: Column<Vehicle>[] = [
        {
            key: 'vehicle',
            label: 'Vehicle',
            render: vehicle => {
                const thumb = getVehicleThumb(vehicle);
                return (
                    <div className="d-flex align-items-center">
                        {thumb ? (
                            <img
                                src={thumb}
                                className="rounded me-2"
                                width="50"
                                height="36"
                                alt={vehicle.name}
                                style={{ objectFit: 'cover' }}
                            />
                        ) : (
                            <div
                                className="rounded me-2 bg-light d-flex align-items-center justify-content-center"
                                style={{ width: 50, height: 36 }}
                            >
                                <FaCar className="text-muted" />
                            </div>
                        )}
                        <div>
                            <span className="fw-bold w-space-no">
                                {vehicle.name}
                            </span>
                            <br />
                            <small className="text-muted">
                                {vehicle.license_plate}
                            </small>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'make_model',
            label: 'Make / Model',
            render: vehicle => (
                <span className="w-space-no">
                    {vehicle.make} {vehicle.model}
                </span>
            ),
        },
        {
            key: 'year',
            label: 'Year',
            render: vehicle => vehicle.year,
        },
        {
            key: 'daily_rate',
            label: 'Daily Rate',
            render: vehicle => (
                <strong>
                    {vehicle.daily_rate != null
                        ? vehicle.branch?.currency_symbol
                            ? formatWithSymbol(
                                  Number(vehicle.daily_rate),
                                  vehicle.branch.currency_symbol
                              )
                            : formatCurrency(Number(vehicle.daily_rate))
                        : '-'}
                </strong>
            ),
        },
        {
            key: 'odometer',
            label: 'Odometer',
            render: vehicle => (
                <>{Number(vehicle.odometer).toLocaleString()} km</>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: vehicle => (
                <PermisssionGuard
                    permission={PERMISSIONS.VEHICLES.MANAGE_AVAILABILITY}
                    fallback={
                        <span className="badge bg-secondary text-capitalize">
                            {vehicle.status}
                        </span>
                    }
                >
                    <StatusChangeDropdown vehicle={vehicle} />
                </PermisssionGuard>
            ),
        },
        {
            key: 'featured',
            label: 'Featured',
            render: vehicle => (
                <PermisssionGuard
                    permission={PERMISSIONS.VEHICLES.MANAGE_AVAILABILITY}
                    fallback={
                        <span className="text-muted small">
                            {vehicle.is_featured ? 'Yes' : 'No'}
                        </span>
                    }
                >
                    <div className="form-check form-switch">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id={`featured_${vehicle.id}`}
                            checked={vehicle.is_featured}
                            disabled={toggleFeaturedMutation.isPending}
                            onChange={() =>
                                toggleFeaturedMutation.mutate(vehicle.id)
                            }
                        />
                    </div>
                </PermisssionGuard>
            ),
        },
        {
            key: 'price_visible',
            label: 'Price',
            render: vehicle => (
                <PermisssionGuard
                    permission={PERMISSIONS.VEHICLES.MANAGE_AVAILABILITY}
                    fallback={
                        <span className="text-muted small">
                            {(vehicle.price_visible ?? true) ? 'Visible' : 'Hidden'}
                        </span>
                    }
                >
                    <div className="form-check form-switch">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id={`price_visible_${vehicle.id}`}
                            checked={vehicle.price_visible ?? true}
                            disabled={togglePriceVisibleMutation.isPending}
                            onChange={() =>
                                togglePriceVisibleMutation.mutate(vehicle.id)
                            }
                        />
                    </div>
                </PermisssionGuard>
            ),
        },
        {
            key: 'actions',
            label: 'Action',
            className: 'text-end',
            render: vehicle => (
                <div className="d-flex justify-content-end">
                    <Link
                        to={`/management/vehicles/${vehicle.id}`}
                        className="btn btn-info shadow btn-xs sharp me-1"
                        title="View"
                    >
                        {SVGICON.eye}
                    </Link>
                    {onEdit && (
                        <PermisssionGuard
                            permission={PERMISSIONS.VEHICLES.EDIT}
                        >
                            <button
                                type="button"
                                onClick={() => onEdit(vehicle)}
                                className="btn btn-primary shadow btn-xs sharp me-1"
                                title="Edit"
                            >
                                {SVGICON.pencil}
                            </button>
                        </PermisssionGuard>
                    )}
                    <PermisssionGuard
                        permission={PERMISSIONS.VEHICLES.MANAGE_MAINTENANCE}
                    >
                        <button
                            type="button"
                            onClick={() => setExpenseTarget(vehicle)}
                            className="btn btn-warning shadow btn-xs sharp me-1"
                            title="Add Expense"
                        >
                            {SVGICON.plus}
                        </button>
                    </PermisssionGuard>
                    <PermisssionGuard permission={PERMISSIONS.VEHICLES.DELETE}>
                        <button
                            type="button"
                            onClick={() => setDeleteTarget(vehicle)}
                            className="btn btn-danger shadow btn-xs sharp"
                            title="Delete"
                        >
                            {SVGICON.trash}
                        </button>
                    </PermisssionGuard>
                </div>
            ),
        },
    ];

    /* Header Actions */
    const headerActions: ReactNode = (
        <div className="d-flex gap-2">
            <PermisssionGuard
                permission={PERMISSIONS.EXPORTS.DOWNLOAD_VEHICLES}
            >
                <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    disabled={queueExportMutation.isPending}
                    onClick={async () => {
                        const ok = await confirm({
                            title: 'Export vehicles?',
                            message:
                                'An Excel file will be generated in the background. You will be notified when it is ready to download.',
                            confirmText: 'Export',
                            confirmVariant: 'primary',
                        });
                        if (ok) {
                            queueExportMutation.mutate({
                                type: 'vehicles',
                                format: 'xlsx',
                                filters: {
                                    status: filters.status,
                                    search: filters.search,
                                },
                            });
                        }
                    }}
                >
                    {queueExportMutation.isPending ? 'Exporting…' : '⬇ Export'}
                </button>
            </PermisssionGuard>
            {onAdd && (
                <PermisssionGuard permission={PERMISSIONS.VEHICLES.CREATE}>
                    <button
                        type="button"
                        onClick={onAdd}
                        className="btn btn-primary btn-sm"
                    >
                        {SVGICON.plus} Add Vehicle
                    </button>
                </PermisssionGuard>
            )}
        </div>
    );

    /* Render */
    return (
        <>
            {title}
            {/* Filter Box */}
            <FilterBox title="Filter Self-Drive Fleet">
                <Form onSubmit={handleSearch}>
                    <Row className="g-3 align-items-end">
                        <Col md={4}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Search
                            </Form.Label>
                            <InputGroup>
                                <Form.Control
                                    placeholder="Name or license plate…"
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
                                onChange={e =>
                                    handleStatusFilter(e.target.value)
                                }
                                value={filters.status ?? ''}
                            >
                                <option value="">All Statuses</option>
                                <option value="available">Available</option>
                                <option value="rented">Rented</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="pending_approval">
                                    Pending Approval
                                </option>
                                <option value="unavailable">Unavailable</option>
                                <option value="retired">Retired</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                From
                            </Form.Label>
                            <DatePickerField
                                value={
                                    (
                                        filters as VehicleFilters & {
                                            from_date?: string;
                                        }
                                    ).from_date ?? ''
                                }
                                onChange={val =>
                                    handleDateFilter('from_date', val)
                                }
                                placeholder="Start date"
                            />
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                To
                            </Form.Label>
                            <DatePickerField
                                value={
                                    (
                                        filters as VehicleFilters & {
                                            to_date?: string;
                                        }
                                    ).to_date ?? ''
                                }
                                onChange={val =>
                                    handleDateFilter('to_date', val)
                                }
                                placeholder="End date"
                            />
                        </Col>
                        <Col md={1}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Per Page
                            </Form.Label>
                            <Form.Select
                                className="tw:h-[2.9rem]"
                                value={filters.per_page ?? 15}
                                onChange={e =>
                                    setFilters(prev => ({
                                        ...prev,
                                        per_page: Number(e.target.value),
                                        page: 1,
                                    }))
                                }
                            >
                                <option value={10}>10</option>
                                <option value={15}>15</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
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
                    <Row className="g-3 align-items-end mt-0">
                        <Col md={3}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Roadworthy Expiry
                            </Form.Label>
                            <Form.Select
                                className="tw:h-[2.9rem]"
                                value={filters.roadworthy_expiry_status ?? ''}
                                onChange={e =>
                                    handleExpiryFilter(
                                        'roadworthy_expiry_status',
                                        e.target.value
                                    )
                                }
                            >
                                <option value="">All</option>
                                <option value="expiring_soon">
                                    Expiring Soon (≤30 days)
                                </option>
                                <option value="expired">Expired</option>
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Insurance Expiry
                            </Form.Label>
                            <Form.Select
                                className="tw:h-[2.9rem]"
                                value={filters.insurance_expiry_status ?? ''}
                                onChange={e =>
                                    handleExpiryFilter(
                                        'insurance_expiry_status',
                                        e.target.value
                                    )
                                }
                            >
                                <option value="">All</option>
                                <option value="expiring_soon">
                                    Expiring Soon (≤30 days)
                                </option>
                                <option value="expired">Expired</option>
                            </Form.Select>
                        </Col>
                        {/* Branch filter - always shown when branches exist */}
                        {(hasGlobalBranchAccess
                            ? allBranches.length > 0
                            : userBranches.length > 0) && (
                            <Col md={3}>
                                <Form.Label className="small fw-semibold text-muted mb-1">
                                    Branch
                                </Form.Label>
                                {hasGlobalBranchAccess ? (
                                    // Admin / super_admin: full dropdown
                                    <Form.Select
                                        className="tw:h-[2.9rem]"
                                        value={filters.branch_id ?? ''}
                                        onChange={e =>
                                            setFilters(prev => ({
                                                ...prev,
                                                branch_id:
                                                    e.target.value || undefined,
                                                page: 1,
                                            }))
                                        }
                                    >
                                        <option value="">All Branches</option>
                                        {allBranches.map(b => (
                                            <option key={b.id} value={b.id}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                ) : userBranches.length === 1 ? (
                                    // Single-branch user: informational display
                                    <Form.Control
                                        readOnly
                                        value={userBranches[0].name}
                                        className="bg-light"
                                    />
                                ) : (
                                    // Multi-branch user: dropdown restricted to their branches
                                    <Form.Select
                                        className="tw:h-[2.9rem]"
                                        value={filters.branch_id ?? ''}
                                        onChange={e =>
                                            setFilters(prev => ({
                                                ...prev,
                                                branch_id:
                                                    e.target.value || undefined,
                                                page: 1,
                                            }))
                                        }
                                    >
                                        <option value="">
                                            All My Branches
                                        </option>
                                        {userBranches.map(b => (
                                            <option key={b.id} value={b.id}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                )}
                            </Col>
                        )}
                    </Row>
                </Form>
            </FilterBox>

            <DataTable
                title="Self-Drive Fleet"
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
                deleteTargetName={deleteTarget?.name}
                onDeleteRequest={setDeleteTarget}
                onDeleteConfirm={handleDeleteConfirm}
                onDeleteCancel={() => setDeleteTarget(null)}
                isDeleting={deleteMutation.isPending}
                onPageChange={handlePageChange}
                headerActions={headerActions}
                emptyTitle="No vehicles found"
                emptyMessage="Add your first vehicle to get started."
            />

            {expenseTarget && (
                <VehicleExpenseModal
                    mode="petty"
                    show={!!expenseTarget}
                    onHide={() => setExpenseTarget(null)}
                    vehicleId={expenseTarget.id}
                    vehicleName={expenseTarget.name}
                />
            )}
        </>
    );
}
