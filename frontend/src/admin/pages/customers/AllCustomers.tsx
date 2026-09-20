import BlacklistToggleDropdown from '@adminPages/customers/BlacklistToggleDropdown.tsx';
import { useState, useCallback, type ReactNode, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Badge, Button, Form, Row, Col, InputGroup } from 'react-bootstrap';
import type { Customer } from '@/shared/types/customer.types';
import { customerService } from '@/services';
import {
    useCustomers,
    useDeleteCustomer,
    customerKeys,
} from '@/shared/hooks/queries/useCustomers';
import VerifyCustomerModal from './VerifyCustomerModal';
import { useActiveBranches } from '@/shared/hooks/queries/useBranches';
import { selectAuthUser } from '@/store/slices/authSlice';
import { useBulkDelete } from '@/shared/hooks/queries/useBulkDelete';
import { useQueueExport } from '@/shared/hooks/queries/useExports';
import { useConfirm } from '@/shared/hooks/useConfirm';
import { useTitle } from '@/shared/hooks';
import { SVGICON } from '@adminConstants/theme';
import { PERMISSIONS } from '@/shared/config/permissions';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import DataTable, { type Column } from '@adminComponents/DataTable';
import type { GenericFilters } from '@/shared/types';
import FilterBox from '@adminComponents/ui/FilterBox';
import DatePickerField from '@adminComponents/DatePickerField';
import {
    formatDate,
    isLicenseExpired,
    isLicenseExpiringSoon,
} from '@/shared/libs/utils';

interface AllCustomersProps {
    onAdd?: () => void;
    onEdit?: (customer: Customer) => void;
}

/* Main Component */
export default function AllCustomers({ onAdd, onEdit }: AllCustomersProps) {
    const title = useTitle('Customers');
    const authUser = useSelector(selectAuthUser);
    const hasGlobalBranchAccess = !(authUser?.branches?.length ?? 0);
    const { data: branchesResponse } = useActiveBranches();
    const allBranches = branchesResponse?.data ?? [];

    const [filters, setFilters] = useState<GenericFilters>({
        per_page: 15,
        sort: '-created_at',
    });
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
    const [verifyTarget, setVerifyTarget] = useState<Customer | null>(null);

    const { data: response, isLoading, isError } = useCustomers(filters);
    const deleteMutation = useDeleteCustomer();
    const { bulkDelete, isBulkDeleting } = useBulkDelete({
        deleteFn: id => customerService.delete(id),
        invalidateKeys: [customerKeys.lists()],
        entityName: 'customer',
        onSuccess: () => setSelectedIds([]),
    });
    const queueExportMutation = useQueueExport();
    const { confirm } = useConfirm();

    const customers = useMemo<Customer[]>(
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
                search: search || undefined,
                page: 1,
            }));
        },
        [search]
    );

    const handleBlacklistFilter = useCallback((value: string) => {
        setFilters(prev => ({
            ...prev,
            'filter[is_blacklisted]': value === '' ? undefined : value,
            page: 1,
        }));
    }, []);

    const handleDateFilter = useCallback(
        (key: 'from_date' | 'to_date', value: string) => {
            setFilters(prev => ({
                ...prev,
                [key]: value || undefined,
                page: 1,
            }));
        },
        []
    );

    const handleBranchFilter = useCallback((value: string) => {
        setFilters(prev => ({
            ...prev,
            'filter[branch_id]': value || undefined,
            page: 1,
        }));
    }, []);

    const handleClearFilters = useCallback(() => {
        setSearch('');
        setFilters({ per_page: 15, sort: '-created_at' });
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

    /* Column Definitions */
    const columns: Column<Customer>[] = [
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
                            className={`${
                                expired
                                    ? 'text-danger'
                                    : expiring
                                      ? 'text-warning'
                                      : 'text-muted'
                            }`}
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
                        {customer.id_type?.replace('_', ' ')}
                    </div>
                    <small className="text-muted">{customer?.id_number}</small>
                </div>
            ),
        },
        {
            key: 'blacklist',
            label: 'Status',
            render: customer => (
                <PermisssionGuard
                    permission={PERMISSIONS.CUSTOMERS.BLACKLIST}
                    fallback={
                        <span
                            className={`badge bg-${customer.is_blacklisted ? 'danger' : 'success'}`}
                        >
                            {customer.is_blacklisted ? 'Blacklisted' : 'Active'}
                        </span>
                    }
                >
                    <BlacklistToggleDropdown customer={customer} />
                </PermisssionGuard>
            ),
        },
        {
            key: 'verification',
            label: 'Verification',
            render: customer => {
                const status = customer.profile_status;
                if (status === 'verified') {
                    return <Badge bg="success">Verified</Badge>;
                }
                if (status === 'pending_review') {
                    return <Badge bg="info">Pending Review</Badge>;
                }
                if (status === 'rejected') {
                    return <Badge bg="danger">Rejected</Badge>;
                }
                return (
                    <div>
                        <Badge bg="warning" text="dark">
                            Incomplete
                        </Badge>
                        <div className="mt-1">
                            <Button
                                variant="link"
                                size="sm"
                                className="p-0 small text-primary"
                                onClick={() => setVerifyTarget(customer)}
                            >
                                Verify Now
                            </Button>
                        </div>
                    </div>
                );
            },
        },
        {
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
                        <PermisssionGuard
                            permission={PERMISSIONS.CUSTOMERS.EDIT}
                        >
                            <button
                                type="button"
                                onClick={() => onEdit(customer)}
                                className="btn btn-primary shadow btn-xs sharp me-1"
                                title="Edit"
                            >
                                {SVGICON.pencil}
                            </button>
                        </PermisssionGuard>
                    )}
                    <PermisssionGuard permission={PERMISSIONS.CUSTOMERS.DELETE}>
                        <button
                            type="button"
                            onClick={() => setDeleteTarget(customer)}
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
    const headerActions: ReactNode = (
        <div className="d-flex gap-2">
            <PermisssionGuard
                permission={PERMISSIONS.EXPORTS.DOWNLOAD_CUSTOMERS}
            >
                <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    disabled={queueExportMutation.isPending}
                    onClick={async () => {
                        const ok = await confirm({
                            title: 'Export customers?',
                            message:
                                'An Excel file will be generated in the background. You will be notified when it is ready to download.',
                            confirmText: 'Export',
                            confirmVariant: 'primary',
                        });
                        if (ok) {
                            queueExportMutation.mutate({
                                type: 'customers',
                                format: 'xlsx',
                                filters: {
                                    status: filters.status,
                                    search: filters.search,
                                },
                            });
                        }
                    }}
                >
                    {queueExportMutation.isPending ? 'Exporting…' : '⬇ Export'}
                </button>
            </PermisssionGuard>
            {onAdd && (
                <PermisssionGuard permission={PERMISSIONS.CUSTOMERS.CREATE}>
                    <button
                        type="button"
                        onClick={onAdd}
                        className="btn btn-primary btn-sm"
                    >
                        {SVGICON.plus} Add Customer
                    </button>
                </PermisssionGuard>
            )}
        </div>
    );

    /* Render */
    return (
        <>
            {title}
            {/* Filter Box */}
            <FilterBox title="Filter Customers">
                <Form onSubmit={handleSearch}>
                    <Row className="g-3 align-items-end">
                        <Col md={4}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Search
                            </Form.Label>
                            <InputGroup>
                                <Form.Control
                                    placeholder="Name, email or phone…"
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
                                onChange={e =>
                                    handleBlacklistFilter(e.target.value)
                                }
                                defaultValue=""
                            >
                                <option value="">All Customers</option>
                                <option value="0">Active</option>
                                <option value="1">Blacklisted</option>
                            </Form.Select>
                        </Col>
                        {hasGlobalBranchAccess && allBranches.length > 0 && (
                            <Col md={2}>
                                <Form.Label className="small fw-semibold text-muted mb-1">
                                    Branch
                                </Form.Label>
                                <Form.Select
                                    className="tw:h-[2.9rem]"
                                    onChange={e =>
                                        handleBranchFilter(e.target.value)
                                    }
                                    defaultValue=""
                                >
                                    <option value="">All Branches</option>
                                    {allBranches.map(branch => (
                                        <option
                                            key={branch.id}
                                            value={branch.id}
                                        >
                                            {branch.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Col>
                        )}
                        <Col md={2}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                From
                            </Form.Label>
                            <DatePickerField
                                value={
                                    (
                                        filters as GenericFilters & {
                                            from_date?: string;
                                        }
                                    ).from_date ?? ''
                                }
                                onChange={val =>
                                    handleDateFilter('from_date', val)
                                }
                                placeholder="Start date"
                            />
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                To
                            </Form.Label>
                            <DatePickerField
                                value={
                                    (
                                        filters as GenericFilters & {
                                            to_date?: string;
                                        }
                                    ).to_date ?? ''
                                }
                                onChange={val =>
                                    handleDateFilter('to_date', val)
                                }
                                placeholder="End date"
                            />
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
                title="All Customers"
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
                deleteTargetName={deleteTarget?.name}
                onDeleteRequest={setDeleteTarget}
                onDeleteConfirm={handleDeleteConfirm}
                onDeleteCancel={() => setDeleteTarget(null)}
                isDeleting={deleteMutation.isPending}
                onPageChange={handlePageChange}
                headerActions={headerActions}
                emptyTitle="No customers found"
                emptyMessage="Add your first customer to get started."
            />

            {verifyTarget && (
                <VerifyCustomerModal
                    show={!!verifyTarget}
                    customer={verifyTarget}
                    onClose={() => setVerifyTarget(null)}
                />
            )}
        </>
    );
}
