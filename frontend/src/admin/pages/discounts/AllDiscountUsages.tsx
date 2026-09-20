import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Form, Row, Col, Badge } from 'react-bootstrap';
import type {
    RentalDiscountUsage,
    DiscountUsageFilters,
} from '@/shared/types/discount-rule.types';
import { useDiscountUsages } from '@/shared/hooks/queries/useDiscountRules';
import { useTitle } from '@/shared/hooks';
import { useFormatCurrency } from '@/shared/hooks/queries/useSettings';
import { ROUTES } from '@/shared/routes';
import { formatDate } from '@/shared/libs/utils';
import DataTable, { type Column } from '@adminComponents/DataTable';
import FilterBox from '@adminComponents/ui/FilterBox';

export default function AllDiscountUsages() {
    const formatCurrency = useFormatCurrency();
    const title = useTitle('Discount Usages');

    const [filters, setFilters] = useState<DiscountUsageFilters>({
        page: 1,
        per_page: 15,
    });

    const { data: response, isLoading, isError } = useDiscountUsages(filters);

    const usages = useMemo<RentalDiscountUsage[]>(
        () => response?.data ?? [],
        [response]
    );
    const meta = response?.meta ?? null;

    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }));
    }, []);

    const handleClearFilters = useCallback(() => {
        setFilters({ page: 1, per_page: 15 });
    }, []);

    /* Columns */
    const columns: Column<RentalDiscountUsage>[] = [
        {
            key: 'rental_id',
            label: 'Rental',
            render: usage =>
                usage.rental ? (
                    <Link
                        to={ROUTES.DASHBOARD.RENTALS.VIEW(usage.rental.id)}
                        className="small fw-semibold text-decoration-none"
                    >
                        {usage.rental.reference}
                    </Link>
                ) : (
                    <span className="small text-muted font-monospace">
                        {usage.rental_id.slice(0, 8)}…
                    </span>
                ),
        },
        {
            key: 'discount_rule',
            label: 'Rule',
            render: usage =>
                usage.discount_rule ? (
                    <span className="small fw-semibold">
                        {usage.discount_rule.name}
                    </span>
                ) : (
                    <span className="text-muted small fst-italic">Manual</span>
                ),
        },
        {
            key: 'discount_type',
            label: 'Type',
            render: usage => (
                <Badge bg={usage.discount_type === 'rule' ? 'info' : 'warning'}>
                    {usage.discount_type === 'rule' ? 'Rule' : 'Manual'}
                </Badge>
            ),
        },
        {
            key: 'amount',
            label: 'Amount',
            render: usage => (
                <span className="fw-semibold text-success">
                    {formatCurrency(Number(usage.amount))}
                </span>
            ),
        },
        {
            key: 'applied_by',
            label: 'Applied By',
            render: usage =>
                usage.applied_by_user ? (
                    <span className="small">{usage.applied_by_user.name}</span>
                ) : (
                    <span className="text-muted">-</span>
                ),
        },
        {
            key: 'note',
            label: 'Note',
            render: usage =>
                usage.note ? (
                    <span className="small text-muted">{usage.note}</span>
                ) : (
                    <span className="text-muted">-</span>
                ),
        },
        {
            key: 'created_at',
            label: 'Date',
            render: usage => (
                <span className="small text-muted">
                    {formatDate(usage.created_at)}
                </span>
            ),
        },
    ];

    /* Render */
    return (
        <>
            {title}

            <FilterBox title="Filter Discount Usages">
                <Form>
                    <Row className="g-3 align-items-end">
                        <Col md={3}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Type
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
                                <option value="rule">Rule</option>
                                <option value="manual">Manual</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
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
                title="Discount Usages"
                data={usages}
                columns={columns}
                meta={meta}
                isLoading={isLoading}
                isError={isError}
                onPageChange={handlePageChange}
                emptyTitle="No discount usages yet"
                emptyMessage="Usages will appear here once discounts are applied to rentals."
            />
        </>
    );
}
