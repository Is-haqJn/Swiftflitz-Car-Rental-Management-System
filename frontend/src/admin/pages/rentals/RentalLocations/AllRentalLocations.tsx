import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Form, Row, Col, InputGroup, Badge } from 'react-bootstrap';
import type {
    RentalLocation,
    RentalLocationFilters,
} from '@/shared/types/rental-location.types';
import { rentalLocationService } from '@/services/rentalLocationService';
import {
    useRentalLocations,
    useDeleteRentalLocation,
    rentalLocationKeys,
} from '@/shared/hooks/queries/useRentalLocations';
import { useActiveBranches } from '@/shared/hooks/queries/useBranches';
import { useBulkDelete } from '@/shared/hooks/queries/useBulkDelete';
import { selectAuthUser } from '@/store/slices/authSlice';
import { useTitle } from '@/shared/hooks';
import { SVGICON } from '@adminConstants/theme';
import { PERMISSIONS } from '@/shared/config/permissions';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import DataTable, { type Column } from '@adminComponents/DataTable';
import FilterBox from '@adminComponents/ui/FilterBox';
import { useFormatCurrency } from '@/shared/hooks/queries/useSettings';

/* Props */
interface AllRentalLocationsProps {
    onAdd?: () => void;
    onEdit?: (location: RentalLocation) => void;
}

/* Main Component */
export default function AllRentalLocations({
    onAdd,
    onEdit,
}: AllRentalLocationsProps) {
    const formatCurrency = useFormatCurrency();
    const title = useTitle('Rental Locations');
    const authUser = useSelector(selectAuthUser);

    const userBranches = authUser?.branches ?? [];
    const hasGlobalBranchAccess = !userBranches.length;

    const { data: branchesResponse } = useActiveBranches();
    const allBranches = branchesResponse?.data ?? [];

    const [filters, setFilters] = useState<RentalLocationFilters>({
        page: 1,
        per_page: 15,
    });
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<RentalLocation | null>(
        null
    );

    const { data: response, isLoading, isError } = useRentalLocations(filters);
    const deleteMutation = useDeleteRentalLocation();
    const { bulkDelete, isBulkDeleting } = useBulkDelete({
        deleteFn: id => rentalLocationService.delete(id),
        invalidateKeys: [rentalLocationKeys.lists()],
        entityName: 'location',
        onSuccess: () => setSelectedIds([]),
    });

    const locations = useMemo<RentalLocation[]>(
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
                'filter[search]': search || undefined,
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

    const handleDeleteConfirm = useCallback(() => {
        if (!deleteTarget) return;
        deleteMutation.mutate(deleteTarget.id, {
            onSettled: () => setDeleteTarget(null),
        });
    }, [deleteTarget, deleteMutation]);

    /* Columns */
    const columns: Column<RentalLocation>[] = [
        {
            key: 'name',
            label: 'Location Name',
            render: location => (
                <div>
                    <span className="fw-semibold">{location.name}</span>
                    {location.is_default && (
                        <Badge bg="primary" className="ms-2 small">
                            Default
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            key: 'branch',
            label: 'Branch',
            render: location => (
                <span className="text-muted small">
                    {location.branch?.name ?? '-'}
                </span>
            ),
        },
        {
            key: 'pickup_charge',
            label: 'Pickup Charge',
            render: location =>
                location.pickup_charge != null ? (
                    formatCurrency(Number(location.pickup_charge))
                ) : (
                    <span className="text-muted">-</span>
                ),
        },
        {
            key: 'dropoff_charge',
            label: 'Dropoff Charge',
            render: location =>
                location.dropoff_charge != null ? (
                    formatCurrency(Number(location.dropoff_charge))
                ) : (
                    <span className="text-muted">-</span>
                ),
        },
        {
            key: 'visibility',
            label: 'Visibility',
            render: location => (
                <div className="d-flex gap-1">
                    {location.is_pickup && (
                        <Badge bg="info" className="small">
                            Pickup
                        </Badge>
                    )}
                    {location.is_dropoff && (
                        <Badge bg="secondary" className="small">
                            Dropoff
                        </Badge>
                    )}
                    {!location.is_pickup && !location.is_dropoff && (
                        <span className="text-muted small">None</span>
                    )}
                </div>
            ),
        },
        {
            key: 'is_active',
            label: 'Status',
            render: location => (
                <Badge bg={location.is_active ? 'success' : 'danger'}>
                    {location.is_active ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            label: 'Action',
            className: 'text-end',
            render: location => (
                <div className="d-flex justify-content-end gap-1">
                    {onEdit && (
                        <PermisssionGuard
                            permission={PERMISSIONS.RENTALS.MANAGE_LOCATIONS}
                        >
                            <button
                                type="button"
                                onClick={() => onEdit(location)}
                                className="btn btn-primary shadow btn-xs sharp"
                                title="Edit"
                            >
                                {SVGICON.pencil}
                            </button>
                        </PermisssionGuard>
                    )}
                    <PermisssionGuard
                        permission={PERMISSIONS.RENTALS.MANAGE_LOCATIONS}
                    >
                        <button
                            type="button"
                            onClick={() => setDeleteTarget(location)}
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
    const headerActions: ReactNode = onAdd ? (
        <PermisssionGuard permission={PERMISSIONS.RENTALS.MANAGE_LOCATIONS}>
            <button
                type="button"
                onClick={onAdd}
                className="btn btn-primary btn-sm"
            >
                {SVGICON.plus} Add Location
            </button>
        </PermisssionGuard>
    ) : null;

    /* Render */
    return (
        <>
            {title}

            <FilterBox title="Filter Locations">
                <Form onSubmit={handleSearch}>
                    <Row className="g-3 align-items-end">
                        <Col md={4}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Search
                            </Form.Label>
                            <InputGroup>
                                <Form.Control
                                    placeholder="Location name…"
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
                                value={filters['filter[is_active]'] ?? ''}
                                onChange={e =>
                                    setFilters(prev => ({
                                        ...prev,
                                        'filter[is_active]':
                                            e.target.value || undefined,
                                        page: 1,
                                    }))
                                }
                            >
                                <option value="">All Statuses</option>
                                <option value="1">Active</option>
                                <option value="0">Inactive</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Type
                            </Form.Label>
                            <Form.Select
                                className="tw:h-[2.9rem]"
                                onChange={e => {
                                    const val = e.target.value;
                                    setFilters(prev => ({
                                        ...prev,
                                        'filter[is_pickup]':
                                            val === 'pickup' ? '1' : undefined,
                                        'filter[is_dropoff]':
                                            val === 'dropoff' ? '1' : undefined,
                                        page: 1,
                                    }));
                                }}
                            >
                                <option value="">All Types</option>
                                <option value="pickup">Pickup Only</option>
                                <option value="dropoff">Dropoff Only</option>
                            </Form.Select>
                        </Col>
                        {/* Branch filter */}
                        {(hasGlobalBranchAccess
                            ? allBranches.length > 0
                            : userBranches.length > 1) && (
                            <Col md={2}>
                                <Form.Label className="small fw-semibold text-muted mb-1">
                                    Branch
                                </Form.Label>
                                {hasGlobalBranchAccess ? (
                                    <Form.Select
                                        className="tw:h-[2.9rem]"
                                        value={
                                            filters['filter[branch_id]'] ?? ''
                                        }
                                        onChange={e =>
                                            setFilters(prev => ({
                                                ...prev,
                                                'filter[branch_id]':
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
                                ) : (
                                    <Form.Select
                                        className="tw:h-[2.9rem]"
                                        value={
                                            filters['filter[branch_id]'] ?? ''
                                        }
                                        onChange={e =>
                                            setFilters(prev => ({
                                                ...prev,
                                                'filter[branch_id]':
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
                </Form>
            </FilterBox>

            <DataTable
                title="All Rental Locations"
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
                emptyMessage="Add your first rental location to get started."
            />
        </>
    );
}
