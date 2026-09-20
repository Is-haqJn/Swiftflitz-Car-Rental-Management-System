import { useState, useCallback, useMemo } from 'react';
import { Col, Form, InputGroup, Row } from 'react-bootstrap';
import type {
    AirportCustomer,
    AirportCustomerFilters,
} from '@/shared/types/airport-customer.types';
import {
    useAirportCustomers,
    useDeleteAirportCustomer,
    airportCustomerKeys,
} from '@/shared/hooks/queries/useAirportCustomers';
import { airportCustomerService } from '@/services/airportCustomerService';
import { useBulkDelete } from '@/shared/hooks/queries/useBulkDelete';
import DataTable, { type Column } from '@adminComponents/DataTable';
import FilterBox from '@adminComponents/ui/FilterBox';
import { useTitle } from '@/shared/hooks';

function fmtDate(iso: string | null | undefined) {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export default function AllAirportCustomers() {
    useTitle('Airport Customers');
    const [filters, setFilters] = useState<AirportCustomerFilters>({
        page: 1,
        per_page: 15,
    });
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<AirportCustomer | null>(
        null
    );

    const { data: response, isLoading, isError } = useAirportCustomers(filters);
    const deleteMutation = useDeleteAirportCustomer();

    const { bulkDelete, isBulkDeleting } = useBulkDelete({
        deleteFn: (id: string) => airportCustomerService.delete(id),
        invalidateKeys: [airportCustomerKeys.lists()],
        entityName: 'customer',
        onSuccess: () => setSelectedIds([]),
    });

    const customers = useMemo<AirportCustomer[]>(
        () => response?.data ?? [],
        [response]
    );
    const meta = response?.meta ?? null;

    const handleSearch = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            setFilters(prev => ({
                ...prev,
                'filter[full_name]': search || undefined,
                page: 1,
            }));
        },
        [search]
    );

    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }));
    }, []);

    const handleClearFilters = useCallback(() => {
        setSearch('');
        setFilters({ page: 1, per_page: 15 });
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (!deleteTarget) return;
        deleteMutation.mutate(deleteTarget.id, {
            onSettled: () => setDeleteTarget(null),
        });
    }, [deleteTarget, deleteMutation]);

    const toggleSelectAll = useCallback(() => {
        setSelectedIds(prev =>
            prev.length === customers.length ? [] : customers.map(c => c.id)
        );
    }, [customers]);

    const toggleOne = useCallback((id: string | number) => {
        setSelectedIds(prev =>
            prev.includes(String(id))
                ? prev.filter(x => x !== String(id))
                : [...prev, String(id)]
        );
    }, []);

    const columns: Column<AirportCustomer>[] = [
        {
            key: 'full_name',
            label: 'Name',
            render: customer => (
                <span className="fw-semibold">{customer.full_name}</span>
            ),
        },
        {
            key: 'email',
            label: 'Email',
            render: customer => (
                <span className="text-muted">{customer.email}</span>
            ),
        },
        {
            key: 'phone',
            label: 'Phone',
            render: customer => <span>{customer.phone}</span>,
        },
        {
            key: 'bookings_count',
            label: 'Bookings',
            render: customer => (
                <span className="badge bg-secondary">
                    {customer.bookings_count ?? 0}
                </span>
            ),
        },
        {
            key: 'created_at',
            label: 'Since',
            render: customer => (
                <span className="text-muted small">
                    {fmtDate(customer.created_at)}
                </span>
            ),
        },
        {
            key: 'actions' as const,
            label: 'Action',
            className: 'text-end',
            render: (customer: AirportCustomer) => (
                <button
                    className="btn btn-xs btn-outline-danger"
                    onClick={() => setDeleteTarget(customer)}
                >
                    Delete
                </button>
            ),
        },
    ];

    return (
        <>
            <FilterBox>
                <Form onSubmit={handleSearch}>
                    <Row className="g-3 align-items-end">
                        <Col md={4}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Search by name
                            </Form.Label>
                            <InputGroup>
                                <Form.Control
                                    placeholder="Customer name..."
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
                title="Airport Customers"
                data={customers}
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
                deleteTargetName={deleteTarget?.full_name}
                onDeleteRequest={setDeleteTarget}
                onDeleteConfirm={handleDeleteConfirm}
                onDeleteCancel={() => setDeleteTarget(null)}
                isDeleting={deleteMutation.isPending}
                onPageChange={handlePageChange}
                emptyTitle="No airport customers yet"
                emptyMessage="Airport customers are created automatically when bookings are made."
            />
        </>
    );
}
