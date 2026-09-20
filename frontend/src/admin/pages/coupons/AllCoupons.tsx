import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Row, Col, InputGroup, Badge } from 'react-bootstrap';
import type {
    DiscountCoupon,
    CouponFilters,
} from '@/shared/types/coupon.types';
import { couponService } from '@/services/couponService';
import {
    useCoupons,
    useDeleteCoupon,
    couponKeys,
} from '@/shared/hooks/queries/useCoupons';
import { useBulkDelete } from '@/shared/hooks/queries/useBulkDelete';
import { useTitle } from '@/shared/hooks';
import { SVGICON } from '@adminConstants/theme';
import { ROUTES } from '@/shared/routes';
import DataTable, { type Column } from '@adminComponents/DataTable';
import FilterBox from '@adminComponents/ui/FilterBox';
import { useFormatCurrency } from '@/shared/hooks/queries/useSettings';
import { formatDate } from '@/shared/libs/utils';

interface AllCouponsProps {
    initialFilters?: CouponFilters;
}

function expiryLabel(coupon: DiscountCoupon): ReactNode {
    if (!coupon.expires_at) {
        return <span className="text-muted small">Never</span>;
    }
    const expired = new Date(coupon.expires_at) < new Date();
    return (
        <span
            className={`small ${expired ? 'text-danger fw-semibold' : 'text-muted'}`}
        >
            {formatDate(coupon.expires_at)}
            {expired && ' (expired)'}
        </span>
    );
}

export default function AllCoupons({ initialFilters = {} }: AllCouponsProps) {
    const formatCurrency = useFormatCurrency();
    const title = useTitle('Discount Coupons');
    const navigate = useNavigate();

    const [filters, setFilters] = useState<CouponFilters>({
        page: 1,
        per_page: 15,
        ...initialFilters,
    });
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<DiscountCoupon | null>(
        null
    );

    const { data: response, isLoading, isError } = useCoupons(filters);
    const deleteMutation = useDeleteCoupon();
    const { bulkDelete, isBulkDeleting } = useBulkDelete({
        deleteFn: id => couponService.delete(id),
        invalidateKeys: [couponKeys.lists()],
        entityName: 'coupon',
        onSuccess: () => setSelectedIds([]),
    });

    const coupons = useMemo<DiscountCoupon[]>(
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
        setFilters({ page: 1, per_page: 15, ...initialFilters });
    }, [initialFilters]);

    const toggleSelectAll = useCallback(() => {
        setSelectedIds(prev =>
            prev.length === coupons.length ? [] : coupons.map(c => c.id)
        );
    }, [coupons]);

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
    const columns: Column<DiscountCoupon>[] = [
        {
            key: 'code',
            label: 'Code',
            render: coupon => (
                <span
                    className="fw-bold font-monospace text-primary"
                    style={{ cursor: 'pointer', letterSpacing: '0.05em' }}
                    title="Click to copy"
                    onClick={() => navigator.clipboard?.writeText(coupon.code)}
                >
                    {coupon.code}
                </span>
            ),
        },
        {
            key: 'name',
            label: 'Name',
            render: coupon => (
                <div>
                    <span className="fw-semibold">{coupon.name}</span>
                    {coupon.description && (
                        <div className="text-muted small">
                            {coupon.description}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'type',
            label: 'Type',
            render: coupon => (
                <Badge bg={coupon.type === 'percentage' ? 'info' : 'primary'}>
                    {coupon.type === 'percentage' ? '%' : 'Flat'}
                </Badge>
            ),
        },
        {
            key: 'coupon_type',
            label: 'Behaviour',
            render: coupon => (
                <Badge
                    bg={
                        coupon.coupon_type === 'first_time'
                            ? 'warning'
                            : 'secondary'
                    }
                >
                    {coupon.coupon_type === 'first_time'
                        ? 'First-Time'
                        : 'Standard'}
                </Badge>
            ),
        },
        {
            key: 'value',
            label: 'Value',
            render: coupon =>
                coupon.type === 'percentage'
                    ? `${coupon.value}%`
                    : formatCurrency(Number(coupon.value)),
        },
        {
            key: 'expires_at',
            label: 'Expires',
            render: coupon => expiryLabel(coupon),
        },
        {
            key: 'usage',
            label: 'Usage',
            render: coupon => (
                <span className="small">
                    {coupon.used_count}
                    {coupon.max_uses != null ? ` / ${coupon.max_uses}` : ' / ∞'}
                </span>
            ),
        },
        {
            key: 'is_active',
            label: 'Status',
            render: coupon => (
                <Badge bg={coupon.is_active ? 'success' : 'danger'}>
                    {coupon.is_active ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            label: 'Action',
            className: 'text-end',
            render: coupon => (
                <div className="d-flex justify-content-end gap-1">
                    <button
                        type="button"
                        onClick={() =>
                            navigate(ROUTES.DASHBOARD.COUPONS.EDIT(coupon.id))
                        }
                        className="btn btn-primary shadow btn-xs sharp"
                        title="Edit"
                    >
                        {SVGICON.pencil}
                    </button>
                    <button
                        type="button"
                        onClick={() => setDeleteTarget(coupon)}
                        className="btn btn-danger shadow btn-xs sharp"
                        title="Delete"
                    >
                        {SVGICON.trash}
                    </button>
                </div>
            ),
        },
    ];

    /* Header Actions */
    const headerActions: ReactNode = (
        <button
            type="button"
            onClick={() => navigate(ROUTES.DASHBOARD.COUPONS.CREATE)}
            className="btn btn-primary btn-sm"
        >
            {SVGICON.plus} Add Coupon
        </button>
    );

    /* Render */
    return (
        <>
            {title}

            <FilterBox title="Filter Coupons">
                <Form onSubmit={handleSearch}>
                    <Row className="g-3 align-items-end">
                        <Col md={4}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Search
                            </Form.Label>
                            <InputGroup>
                                <Form.Control
                                    placeholder="Code or name…"
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
                                value={filters['filter[type]'] ?? ''}
                                onChange={e =>
                                    setFilters(prev => ({
                                        ...prev,
                                        'filter[type]':
                                            e.target.value || undefined,
                                        page: 1,
                                    }))
                                }
                            >
                                <option value="">All Types</option>
                                <option value="percentage">Percentage</option>
                                <option value="fixed">Fixed Amount</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Coupon Type
                            </Form.Label>
                            <Form.Select
                                className="tw:h-[2.9rem]"
                                value={filters['filter[coupon_type]'] ?? ''}
                                onChange={e =>
                                    setFilters(prev => ({
                                        ...prev,
                                        'filter[coupon_type]':
                                            e.target.value || undefined,
                                        page: 1,
                                    }))
                                }
                            >
                                <option value="">All</option>
                                <option value="standard">Standard</option>
                                <option value="first_time">First-Time</option>
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
                title="All Coupons"
                data={coupons}
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
                emptyTitle="No coupons found"
                emptyMessage="Add your first discount coupon to get started."
            />
        </>
    );
}
