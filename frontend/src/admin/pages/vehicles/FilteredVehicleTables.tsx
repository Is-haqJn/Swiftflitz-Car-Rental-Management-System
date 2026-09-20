/* AvailableVehicles.tsx */
// Drop-in replacement for AllVehicles but pre-filtered to 'available'
// Usage: Same props as AllVehicles

import { useState, useCallback, type ReactNode, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { GenericFilters, Vehicle, VehicleStatus } from '@/shared/types';
import {
    useVehicles,
    useDeleteVehicle,
    useToggleFeatured,
    useTogglePriceVisible,
} from '@/shared/hooks/queries/useVehicles';
import { SVGICON } from '@adminConstants/theme';
import DataTable, { type Column } from '@adminComponents/DataTable';
import { FaCar } from 'react-icons/fa';
import { useFormatCurrency } from '@/shared/hooks/queries/useSettings';
import { formatWithSymbol } from '@/shared/libs/currency';

interface Props {
    onAdd?: () => void;
    onEdit?: (vehicle: Vehicle) => void;
}

const STATUS_CONFIG: Record<VehicleStatus, { color: string; label: string }> = {
    available: { color: 'text-success', label: 'Available' },
    rented: { color: 'text-primary', label: 'Rented' },
    maintenance: { color: 'text-warning', label: 'Maintenance' },
    returned: { color: 'text-secondary', label: 'Returned' },
    pending_approval: { color: 'text-warning', label: 'Pending Approval' },
    unavailable: { color: 'text-secondary', label: 'Unavailable' },
    retired: { color: 'text-danger', label: 'Retired' },
};

function getThumb(vehicle: Vehicle): string | null {
    if (!vehicle.images?.length) return null;
    const primary = vehicle.images.find(img => img.is_primary);
    return (primary ?? vehicle.images[0]).urls.thumb;
}

/* Shared column builder */
function buildColumns(
    onEdit: ((v: Vehicle) => void) | undefined,
    setDeleteTarget: (v: Vehicle) => void,
    toggleFeaturedMutation: {
        isPending: boolean;
        mutate: (id: string) => void;
    },
    togglePriceVisibleMutation: {
        isPending: boolean;
        mutate: (id: string) => void;
    },
    formatCurrency: (n: number | null | undefined) => string
): Column<Vehicle>[] {
    return [
        {
            key: 'vehicle',
            label: 'Vehicle',
            render: vehicle => {
                const thumb = getThumb(vehicle);
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
            render: vehicle => {
                const cfg =
                    STATUS_CONFIG[vehicle.status] || STATUS_CONFIG.available;
                return (
                    <div className="d-flex align-items-center">
                        <i
                            className={`flaticon-web ${cfg.color} me-1`}
                            style={{ fontSize: 10 }}
                        />
                        {cfg.label}
                    </div>
                );
            },
        },
        {
            key: 'featured',
            label: 'Featured',
            render: vehicle => (
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
            ),
        },
        {
            key: 'price_visible',
            label: 'Price',
            render: vehicle => (
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
                        <button
                            type="button"
                            onClick={() => onEdit(vehicle)}
                            className="btn btn-primary shadow btn-xs sharp me-1"
                            title="Edit"
                        >
                            {SVGICON.pencil}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setDeleteTarget(vehicle)}
                        className="btn btn-danger shadow btn-xs sharp"
                        title="Delete"
                    >
                        {SVGICON.trash}
                    </button>
                </div>
            ),
        },
    ];
}

/* Shared table logic */
function VehicleFilteredTable({
    status,
    title,
    emptyTitle,
    emptyMessage,
    onAdd,
    onEdit,
}: {
    status: VehicleStatus;
    title: string;
    emptyTitle: string;
    emptyMessage: string;
    onAdd?: () => void;
    onEdit?: (vehicle: Vehicle) => void;
}) {
    const [filters, setFilters] = useState<GenericFilters>({
        per_page: 15,
        'filter[status]': status,
    });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);

    const formatCurrency = useFormatCurrency();
    const { data: response, isLoading, isError } = useVehicles(filters);
    const deleteMutation = useDeleteVehicle();
    const toggleFeaturedMutation = useToggleFeatured();
    const togglePriceVisibleMutation = useTogglePriceVisible();

    const vehicles = useMemo<Vehicle[]>(() => response?.data ?? [], [response]);
    // Ensure meta includes 'path' property for DataTable compatibility
    const meta = response?.meta ? { path: '', ...response.meta } : null;

    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }));
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

    const columns = buildColumns(
        onEdit,
        setDeleteTarget,
        toggleFeaturedMutation,
        togglePriceVisibleMutation,
        formatCurrency
    );

    const headerActions: ReactNode = onAdd ? (
        <button
            type="button"
            onClick={onAdd}
            className="btn btn-primary btn-sm"
        >
            {SVGICON.plus} Add Vehicle
        </button>
    ) : null;

    return (
        <DataTable
            title={title}
            data={vehicles}
            columns={columns}
            meta={meta}
            isLoading={isLoading}
            isError={isError}
            selectedIds={selectedIds}
            onSelectAll={toggleSelectAll}
            onSelectOne={toggleOne}
            deleteTarget={deleteTarget}
            deleteTargetName={deleteTarget?.name}
            onDeleteRequest={setDeleteTarget}
            onDeleteConfirm={handleDeleteConfirm}
            onDeleteCancel={() => setDeleteTarget(null)}
            isDeleting={deleteMutation.isPending}
            onPageChange={handlePageChange}
            headerActions={headerActions}
            emptyTitle={emptyTitle}
            emptyMessage={emptyMessage}
        />
    );
}

/* Named Exports */
export function AvailableVehicles({ onAdd, onEdit }: Props) {
    return (
        <VehicleFilteredTable
            status="available"
            title="Available Self-Drive"
            emptyTitle="No available self-drive vehicles"
            emptyMessage="All self-drive vehicles are currently rented or under maintenance."
            onAdd={onAdd}
            onEdit={onEdit}
        />
    );
}

export function RentedVehicles({ onEdit }: Pick<Props, 'onEdit'>) {
    return (
        <VehicleFilteredTable
            status="rented"
            title="Rented Self-Drive"
            emptyTitle="No rented self-drive vehicles"
            emptyMessage="No self-drive vehicles are currently out on rental."
            onEdit={onEdit}
        />
    );
}

export function MaintenanceVehicles({ onAdd, onEdit }: Props) {
    return (
        <VehicleFilteredTable
            status="maintenance"
            title="Self-Drive Under Maintenance"
            emptyTitle="No self-drive vehicles in maintenance"
            emptyMessage="No self-drive vehicles are currently under maintenance."
            onAdd={onAdd}
            onEdit={onEdit}
        />
    );
}
