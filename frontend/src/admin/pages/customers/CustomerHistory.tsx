// CustomerHistory.tsx
import { useState, useCallback, useMemo } from 'react';
import { Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import type { Customer } from '@/shared/types/customer.types';
import { useCustomers } from '@/shared/hooks/queries/useCustomers';
import DataTable, { type Column } from '@adminComponents/DataTable';
import type { GenericFilters } from '@/shared/types';
import { ROUTES } from '@/shared/routes';
import { formatDate } from '@/shared/libs/utils';
import { useTitle } from '@/shared/hooks';

const columns: Column<Customer>[] = [
    {
        key: 'customer',
        label: 'Customer',
        render: customer => (
            <div>
                <Link
                    to={ROUTES.DASHBOARD.CUSTOMERS.VIEW(customer.id)}
                    className="fw-bold text-decoration-none"
                >
                    {customer.name}
                </Link>
                <div>
                    <small className="text-muted">{customer.email}</small>
                </div>
            </div>
        ),
    },
    {
        key: 'contact',
        label: 'Contact',
        render: customer => (
            <div>
                <div>{customer.phone}</div>
                {customer.alt_phone && (
                    <small className="text-muted">{customer.alt_phone}</small>
                )}
            </div>
        ),
    },
    {
        key: 'rentals',
        label: 'Rentals',
        render: customer => {
            const count = customer.rentals_count ?? 0;

            return (
                <Badge bg={count > 0 ? 'primary' : 'secondary'}>
                    {count} rental{count !== 1 ? 's' : ''}
                </Badge>
            );
        },
    },
    {
        key: 'status',
        label: 'Status',
        render: customer => (
            <Badge bg={customer.is_blacklisted ? 'danger' : 'success'}>
                {customer.is_blacklisted ? 'Blacklisted' : 'Active'}
            </Badge>
        ),
    },
    {
        key: 'joined',
        label: 'Joined',
        render: customer => (
            <small className="text-muted">
                {formatDate(customer.created_at)}
            </small>
        ),
    },
];

export default function CustomerHistory() {
    const title = useTitle('Customer History');
    const [filters, setFilters] = useState<GenericFilters>({
        per_page: 15,
        include: 'rentalsCount',
        sort: '-created_at',
    });

    const { data: response, isLoading, isError } = useCustomers(filters);

    const customers = useMemo<Customer[]>(
        () => response?.data ?? [],
        [response]
    );
    const meta = response?.meta ?? null;

    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }));
    }, []);

    return (
        <>
            {title}
            <div className="pb-4">
                <DataTable
                    title="Customer Rental History"
                    data={customers}
                    columns={columns}
                    meta={meta}
                    isLoading={isLoading}
                    isError={isError}
                    onPageChange={handlePageChange}
                    emptyTitle="No customers found"
                    emptyMessage="There are no customers with rental history yet."
                />
            </div>
        </>
    );
}
