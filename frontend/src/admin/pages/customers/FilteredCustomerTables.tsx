// FilteredCustomerTables.tsx
import BlacklistToggleDropdown from '@adminPages/customers/BlacklistToggleDropdown';
import { useState, useCallback, type ReactNode, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Customer } from '@/shared/types/customer.types';
import {
    useCustomers,
    useDeleteCustomer,
} from '@/shared/hooks/queries/useCustomers';
import { SVGICON } from '@adminConstants/theme';
import DataTable, { type Column } from '@adminComponents/DataTable';
import type { GenericFilters } from '@/shared/types';
import {
    formatDate,
    formatStatus,
    isLicenseExpired,
    isLicenseExpiringSoon,
    daysSinceExpiry,
} from '@/shared/libs/utils';

/* Props */
interface Props {
    onAdd?: () => void;
    onEdit?: (customer: Customer) => void;
}

/* Shared column builder */
type ColumnVariant = 'blacklisted' | 'expired_license';

function buildColumns(
    variant: ColumnVariant,
    onEdit: ((c: Customer) => void) | undefined,
    setDeleteTarget: (c: Customer) => void
): Column<Customer>[] {
    const baseColumns: Column<Customer>[] = [
        {
            key: 'customer',
            label: 'Customer',
            render: customer => (
                <div>
                    <div className="fw-bold">{customer.name}</div>
                    <small className="text-muted">{customer.email}</small>
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
                        <small className="text-muted">
                            {customer.alt_phone}
                        </small>
                    )}
                </div>
            ),
        },
        {
            key: 'license',
            label: 'License',
            render: customer => {
                const expired = isLicenseExpired(customer.license_expiry_date);
                const expiring = isLicenseExpiringSoon(
                    customer.license_expiry_date
                );
                return (
                    <div>
                        <div className="w-space-no">
                            {customer.license_number}
                        </div>
                        <small
                            className={
                                expired
                                    ? 'text-danger'
                                    : expiring
                                      ? 'text-warning'
                                      : 'text-muted'
                            }
                        >
                            Exp: {formatDate(customer.license_expiry_date)}
                            {expired && ' (Expired)'}
                            {expiring && !expired && ' (Expiring Soon)'}
                        </small>
                    </div>
                );
            },
        },
        {
            key: 'id_info',
            label: 'ID Type',
            render: customer => (
                <div>
                    <div className="text-capitalize">
                        {formatStatus(customer.id_type)}
                    </div>
                    <small className="text-muted">{customer.id_number}</small>
                </div>
            ),
        },
    ];

    if (variant === 'blacklisted') {
        baseColumns.push({
            key: 'blacklist_reason',
            label: 'Reason',
            render: customer => {
                const reason = customer.blacklist_reason ?? '-';
                return (
                    <div
                        title={reason} // full text on hover
                        style={{
                            maxWidth: 180,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <small className="text-muted">{reason}</small>
                    </div>
                );
            },
        });
        baseColumns.push({
            key: 'status',
            label: 'Status',
            render: customer => <BlacklistToggleDropdown customer={customer} />,
        });
    }

    if (variant === 'expired_license') {
        baseColumns.push({
            key: 'days_expired',
            label: 'Expired',
            render: customer => {
                const days = daysSinceExpiry(
                    customer.license_expiry_date ?? ''
                );
                const expired = isLicenseExpired(customer.license_expiry_date);

                if (!expired)
                    return (
                        <span className="badge bg-warning text-dark">
                            Not expired
                        </span>
                    );

                return (
                    <span className="badge bg-danger">
                        {days} day{days !== 1 ? 's' : ''} ago
                    </span>
                );
            },
        });
        baseColumns.push({
            key: 'status',
            label: 'Status',
            render: customer => <BlacklistToggleDropdown customer={customer} />,
        });
    }

    baseColumns.push({
        key: 'actions',
        label: 'Action',
        className: 'text-end',
        render: customer => (
            <div className="d-flex justify-content-end">
                <Link
                    to={`/management/customers/${customer.id}`}
                    className="btn btn-info shadow btn-xs sharp me-1"
                    title="View"
                >
                    {SVGICON.eye}
                </Link>
                {onEdit && (
                    <button
                        type="button"
                        onClick={() => onEdit(customer)}
                        className="btn btn-primary shadow btn-xs sharp me-1"
                        title="Edit"
                    >
                        {SVGICON.pencil}
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => setDeleteTarget(customer)}
                    className="btn btn-danger shadow btn-xs sharp"
                    title="Delete"
                >
                    {SVGICON.trash}
                </button>
            </div>
        ),
    });

    return baseColumns;
}

/* Shared table logic */
function CustomerFilteredTable({
    variant,
    extraFilters,
    title,
    emptyTitle,
    emptyMessage,
    onAdd,
    onEdit,
}: {
    variant: ColumnVariant;
    extraFilters: Partial<GenericFilters>;
    title: string;
    emptyTitle: string;
    emptyMessage: string;
    onAdd?: () => void;
    onEdit?: (customer: Customer) => void;
}) {
    const [filters, setFilters] = useState<GenericFilters>({
        per_page: 15,
        ...extraFilters,
    });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

    const { data: response, isLoading, isError } = useCustomers(filters);
    const deleteMutation = useDeleteCustomer();

    const customers = useMemo<Customer[]>(
        () => response?.data ?? [],
        [response]
    );
    const meta = response?.meta ?? null;

    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }));
    }, []);

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

    const handleDeleteConfirm = useCallback(() => {
        if (!deleteTarget) return;
        deleteMutation.mutate(deleteTarget.id, {
            onSettled: () => setDeleteTarget(null),
        });
    }, [deleteTarget, deleteMutation]);

    const columns = buildColumns(variant, onEdit, setDeleteTarget);

    const headerActions: ReactNode = onAdd ? (
        <button
            type="button"
            onClick={onAdd}
            className="btn btn-primary btn-sm"
        >
            {SVGICON.plus} Add Customer
        </button>
    ) : null;

    return (
        <DataTable
            title={title}
            data={customers}
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
export function BlacklistedCustomers({ onEdit }: Pick<Props, 'onEdit'>) {
    return (
        <CustomerFilteredTable
            variant="blacklisted"
            extraFilters={{ 'filter[is_blacklisted]': true }}
            title="Blacklisted Customers"
            emptyTitle="No blacklisted customers"
            emptyMessage="There are currently no blacklisted customers."
            onEdit={onEdit}
        />
    );
}

export function ExpiredLicenseCustomers({ onEdit }: Pick<Props, 'onEdit'>) {
    return (
        <CustomerFilteredTable
            variant="expired_license"
            extraFilters={{ license_status: 'expired' }}
            title="Expired License Customers"
            emptyTitle="No expired licenses"
            emptyMessage="All customers have valid licenses."
            onEdit={onEdit}
        />
    );
}

export function ExpiredSoonLicenseCustomers({ onEdit }: Pick<Props, 'onEdit'>) {
    return (
        <CustomerFilteredTable
            variant="expired_license"
            extraFilters={{ license_status: 'expiring_soon' }}
            title="Licenses Expiring Soon"
            emptyTitle="No licenses expiring soon"
            emptyMessage="No customer licenses are expiring within the next 30 days."
            onEdit={onEdit}
        />
    );
}
