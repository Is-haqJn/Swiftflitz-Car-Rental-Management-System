import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';
import {
    Badge,
    Button,
    ButtonGroup,
    Card,
    Col,
    Form,
    InputGroup,
    Row,
} from 'react-bootstrap';
import DatePickerField from '@adminComponents/DatePickerField';
import FilterBox from '@adminComponents/ui/FilterBox';
import { ChartSkeleton } from '@adminComponents/skeletons/ChartSkeleton';
import {
    useTransactions,
    useTransactionTrends,
} from '@/shared/hooks/queries/useTransactions';
import type {
    Transaction,
    TransactionChannel,
    TransactionFilters,
    TransactionStatus,
    TransactionType,
    TransactionSummaryStats,
} from '@/shared/types/transaction.types';
import {
    TRANSACTION_TYPE_LABELS as TYPE_LABELS,
    TRANSACTION_CHANNEL_LABELS as CHANNEL_LABELS,
    TRANSACTABLE_TYPE_LABELS as TRANSACTABLE_LABELS,
    formatChannelLabel,
    getChannelVariant,
} from '@/shared/types/transaction.types';
import DataTable, { type Column } from '@adminComponents/DataTable';
import { useTitle } from '@/shared/hooks';
import {
    useFormatCurrency,
    useGeneralSettings,
} from '@/shared/hooks/queries/useSettings';
import { formatWithSymbol } from '@/shared/libs/currency';
import { useAppSelector } from '@/store';
import { selectActiveBranchId } from '@/store/slices/activeBranchSlice';
import { ROUTES } from '@/shared/routes';
import { PERMISSIONS } from '@/shared/config/permissions';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';

/* Badge helpers */
const STATUS_VARIANT: Record<TransactionStatus, string> = {
    paid: 'success',
    pending: 'warning',
    failed: 'danger',
    under_review: 'warning',
    refunded: 'info',
};

const TYPE_VARIANT: Record<TransactionType, string> = {
    payment: 'primary',
    refund: 'info',
    cancellation_fee: 'danger',
    overdue_charge: 'warning',
    security_deposit: 'secondary',
    deposit_refund: 'info',
    deposit_waived: 'light',
    manual_payment: 'dark',
    initial_payment: 'primary',
    part_payment: 'info',
    full_payment: 'success',
    discount: 'success',
    damage_charge: 'danger',
    repair_cost: 'warning',
    resolve_debt: 'success',
    cancellation_refund: 'info',
};

/* Payment Trend Card - collected vs refunded per day */
function PaymentTrendCard({
    period,
    onPeriodChange,
}: {
    period: string;
    onPeriodChange: (p: string) => void;
}) {
    const formatCurrency = useFormatCurrency();
    const { data: response, isLoading } = useTransactionTrends(period);
    const trend = response?.data?.trend ?? [];

    const collectedTotal = trend.reduce(
        (s, p) => s + Number(p.collected || 0),
        0
    );
    const refundedTotal = trend.reduce(
        (s, p) => s + Number(p.refunded || 0),
        0
    );

    const options: ApexCharts.ApexOptions = {
        chart: {
            type: 'area',
            height: 280,
            toolbar: { show: false },
            zoom: { enabled: false },
            foreColor: '#6b7280',
        },
        colors: ['#22c55e', '#ef4444'],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.35,
                opacityTo: 0.05,
                stops: [0, 90, 100],
            },
        },
        xaxis: {
            categories: trend.map(p => p.label),
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { colors: '#6b7280', fontSize: '11px' } },
        },
        yaxis: {
            min: 0,
            labels: {
                formatter: (val: number) => {
                    if (val >= 1_000_000)
                        return `${(val / 1_000_000).toFixed(1)}M`;
                    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
                    return val.toFixed(0);
                },
                style: { colors: '#6b7280', fontSize: '11px' },
            },
        },
        grid: {
            borderColor: '#f1f5f9',
            strokeDashArray: 4,
        },
        tooltip: {
            theme: 'light',
            fillSeriesColor: false,
            style: { fontSize: '12px', fontFamily: 'inherit' },
            y: { formatter: (val: number) => formatCurrency(val) },
        },
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'right',
            fontSize: '12px',
            fontFamily: 'inherit',
            labels: { colors: '#374151' },
        },
    };

    const series = [
        { name: 'Collected', data: trend.map(p => Number(p.collected || 0)) },
        { name: 'Refunded', data: trend.map(p => Number(p.refunded || 0)) },
    ];

    return (
        <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                    <h6 className="mb-0 fw-bold">Transaction Trend</h6>
                    {!isLoading && (
                        <small className="text-muted">
                            {formatCurrency(collectedTotal)} collected ·{' '}
                            {formatCurrency(refundedTotal)} refunded
                        </small>
                    )}
                </div>
                <ButtonGroup size="sm">
                    {(['7d', '30d', '90d'] as const).map(p => (
                        <Button
                            key={p}
                            variant={
                                period === p ? 'primary' : 'outline-secondary'
                            }
                            onClick={() => onPeriodChange(p)}
                            style={{ fontSize: '0.75rem' }}
                        >
                            {p === '7d'
                                ? '7 days'
                                : p === '30d'
                                  ? '30 days'
                                  : '90 days'}
                        </Button>
                    ))}
                </ButtonGroup>
            </Card.Header>
            <Card.Body>
                {isLoading ? (
                    <ChartSkeleton height={280} />
                ) : trend.length === 0 ? (
                    <div className="text-center text-muted py-5 small">
                        No transaction data available
                    </div>
                ) : (
                    <ReactApexChart
                        options={options}
                        series={series}
                        type="area"
                        height={280}
                    />
                )}
            </Card.Body>
        </Card>
    );
}

const CHANNEL_COLOR: Record<string, string> = {
    momo: '#f59e0b',
    card: '#0074FF',
    cash: '#22c55e',
    bank_transfer: '#06b6d4',
    online: '#8b5cf6',
    manual: '#64748b',
    unknown: '#94a3b8',
};

/* Channel Breakdown Donut Card */
function ChannelBreakdownCard({ period }: { period: string }) {
    const formatCurrency = useFormatCurrency();
    const { data: response, isLoading } = useTransactionTrends(period);
    const channels = response?.data?.channels ?? [];
    const total = channels.reduce((s, c) => s + Number(c.total || 0), 0);

    const series = channels.map(c => Number(c.total || 0));
    const labels = channels.map(c => formatChannelLabel(c.channel));
    const colors = channels.map(c => CHANNEL_COLOR[c.channel] ?? '#94a3b8');

    const options: ApexCharts.ApexOptions = {
        chart: {
            type: 'donut',
            toolbar: { show: false },
            foreColor: '#374151',
        },
        labels,
        colors,
        stroke: { width: 0 },
        legend: {
            show: true,
            position: 'bottom',
            fontSize: '12px',
            fontFamily: 'inherit',
            itemMargin: { horizontal: 8 },
            labels: { colors: '#374151' },
        },
        dataLabels: { enabled: false },
        plotOptions: {
            pie: {
                donut: {
                    size: '65%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Total',
                            fontSize: '13px',
                            color: '#6b7280',
                            formatter: w =>
                                formatCurrency(
                                    w.globals.seriesTotals.reduce(
                                        (a: number, b: number) => a + b,
                                        0
                                    )
                                ),
                        },
                    },
                },
            },
        },
        tooltip: {
            theme: 'light',
            fillSeriesColor: false,
            style: { fontSize: '12px', fontFamily: 'inherit' },
            y: { formatter: (val: number) => formatCurrency(val) },
        },
    };

    return (
        <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
                <h6 className="mb-0 fw-bold">Payments Received</h6>
                <small className="text-muted">By channel · {period}</small>
            </Card.Header>
            <Card.Body className="d-flex align-items-center justify-content-center">
                {isLoading ? (
                    <ChartSkeleton height={280} />
                ) : total === 0 ? (
                    <div className="text-center text-muted py-5 small">
                        No channel data
                    </div>
                ) : (
                    <ReactApexChart
                        options={options}
                        series={series}
                        type="donut"
                        height={280}
                        width="100%"
                    />
                )}
            </Card.Body>
        </Card>
    );
}

/* Summary Cards */
function SummaryCards({
    stats,
    isLoading,
}: {
    stats: TransactionSummaryStats | undefined;
    isLoading: boolean;
}) {
    const formatCurrency = useFormatCurrency();

    const cards = [
        {
            label: 'Collected Revenue',
            value: stats
                ? formatCurrency(stats.total_collected ?? stats.total_paid)
                : '-',
            color: '#22c55e',
            bg: 'rgba(34,197,94,0.08)',
            icon: '↓',
            tooltip: 'Paid transactions excluding refunds',
        },
        {
            label: 'Net Revenue',
            value: stats ? formatCurrency(stats.net_revenue ?? 0) : '-',
            color: '#0074ff',
            bg: 'rgba(0,116,255,0.08)',
            icon: '=',
            tooltip: 'Collected minus all refunds',
        },
        {
            label: 'Refunded',
            value: stats ? formatCurrency(stats.total_refunded) : '-',
            color: '#06b6d4',
            bg: 'rgba(6,182,212,0.08)',
            icon: '↩',
            tooltip: 'All refund types (refund, deposit, cancellation)',
        },
        {
            label: 'Pending',
            value: stats ? formatCurrency(stats.total_pending) : '-',
            color: '#f59e0b',
            bg: 'rgba(245,158,11,0.08)',
            icon: '⏳',
            tooltip: 'Awaiting payment confirmation',
        },
    ];

    return (
        <Row className="g-3 mb-4">
            {cards.map(card => (
                <Col key={card.label} xs={6} lg={3}>
                    <div
                        className="rounded-3 p-3 h-100"
                        title={card.tooltip}
                        style={{
                            background: card.bg,
                            border: `1px solid ${card.color}22`,
                            cursor: 'default',
                        }}
                    >
                        <div
                            className="d-flex align-items-center gap-2 mb-1"
                            style={{
                                color: card.color,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                        >
                            <span style={{ fontSize: '1rem' }}>
                                {card.icon}
                            </span>
                            {card.label}
                        </div>
                        <div
                            className="fw-bold"
                            style={{
                                fontSize: '1.35rem',
                                color: card.color,
                                minHeight: '1.8rem',
                            }}
                        >
                            {isLoading ? (
                                <span
                                    className="placeholder col-6 rounded"
                                    style={{
                                        background: card.color,
                                        opacity: 0.3,
                                    }}
                                />
                            ) : (
                                card.value
                            )}
                        </div>
                    </div>
                </Col>
            ))}
        </Row>
    );
}

/* Main Component */
export default function TransactionsList() {
    useTitle('Transactions');
    const navigate = useNavigate();
    const formatCurrency = useFormatCurrency();
    const { data: generalSettings } = useGeneralSettings();
    const globalSymbol = generalSettings?.data?.currency_symbol ?? 'GHS';
    const activeBranchId = useAppSelector(selectActiveBranchId);

    const [filters, setFilters] = useState<TransactionFilters>({
        page: 1,
        per_page: 15,
    });
    const [search, setSearch] = useState('');
    const [trendPeriod, setTrendPeriod] = useState<string>('30d');

    const { data: response, isLoading, isError } = useTransactions(filters);

    const transactions = useMemo<Transaction[]>(
        () => response?.data ?? [],
        [response]
    );
    const meta = response?.meta ?? null;
    const stats = response?.stats;

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
        setFilters({ page: 1, per_page: 15 });
    }, []);

    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }));
    }, []);

    const handlePerPageChange = useCallback((perPage: number) => {
        /* -1 signals "All" - send a large number so the backend returns everything */
        setFilters(prev => ({
            ...prev,
            per_page: perPage === -1 ? 10000 : perPage,
            page: 1,
        }));
    }, []);

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
            key: 'type',
            label: 'Type',
            render: t => (
                <Badge
                    bg={TYPE_VARIANT[t.type] ?? 'secondary'}
                    style={{ fontSize: '0.7rem' }}
                >
                    {t.type_label}
                </Badge>
            ),
        },
        {
            key: 'channel' as const,
            label: 'Channel',
            render: t =>
                t.channel ? (
                    <Badge
                        bg={getChannelVariant(t.channel)}
                        style={{ fontSize: '0.7rem' }}
                    >
                        {formatChannelLabel(t.channel)}
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
            render: t => {
                const showConverted =
                    !!t.exchange_rate &&
                    t.exchange_rate !== 1 &&
                    (!activeBranchId || activeBranchId !== t.branch_id);
                const fmt =
                    showConverted && t.exchange_rate && t.currency_symbol
                        ? `${formatWithSymbol(t.amount, t.currency_symbol)} / ${formatWithSymbol(t.amount * t.exchange_rate, globalSymbol)}`
                        : t.currency_symbol
                          ? formatWithSymbol(t.amount, t.currency_symbol)
                          : formatCurrency(t.amount);
                return <span className="fw-semibold">{fmt}</span>;
            },
        },
        {
            key: 'status',
            label: 'Status',
            render: t => (
                <Badge
                    bg={STATUS_VARIANT[t.status] ?? 'secondary'}
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
            label: 'Booking',
            render: t =>
                t.transactable ? (
                    <div>
                        <span
                            className="text-muted"
                            style={{ fontSize: '0.75rem' }}
                        >
                            {TRANSACTABLE_LABELS[t.transactable.type]}
                        </span>
                        <br />
                        <span
                            className="fw-semibold"
                            style={{ fontSize: '0.8rem' }}
                        >
                            {t.transactable.reference ?? '-'}
                        </span>
                    </div>
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

    const hasActiveFilters =
        filters['filter[search]'] ||
        filters['filter[status]'] ||
        filters['filter[type]'] ||
        filters['filter[provider]'] ||
        filters['filter[channel]'] ||
        filters['filter[transactable_type]'] ||
        filters['filter[date_from]'] ||
        filters['filter[date_to]'];

    return (
        <PermisssionGuard permission={PERMISSIONS.TRANSACTIONS.VIEW_ALL}>
            <div className="container-fluid py-4 px-4">
                {/* Header */}
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <div>
                        <h4 className="fw-bold mb-0">Transactions</h4>
                        <small className="text-muted">
                            All financial transactions across rentals, airport
                            transfers, and chauffeur bookings
                        </small>
                    </div>
                </div>

                {/* Summary Cards */}
                <SummaryCards stats={stats} isLoading={isLoading} />

                {/* Filters */}
                <FilterBox title="Filter Transactions">
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
                                    Status
                                </Form.Label>
                                <Form.Select
                                    className="tw:h-[2.9rem]"
                                    value={filters['filter[status]'] ?? ''}
                                    onChange={e =>
                                        handleFilterChange(
                                            'filter[status]',
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="">All Statuses</option>
                                    <option value="paid">Paid</option>
                                    <option value="pending">Pending</option>
                                    <option value="failed">Failed</option>
                                </Form.Select>
                            </Col>

                            <Col xs={6} md={2}>
                                <Form.Label className="small fw-semibold text-muted mb-1">
                                    Type
                                </Form.Label>
                                <Form.Select
                                    className="tw:h-[2.9rem]"
                                    value={filters['filter[type]'] ?? ''}
                                    onChange={e =>
                                        handleFilterChange(
                                            'filter[type]',
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="">All Types</option>
                                    {(
                                        Object.entries(TYPE_LABELS) as [
                                            TransactionType,
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
                                    Booking Type
                                </Form.Label>
                                <Form.Select
                                    className="tw:h-[2.9rem]"
                                    value={
                                        filters['filter[transactable_type]'] ??
                                        ''
                                    }
                                    onChange={e =>
                                        handleFilterChange(
                                            'filter[transactable_type]',
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="">All Booking Types</option>
                                    {(
                                        Object.entries(TRANSACTABLE_LABELS) as [
                                            string,
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

                {/* Charts */}
                <Row className="g-3 mb-4">
                    <Col xl={8} lg={12}>
                        <PaymentTrendCard
                            period={trendPeriod}
                            onPeriodChange={setTrendPeriod}
                        />
                    </Col>
                    <Col xl={4} lg={12}>
                        <ChannelBreakdownCard period={trendPeriod} />
                    </Col>
                </Row>

                {/* Table */}
                {isError ? (
                    <div className="alert alert-danger">
                        Failed to load transactions.
                    </div>
                ) : (
                    <DataTable
                        title="Transactions"
                        columns={columns}
                        data={transactions}
                        isLoading={isLoading}
                        meta={meta}
                        onPageChange={handlePageChange}
                        perPage={
                            filters.per_page === 10000 ? -1 : filters.per_page
                        }
                        onPerPageChange={handlePerPageChange}
                        emptyMessage="No transactions found."
                    />
                )}
            </div>
        </PermisssionGuard>
    );
}
