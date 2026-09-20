import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { FaCheck } from 'react-icons/fa6';
import { useSelector } from 'react-redux';
import { Form, Row, Col, InputGroup, Badge } from 'react-bootstrap';
import type {
    DiscountRule,
    DiscountRuleFilters,
} from '@/shared/types/discount-rule.types';
import { discountRuleService } from '@/services/discountRuleService';
import {
    useDiscountRules,
    useDeleteDiscountRule,
    discountRuleKeys,
} from '@/shared/hooks/queries/useDiscountRules';
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
import { formatDate } from '@/shared/libs/utils';
import { formatWithSymbol } from '@/shared/libs/currency';

/* Types */
const CONDITION_LABELS: Record<string, string> = {
    none: 'Always applies',
    rental_duration_days: 'Min. rental duration',
    days_before_pickup: 'Days booked in advance',
    booking_source: 'Booking source',
    customer_completed_rentals: 'Customer completed rentals',
    base_amount: 'Min. base amount',
    vehicle_id: 'Specific vehicle',
    category_id: 'Specific category',
};

interface AllDiscountRulesProps {
    onAdd?: () => void;
    onEdit?: (rule: DiscountRule) => void;
}

/* Helpers */
function conditionLabel(rule: DiscountRule): string {
    const base = CONDITION_LABELS[rule.condition_type] ?? rule.condition_type;
    if (rule.condition_type === 'none') {
        return base;
    }
    if (rule.condition_type === 'vehicle_id' && rule.condition_vehicle) {
        return `Vehicle: ${rule.condition_vehicle.name}`;
    }
    if (rule.condition_type === 'category_id' && rule.condition_category) {
        return `Category: ${rule.condition_category.name}`;
    }
    if (rule.condition_value) {
        return `${base}: ${rule.condition_value}`;
    }
    return base;
}

function validityLabel(rule: DiscountRule): string {
    if (!rule.valid_from && !rule.valid_to) {
        return 'Unlimited';
    }
    const from = rule.valid_from ? formatDate(rule.valid_from) : '-';
    const to = rule.valid_to ? formatDate(rule.valid_to) : '-';
    return `${from} – ${to}`;
}

/* Main Component */
export default function AllDiscountRules({
    onAdd,
    onEdit,
}: AllDiscountRulesProps) {
    const formatCurrency = useFormatCurrency();
    const title = useTitle('Discount Rules');
    const authUser = useSelector(selectAuthUser);

    const userBranches = authUser?.branches ?? [];
    const hasGlobalBranchAccess = !userBranches.length;

    const { data: branchesResponse } = useActiveBranches();
    const allBranches = branchesResponse?.data ?? [];

    const [filters, setFilters] = useState<DiscountRuleFilters>({
        page: 1,
        per_page: 15,
    });
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<DiscountRule | null>(null);

    const { data: response, isLoading, isError } = useDiscountRules(filters);
    const deleteMutation = useDeleteDiscountRule();
    const { bulkDelete, isBulkDeleting } = useBulkDelete({
        deleteFn: id => discountRuleService.delete(id),
        invalidateKeys: [discountRuleKeys.lists()],
        entityName: 'discount rule',
        onSuccess: () => setSelectedIds([]),
    });

    const rules = useMemo<DiscountRule[]>(
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
            prev.length === rules.length ? [] : rules.map(r => r.id)
        );
    }, [rules]);

    const toggleOne = useCallback((id: string | number) => {
        setSelectedIds(prev =>
            prev.includes(String(id))
                ? prev.filter(x => x !== String(id))
                : [...prev, String(id)]
        );
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (!deleteTarget) {
            return;
        }
        deleteMutation.mutate(deleteTarget.id, {
            onSettled: () => setDeleteTarget(null),
        });
    }, [deleteTarget, deleteMutation]);

    /* Columns */
    const columns: Column<DiscountRule>[] = [
        {
            key: 'name',
            label: 'Rule Name',
            render: rule => (
                <div>
                    <span className="fw-semibold">{rule.name}</span>
                    {rule.description && (
                        <div className="text-muted small">
                            {rule.description}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'branch',
            label: 'Branch',
            render: rule =>
                rule.branch_id ? (
                    <span className="small">
                        {rule.branch?.name ?? rule.branch_id}
                    </span>
                ) : (
                    <Badge bg="secondary" className="small">
                        Org-wide
                    </Badge>
                ),
        },
        {
            key: 'discount_type',
            label: 'Type',
            render: rule => (
                <Badge
                    bg={
                        rule.discount_type === 'percentage' ? 'info' : 'primary'
                    }
                >
                    {rule.discount_type === 'percentage'
                        ? 'Percentage'
                        : 'Flat Rate'}
                </Badge>
            ),
        },
        {
            key: 'discount_value',
            label: 'Value',
            render: rule =>
                rule.discount_type === 'percentage'
                    ? `${rule.discount_value}%`
                    : rule.branch?.currency_symbol
                      ? formatWithSymbol(
                            Number(rule.discount_value),
                            rule.branch.currency_symbol
                        )
                      : formatCurrency(Number(rule.discount_value)),
        },
        {
            key: 'condition_type',
            label: 'Condition',
            render: rule => (
                <span className="small">{conditionLabel(rule)}</span>
            ),
        },
        {
            key: 'validity',
            label: 'Validity',
            render: rule => (
                <span className="small text-muted">{validityLabel(rule)}</span>
            ),
        },
        {
            key: 'is_stackable',
            label: 'Stackable',
            render: rule =>
                rule.is_stackable ? (
                    <span className="text-success">
                        <FaCheck />
                    </span>
                ) : (
                    <span className="text-muted">-</span>
                ),
        },
        {
            key: 'is_active',
            label: 'Status',
            render: rule => (
                <Badge bg={rule.is_active ? 'success' : 'danger'}>
                    {rule.is_active ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            label: 'Action',
            className: 'text-end',
            render: rule => (
                <div className="d-flex justify-content-end gap-1">
                    {onEdit && (
                        <PermisssionGuard
                            permission={PERMISSIONS.DISCOUNTS.EDIT}
                        >
                            <button
                                type="button"
                                onClick={() => onEdit(rule)}
                                className="btn btn-primary shadow btn-xs sharp"
                                title="Edit"
                            >
                                {SVGICON.pencil}
                            </button>
                        </PermisssionGuard>
                    )}
                    <PermisssionGuard permission={PERMISSIONS.DISCOUNTS.DELETE}>
                        <button
                            type="button"
                            onClick={() => setDeleteTarget(rule)}
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
        <PermisssionGuard permission={PERMISSIONS.DISCOUNTS.CREATE}>
            <button
                type="button"
                onClick={onAdd}
                className="btn btn-primary btn-sm"
            >
                {SVGICON.plus} Add Rule
            </button>
        </PermisssionGuard>
    ) : null;

    /* Render */
    return (
        <>
            {title}

            <FilterBox title="Filter Discount Rules">
                <Form onSubmit={handleSearch}>
                    <Row className="g-3 align-items-end">
                        <Col md={4}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Search
                            </Form.Label>
                            <InputGroup>
                                <Form.Control
                                    placeholder="Rule name…"
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
                                Discount Type
                            </Form.Label>
                            <Form.Select
                                className="tw:h-[2.9rem]"
                                value={filters['filter[discount_type]'] ?? ''}
                                onChange={e =>
                                    setFilters(prev => ({
                                        ...prev,
                                        'filter[discount_type]':
                                            e.target.value || undefined,
                                        page: 1,
                                    }))
                                }
                            >
                                <option value="">All Types</option>
                                <option value="percentage">Percentage</option>
                                <option value="flat">Flat Rate</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Condition
                            </Form.Label>
                            <Form.Select
                                className="tw:h-[2.9rem]"
                                value={filters['filter[condition_type]'] ?? ''}
                                onChange={e =>
                                    setFilters(prev => ({
                                        ...prev,
                                        'filter[condition_type]':
                                            e.target.value || undefined,
                                        page: 1,
                                    }))
                                }
                            >
                                <option value="">All Conditions</option>
                                <option value="none">Always applies</option>
                                <option value="rental_duration_days">
                                    Rental duration
                                </option>
                                <option value="days_before_pickup">
                                    Days in advance
                                </option>
                                <option value="booking_source">
                                    Booking source
                                </option>
                                <option value="customer_completed_rentals">
                                    Customer rentals
                                </option>
                                <option value="base_amount">
                                    Min. base amount
                                </option>
                                <option value="vehicle_id">
                                    Specific vehicle
                                </option>
                                <option value="category_id">
                                    Specific category
                                </option>
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
                        {hasGlobalBranchAccess && allBranches.length > 0 && (
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
                                    <option value="">All Branches</option>
                                    {allBranches.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Col>
                        )}
                        {!hasGlobalBranchAccess && userBranches.length > 1 && (
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
                                    <option value="">All My Branches</option>
                                    {userBranches.map(b => (
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
                title="All Discount Rules"
                data={rules}
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
                emptyTitle="No discount rules found"
                emptyMessage="Add your first discount rule to get started."
            />
        </>
    );
}
