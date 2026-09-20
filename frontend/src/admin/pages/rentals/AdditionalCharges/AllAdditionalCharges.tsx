import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Form, Row, Col, InputGroup, Badge } from 'react-bootstrap';
import type {
    AdditionalCharge,
    AdditionalChargeFilters,
} from '@/shared/types/additional-charge.types';
import { additionalChargeService } from '@/services/additionalChargeService';
import {
    useAdditionalCharges,
    useDeleteAdditionalCharge,
    additionalChargeKeys,
} from '@/shared/hooks/queries/useAdditionalCharges';
import { useActiveBranches } from '@/shared/hooks/queries/useBranches';
import { useBulkDelete } from '@/shared/hooks/queries/useBulkDelete';
import { selectAuthUser } from '@/store/slices/authSlice';
import { useTitle } from '@/shared/hooks';
import { SVGICON } from '@adminConstants/theme';
import { PERMISSIONS } from '@/shared/config/permissions';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import DataTable, { type Column } from '@adminComponents/DataTable';
import FilterBox from '@adminComponents/ui/FilterBox';
import { formatWithSymbol } from '@/shared/libs/currency';

/* Props */
interface AllAdditionalChargesProps {
    onAdd?: () => void;
    onEdit?: (charge: AdditionalCharge) => void;
}

/* Helpers */
const SCOPE_COLORS: Record<string, string> = {
    global: 'primary',
    category: 'info',
    vehicle: 'purple',
    regular: 'warning',
};

const SCOPE_LABELS: Record<string, string> = {
    global: 'Global',
    category: 'Category',
    vehicle: 'Vehicle',
    regular: 'Regular',
};

/* Main Component */
export default function AllAdditionalCharges({
    onAdd,
    onEdit,
}: AllAdditionalChargesProps) {
    const title = useTitle('Additional Charges');
    const authUser = useSelector(selectAuthUser);

    const userBranches = authUser?.branches ?? [];
    const hasGlobalBranchAccess = !userBranches.length;

    const { data: branchesResponse } = useActiveBranches();
    const allBranches = branchesResponse?.data ?? [];

    const [filters, setFilters] = useState<AdditionalChargeFilters>({
        page: 1,
        per_page: 15,
    });
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<AdditionalCharge | null>(
        null
    );

    const {
        data: response,
        isLoading,
        isError,
    } = useAdditionalCharges(filters);
    const deleteMutation = useDeleteAdditionalCharge();
    const { bulkDelete, isBulkDeleting } = useBulkDelete({
        deleteFn: id => additionalChargeService.delete(id),
        invalidateKeys: [additionalChargeKeys.lists()],
        entityName: 'charge',
        onSuccess: () => setSelectedIds([]),
    });

    const charges = useMemo<AdditionalCharge[]>(
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
            prev.length === charges.length ? [] : charges.map(c => c.id)
        );
    }, [charges]);

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
    const columns: Column<AdditionalCharge>[] = [
        {
            key: 'name',
            label: 'Charge Name',
            render: charge => (
                <div>
                    <span className="fw-semibold">{charge.name}</span>
                    {charge.description && (
                        <div className="text-muted small">
                            {charge.description}
                        </div>
                    )}
                    {charge.is_waivable && (
                        <Badge bg="secondary" className="mt-1 small">
                            Waivable
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            key: 'branch',
            label: 'Branch',
            render: charge =>
                charge.branch_id == null ? (
                    <Badge bg="dark" className="small">
                        Org-wide
                    </Badge>
                ) : (
                    <span className="text-muted small">
                        {charge.branch?.name ?? '-'}
                    </span>
                ),
        },
        {
            key: 'scope',
            label: 'Scope',
            render: charge => (
                <Badge
                    bg={SCOPE_COLORS[charge.scope] ?? 'secondary'}
                    className="small"
                >
                    {SCOPE_LABELS[charge.scope] ?? charge.scope}
                </Badge>
            ),
        },
        {
            key: 'linked_to',
            label: 'Linked To',
            render: charge => {
                if (charge.scope === 'category' && charge.category) {
                    return (
                        <span className="small">{charge.category.name}</span>
                    );
                }
                if (charge.scope === 'vehicle' && charge.vehicle) {
                    return (
                        <div className="small">
                            <div>{charge.vehicle.name}</div>
                            <div className="text-muted">
                                {charge.vehicle.license_plate}
                            </div>
                        </div>
                    );
                }
                return <span className="text-muted">-</span>;
            },
        },
        {
            key: 'amount',
            label: 'Amount',
            render: charge => (
                <span className="fw-semibold">
                    {formatWithSymbol(
                        Number(charge.amount),
                        charge.currency_symbol ?? '₵'
                    )}
                    {charge.charge_type === 'per_day' && (
                        <span className="text-muted fw-normal">/day</span>
                    )}
                </span>
            ),
        },
        {
            key: 'stock',
            label: 'Stock',
            render: charge => {
                if (charge.scope !== 'regular') {
                    return <span className="text-muted small">-</span>;
                }
                if (charge.stock_quantity === null) {
                    return <span className="text-muted small">Unlimited</span>;
                }
                if (charge.stock_quantity === 0) {
                    return (
                        <Badge bg="danger" className="small">
                            Out of stock
                        </Badge>
                    );
                }
                return (
                    <span className="small text-success fw-semibold">
                        {charge.stock_quantity} in stock
                    </span>
                );
            },
        },
        {
            key: 'is_active',
            label: 'Status',
            render: charge => (
                <Badge bg={charge.is_active ? 'success' : 'danger'}>
                    {charge.is_active ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            label: 'Action',
            className: 'text-end',
            render: charge => (
                <div className="d-flex justify-content-end gap-1">
                    {onEdit && (
                        <PermisssionGuard
                            permission={
                                PERMISSIONS.RENTALS.MANAGE_ADDITIONAL_CHARGES
                            }
                        >
                            <button
                                type="button"
                                onClick={() => onEdit(charge)}
                                className="btn btn-primary shadow btn-xs sharp"
                                title="Edit"
                            >
                                {SVGICON.pencil}
                            </button>
                        </PermisssionGuard>
                    )}
                    <PermisssionGuard
                        permission={
                            PERMISSIONS.RENTALS.MANAGE_ADDITIONAL_CHARGES
                        }
                    >
                        <button
                            type="button"
                            onClick={() => setDeleteTarget(charge)}
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
        <PermisssionGuard
            permission={PERMISSIONS.RENTALS.MANAGE_ADDITIONAL_CHARGES}
        >
            <button
                type="button"
                onClick={onAdd}
                className="btn btn-primary btn-sm"
            >
                {SVGICON.plus} Add Charge
            </button>
        </PermisssionGuard>
    ) : null;

    /* Render */
    return (
        <>
            {title}

            <FilterBox title="Filter Charges">
                <Form onSubmit={handleSearch}>
                    <Row className="g-3 align-items-end">
                        <Col md={3}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Search
                            </Form.Label>
                            <InputGroup>
                                <Form.Control
                                    placeholder="Charge name…"
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
                                Scope
                            </Form.Label>
                            <Form.Select
                                className="tw:h-[2.9rem]"
                                value={filters['filter[scope]'] ?? ''}
                                onChange={e =>
                                    setFilters(prev => ({
                                        ...prev,
                                        'filter[scope]':
                                            e.target.value || undefined,
                                        page: 1,
                                    }))
                                }
                            >
                                <option value="">All Scopes</option>
                                <option value="global">Global</option>
                                <option value="category">Category</option>
                                <option value="vehicle">Vehicle</option>
                                <option value="regular">Regular</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Charge Type
                            </Form.Label>
                            <Form.Select
                                className="tw:h-[2.9rem]"
                                value={filters['filter[charge_type]'] ?? ''}
                                onChange={e =>
                                    setFilters(prev => ({
                                        ...prev,
                                        'filter[charge_type]':
                                            e.target.value || undefined,
                                        page: 1,
                                    }))
                                }
                            >
                                <option value="">All Types</option>
                                <option value="flat">Flat</option>
                                <option value="per_day">Per Day</option>
                            </Form.Select>
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
                        {/* Branch filter - admin sees all; managers see only their branches if 2+ */}
                        {(hasGlobalBranchAccess
                            ? allBranches.length > 0
                            : userBranches.length > 1) && (
                            <Col md={2}>
                                <Form.Label className="small fw-semibold text-muted mb-1">
                                    Branch
                                </Form.Label>
                                <Form.Select
                                    className="tw:h-[2.9rem]"
                                    value={filters['filter[branch_id]'] ?? ''}
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
                                        {hasGlobalBranchAccess
                                            ? 'All Branches'
                                            : 'All My Branches'}
                                    </option>
                                    {(hasGlobalBranchAccess
                                        ? allBranches
                                        : userBranches
                                    ).map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </Form.Select>
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
                title="All Additional Charges"
                data={charges}
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
                emptyTitle="No charges found"
                emptyMessage="Add your first additional charge to get started."
            />
        </>
    );
}
