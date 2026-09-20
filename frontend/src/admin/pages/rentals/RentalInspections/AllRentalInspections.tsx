import { Fragment, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button } from 'react-bootstrap';
import { useTitle } from '@/shared/hooks';
import { ROUTES } from '@/shared/routes';
import { formatDate, formatDateTime } from '@/shared/libs/utils';
import { useRentals } from '@/shared/hooks/queries/useRentals';
import type { Rental } from '@/shared/types/rental.types';
import type { PaginatedMeta } from '@/shared/types';
import DataTable, { type Column } from '@adminComponents/DataTable';

/* Helpers */
const STATUS_COLORS: Record<string, string> = {
    active: 'success',
    overdue: 'danger',
    returned: 'warning',
    completed: 'dark',
};

/* Main Component */
export default function AllRentalInspections() {
    const navigate = useNavigate();
    const title = useTitle('Inspection Log');

    const [page, setPage] = useState(1);

    const {
        data: res,
        isLoading,
        isError,
    } = useRentals({
        'filter[status]': 'active,overdue,returned,completed',
        page,
        per_page: 20,
    });

    const rentals: Rental[] = (res?.data ?? []) as Rental[];
    const meta = (res as { meta?: PaginatedMeta })?.meta ?? null;

    const handleView = useCallback(
        (rental: Rental) => navigate(ROUTES.DASHBOARD.RENTALS.VIEW(rental.id)),
        [navigate]
    );

    const columns: Column<Rental>[] = [
        {
            key: 'reference',
            label: 'Reference',
            render: r => <span className="fw-semibold">{r.reference}</span>,
        },
        {
            key: 'vehicle',
            label: 'Vehicle',
            render: r => (
                <div>
                    <div>{r.vehicle?.name ?? '-'}</div>
                    {r.vehicle?.license_plate && (
                        <small className="text-muted">
                            {r.vehicle.license_plate}
                        </small>
                    )}
                </div>
            ),
        },
        {
            key: 'customer',
            label: 'Customer',
            render: r => r.customer?.name ?? '-',
        },
        {
            key: 'status',
            label: 'Status',
            render: r => (
                <Badge
                    bg={STATUS_COLORS[r.status] ?? 'secondary'}
                    className="text-capitalize fw-normal"
                >
                    {r.status === 'returned' ? 'Pending Approval' : r.status}
                </Badge>
            ),
        },
        {
            key: 'actual_pickup_date',
            label: 'Picked Up',
            render: r =>
                r.actual_pickup_date ? (
                    formatDateTime(r.actual_pickup_date)
                ) : (
                    <span className="text-muted">-</span>
                ),
        },
        {
            key: 'actual_return_date',
            label: 'Returned',
            render: r =>
                r.actual_return_date ? (
                    formatDate(r.actual_return_date)
                ) : (
                    <span className="text-muted">-</span>
                ),
        },
        {
            key: 'has_damage',
            label: 'Damage',
            render: r =>
                r.has_damage ? (
                    <Badge bg="warning" text="dark" className="fw-normal">
                        Noted
                    </Badge>
                ) : (
                    <span className="text-muted small">None</span>
                ),
        },
        {
            key: 'actions',
            label: '',
            render: r => (
                <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={e => {
                        e.stopPropagation();
                        handleView(r);
                    }}
                >
                    View
                </Button>
            ),
        },
    ];

    return (
        <Fragment>
            {title}

            <DataTable<Rental>
                title="Inspection Log"
                columns={columns}
                data={rentals}
                isLoading={isLoading}
                isError={isError}
                meta={meta}
                onPageChange={setPage}
                emptyTitle="No inspections found"
                emptyMessage="Inspections will appear here once pickups are processed."
            />
        </Fragment>
    );
}
