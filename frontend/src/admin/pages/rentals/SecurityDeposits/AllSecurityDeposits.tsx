import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Badge,
    Button,
    ButtonGroup,
    Col,
    Form,
    InputGroup,
    Row,
} from 'react-bootstrap';
import DatePickerField from '@adminComponents/DatePickerField';
import FilterBox from '@adminComponents/ui/FilterBox';
import { useTransactions } from '@/shared/hooks/queries/useTransactions';
import type {
    Transaction,
    TransactionChannel,
    TransactionFilters,
    TransactionType,
} from '@/shared/types/transaction.types';
import { TRANSACTION_CHANNEL_LABELS as CHANNEL_LABELS } from '@/shared/types/transaction.types';
import DataTable, { type Column } from '@adminComponents/DataTable';
import { useTitle } from '@/shared/hooks';
import { useFormatCurrency } from '@/shared/hooks/queries/useSettings';
import { ROUTES } from '@/shared/routes';
import { PERMISSIONS } from '@/shared/config/permissions';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';

const DEPOSIT_TYPES: {
    value: TransactionType;
    label: string;
    variant: string;
}[] = [
    {
        value: 'security_deposit',
        label: 'Security Deposits',
        variant: 'secondary',
    },
    { value: 'deposit_refund', label: 'Deposit Refunds', variant: 'info' },
    { value: 'deposit_waived', label: 'Waivers', variant: 'warning' },
];

const CHANNEL_VARIANT: Record<TransactionChannel, string> = {
    momo: 'warning',
    card: 'primary',
    cash: 'success',
    bank_transfer: 'info',
    online: 'secondary',
    manual: 'dark',
};

export default function AllSecurityDeposits() {
    useTitle('Security Deposits');
    const navigate = useNavigate();
    const formatCurrency = useFormatCurrency();

    const [activeType, setActiveType] =
        useState<TransactionType>('security_deposit');
    const [filters, setFilters] = useState<TransactionFilters>({
        page: 1,
        per_page: 15,
        'filter[type]': 'security_deposit',
    });
    const [search, setSearch] = useState('');

    const { data: response, isLoading, isError } = useTransactions(filters);

    const transactions = useMemo<Transaction[]>(
        () => response?.data ?? [],
        [response]
    );
    const meta = response?.meta ?? null;

    const handleTypeChange = useCallback((type: TransactionType) => {
        setActiveType(type);
        setSearch('');
        setFilters({
            page: 1,
            per_page: 15,
            'filter[type]': type,
        });
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

    const handleFilterChange = useCallback(
        (key: keyof TransactionFilters, value: string) => {
            setFilters(prev => ({
                ...prev,
                [key]: value || undefined,
                page: 1,
            }));
        },
        []
    );

    const handleClearFilters = useCallback(() => {
        setSearch('');
        setFilters({ page: 1, per_page: 15, 'filter[type]': activeType });
    }, [activeType]);

    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }));
    }, []);

    const handlePerPageChange = useCallback((perPage: number) => {
        setFilters(prev => ({
            ...prev,
            per_page: perPage === -1 ? 10000 : perPage,
            page: 1,
        }));
    }, []);

    /* Summary stats derived from the current page result */
    const totalAmount = useMemo(
        () => transactions.reduce((sum, t) => sum + (t.amount ?? 0), 0),
        [transactions]
    );

    const hasActiveFilters =
        filters['filter[search]'] ||
        filters['filter[channel]'] ||
        filters['filter[date_from]'] ||
        filters['filter[date_to]'];

    const columns: Column<Transaction>[] = [
        {
            key: 'reference',
            label: 'Reference',
            render: t => (
                <div>
                    <span
                        className="fw-bold text-primary"
                        style={{ cursor: 'pointer', fontSize: '0.85rem' }}
                        onClick={() =>
                            navigate(
                                ROUTES.DASHBOARD.FINANCE.TRANSACTIONS.VIEW(t.id)
                            )
                        }
                    >
                        {t.reference}
                    </span>
                    <br />
                    <small className="text-muted">{t.provider}</small>
                </div>
            ),
        },
        {
            key: 'channel' as const,
            label: 'Channel',
            render: t =>
                t.channel ? (
                    <Badge
                        bg={CHANNEL_VARIANT[t.channel] ?? 'secondary'}
                        style={{ fontSize: '0.7rem' }}
                    >
                        {CHANNEL_LABELS[t.channel]}
                    </Badge>
                ) : (
                    <span
                        className="text-muted"
                        style={{ fontSize: '0.75rem' }}
                    >
                        -
                    </span>
                ),
        },
        {
            key: 'amount',
            label: 'Amount',
            render: t => (
                <span className="fw-semibold">{formatCurrency(t.amount)}</span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: t => (
                <Badge
                    bg={
                        t.status === 'paid'
                            ? 'success'
                            : t.status === 'pending'
                              ? 'warning'
                              : 'danger'
                    }
                    style={{ fontSize: '0.7rem' }}
                >
                    {t.status_label}
                </Badge>
            ),
        },
        {
            key: 'payer' as const,
            label: 'Customer',
            render: t => (
                <div>
                    <span
                        className="fw-semibold"
                        style={{ fontSize: '0.85rem' }}
                    >
                        {t.payer.name}
                    </span>
                    <br />
                    <small className="text-muted">{t.payer.email}</small>
                </div>
            ),
        },
        {
            key: 'transactable' as const,
            label: 'Rental',
            render: t =>
                t.transactable ? (
                    <span
                        className="fw-semibold text-primary"
                        style={{ fontSize: '0.8rem', cursor: 'pointer' }}
                        onClick={() => {
                            if (t.transactable?.type === 'rental') {
                                navigate(
                                    ROUTES.DASHBOARD.RENTALS.VIEW(
                                        t.transactable.id
                                    )
                                );
                            }
                        }}
                    >
                        {t.transactable.reference ?? '-'}
                    </span>
                ) : (
                    <span className="text-muted">-</span>
                ),
        },
        {
            key: 'created_at',
            label: 'Date',
            render: t => (
                <span style={{ fontSize: '0.8rem' }}>
                    {new Date(t.created_at).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </span>
            ),
        },
        {
            key: 'id' as const,
            label: '',
            className: 'text-end',
            render: t => (
                <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() =>
                        navigate(
                            ROUTES.DASHBOARD.FINANCE.TRANSACTIONS.VIEW(t.id)
                        )
                    }
                    style={{ fontSize: '0.75rem', padding: '2px 10px' }}
                >
                    View
                </Button>
            ),
        },
    ];

    return (
        <PermisssionGuard permission={PERMISSIONS.TRANSACTIONS.VIEW_ALL}>
            <div className="container-fluid py-4 px-4">
                {/* Header */}
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <div>
                        <h4 className="fw-bold mb-0">Security Deposits</h4>
                        <small className="text-muted">
                            Deposits collected, refunded, and waived across all
                            rentals
                        </small>
                    </div>
                </div>

                {/* Type toggle */}
                <div className="mb-4 d-flex align-items-center gap-3 flex-wrap">
                    <ButtonGroup>
                        {DEPOSIT_TYPES.map(dt => (
                            <Button
                                key={dt.value}
                                variant={
                                    activeType === dt.value
                                        ? dt.variant
                                        : 'outline-secondary'
                                }
                                onClick={() => handleTypeChange(dt.value)}
                                size="sm"
                            >
                                {dt.label}
                            </Button>
                        ))}
                    </ButtonGroup>
                    {meta && !isLoading && (
                        <small className="text-muted">
                            {meta.total} record{meta.total !== 1 ? 's' : ''}
                            {' · '}
                            {formatCurrency(totalAmount)} on this page
                        </small>
                    )}
                </div>

                {/* Filters */}
                <FilterBox title="Filter Deposits">
                    <Form onSubmit={handleSearch}>
                        <Row className="g-2 align-items-end">
                            <Col xs={12} md={4}>
                                <Form.Label className="small fw-semibold text-muted mb-1">
                                    Search
                                </Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        placeholder="Search reference, name or email…"
                                        value={search}
                                        onChange={e =>
                                            setSearch(e.target.value)
                                        }
                                    />
                                    <Button type="submit" variant="primary">
                                        Search
                                    </Button>
                                </InputGroup>
                            </Col>

                            <Col xs={6} md={2}>
                                <Form.Label className="small fw-semibold text-muted mb-1">
                                    Channel
                                </Form.Label>
                                <Form.Select
                                    className="tw:h-[2.9rem]"
                                    value={filters['filter[channel]'] ?? ''}
                                    onChange={e =>
                                        handleFilterChange(
                                            'filter[channel]',
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="">All Channels</option>
                                    {(
                                        Object.entries(CHANNEL_LABELS) as [
                                            TransactionChannel,
                                            string,
                                        ][]
                                    ).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Col>

                            <Col xs={6} md={2}>
                                <Form.Label className="small fw-semibold text-muted mb-1">
                                    From
                                </Form.Label>
                                <DatePickerField
                                    value={filters['filter[date_from]'] ?? ''}
                                    onChange={v =>
                                        handleFilterChange(
                                            'filter[date_from]',
                                            v
                                        )
                                    }
                                    placeholder="Start date"
                                />
                            </Col>

                            <Col xs={6} md={2}>
                                <Form.Label className="small fw-semibold text-muted mb-1">
                                    To
                                </Form.Label>
                                <DatePickerField
                                    value={filters['filter[date_to]'] ?? ''}
                                    onChange={v =>
                                        handleFilterChange('filter[date_to]', v)
                                    }
                                    placeholder="End date"
                                />
                            </Col>

                            {hasActiveFilters && (
                                <Col
                                    xs="auto"
                                    className="d-flex align-items-end"
                                >
                                    <Button
                                        variant="outline-secondary"
                                        onClick={handleClearFilters}
                                    >
                                        Clear
                                    </Button>
                                </Col>
                            )}
                        </Row>
                    </Form>
                </FilterBox>

                {/* Table */}
                {isError ? (
                    <div className="alert alert-danger">
                        Failed to load security deposits.
                    </div>
                ) : (
                    <DataTable
                        title="Security Deposits"
                        columns={columns}
                        data={transactions}
                        isLoading={isLoading}
                        meta={meta}
                        onPageChange={handlePageChange}
                        perPage={
                            filters.per_page === 10000 ? -1 : filters.per_page
                        }
                        onPerPageChange={handlePerPageChange}
                        emptyMessage="No deposit transactions found for this type."
                    />
                )}
            </div>
        </PermisssionGuard>
    );
}
