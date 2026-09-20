import { useState } from 'react';
import { Link } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';
import {
    Card,
    Row,
    Col,
    Badge,
    Table,
    ButtonGroup,
    Button,
} from 'react-bootstrap';
import { DashboardSkeleton } from '@adminComponents/skeletons/DashboardSkeleton';
import { ChartSkeleton } from '@adminComponents/skeletons/ChartSkeleton';
import { SkeletonTableRows } from '@/shared/components/ui/Skeleton';
import {
    useDashboardStats,
    useRecentActivity,
    useUpcomingReturns,
    useRevenueTrend,
} from '@/shared/hooks/queries/useDashboard';
import { ROUTES } from '@/shared/routes';
import type {
    RecentRental,
    RevenueTrendPoint,
    UpcomingReturn,
} from '@/shared/types';
import { PERMISSIONS } from '@/shared/config/permissions';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { usePermission } from '@/shared/hooks/usePermission';
import { useAppSelector } from '@/store';
import { selectActiveBranchId } from '@/store/slices/activeBranchSlice';
import { useTitle } from '@/shared/hooks';
import { formatDate, rentalStatusVariant } from '@/shared/libs/utils';
import {
    useCurrency,
    useFormatCurrency,
} from '@/shared/hooks/queries/useSettings';
import { formatWithSymbol } from '@/shared/libs/currency';

/* Revenue Bar Chart */
interface RevenueChartCardProps {
    data: RevenueTrendPoint[];
    isLoading: boolean;
    period: string;
    onPeriodChange: (p: string) => void;
    currencySymbol?: string | null;
    currencyCode?: string | null;
}

function RevenueChartCard({
    data,
    isLoading,
    period,
    onPeriodChange,
    currencySymbol,
    currencyCode,
}: RevenueChartCardProps) {
    const currency = useCurrency();
    const formatCurrency = useFormatCurrency();
    const fmt = (n: number) =>
        currencySymbol
            ? formatWithSymbol(n, currencySymbol)
            : formatCurrency(n);
    const totalRevenue = data.reduce((s, d) => s + (Number(d.revenue) || 0), 0);
    const totalRentals = data.reduce((s, d) => s + (Number(d.count) || 0), 0);

    const TREND_PERIODS = [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
    ] as const;

    const chartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: 'area',
            height: 260,
            toolbar: { show: false },
            zoom: { enabled: false },
            foreColor: '#6b7280',
            sparkline: { enabled: false },
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2, colors: ['#22c55e'] },
        colors: ['#22c55e'],
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.35,
                opacityTo: 0.03,
                stops: [0, 90, 100],
            },
        },
        xaxis: {
            categories: data.map(d => d.period),
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { colors: '#6b7280', fontSize: '11px' } },
        },
        yaxis: {
            min: 0,
            labels: {
                formatter: (val: number) => {
                    if (val >= 1_000_000) {
                        return `${(val / 1_000_000).toFixed(1)}M`;
                    }

                    if (val >= 1_000) {
                        return `${(val / 1_000).toFixed(0)}K`;
                    }

                    return val.toFixed(0);
                },
                style: { colors: '#6b7280', fontSize: '11px' },
            },
        },
        grid: {
            borderColor: '#f1f5f9',
            strokeDashArray: 4,
            yaxis: { lines: { show: true } },
        },
        tooltip: {
            theme: 'light',
            fillSeriesColor: false,
            style: { fontSize: '12px', fontFamily: 'inherit' },
            y: {
                formatter: (
                    val: number,
                    opts?: { dataPointIndex?: number }
                ) => {
                    const count = data[opts?.dataPointIndex ?? 0]?.count ?? 0;
                    return `${fmt(val)} · ${count} rental${count !== 1 ? 's' : ''}`;
                },
            },
        },
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'left',
            fontSize: '12px',
            fontFamily: 'inherit',
            markers: { size: 6 },
            labels: { colors: '#6b7280' },
            itemMargin: { horizontal: 8 },
        },
        markers: { size: 0 },
    };

    const chartSeries = [
        {
            name: `Revenue (${currencyCode ?? currency})`,
            data: data.map(d => Number(d.revenue) || 0),
        },
    ];

    return (
        <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2 border-0 pb-0">
                <div>
                    <Card.Title className="mb-0 fs-6">Revenue Trend</Card.Title>
                    {!isLoading && data.length > 0 && (
                        <small className="text-muted">
                            {fmt(totalRevenue)} · {totalRentals} rental
                            {totalRentals !== 1 ? 's' : ''}
                        </small>
                    )}
                </div>
                <ButtonGroup size="sm">
                    {TREND_PERIODS.map(p => (
                        <Button
                            key={p.value}
                            variant={
                                period === p.value
                                    ? 'primary'
                                    : 'outline-secondary'
                            }
                            onClick={() => onPeriodChange(p.value)}
                            style={{ fontSize: '0.75rem' }}
                        >
                            {p.label}
                        </Button>
                    ))}
                </ButtonGroup>
            </Card.Header>
            <Card.Body className="pt-2 pb-0">
                {isLoading ? (
                    <ChartSkeleton height={260} />
                ) : data.length === 0 ? (
                    <div className="text-center text-muted py-5 small">
                        No revenue data available
                    </div>
                ) : (
                    <ReactApexChart
                        options={chartOptions}
                        series={chartSeries}
                        type="area"
                        height={260}
                    />
                )}
            </Card.Body>
        </Card>
    );
}

/* Fleet Status PolarArea Chart */
interface FleetChartProps {
    available: number;
    inUse: number;
    other: number;
}

function FleetStatusChart({ available, inUse, other }: FleetChartProps) {
    const safeAvailable = Number(available) || 0;
    const safeInUse = Number(inUse) || 0;
    const safeOther = Number(other) || 0;
    const total = safeAvailable + safeInUse + safeOther;

    const allSegments = [
        { label: 'Available', value: safeAvailable, color: '#22c55e' },
        { label: 'In Use', value: safeInUse, color: '#3b82f6' },
        { label: 'Other', value: safeOther, color: '#94a3b8' },
    ].filter(s => s.value > 0);

    const series = allSegments.map(s => s.value);
    const options: ApexCharts.ApexOptions = {
        chart: {
            type: 'donut',
            toolbar: { show: false },
            foreColor: '#374151',
        },
        labels: allSegments.map(s => s.label),
        colors: allSegments.map(s => s.color),
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
                donut: { size: '65%' },
            },
        },
        tooltip: {
            theme: 'light',
            fillSeriesColor: false,
            style: { fontSize: '12px', fontFamily: 'inherit' },
            y: {
                formatter: (val: number) =>
                    `${val} vehicle${val !== 1 ? 's' : ''}`,
            },
        },
    };

    return (
        <Card className="h-100">
            <Card.Header className="border-0 pb-0">
                <Card.Title className="mb-0 fs-6">Fleet Status</Card.Title>
                <small className="text-muted">{total} total vehicles</small>
            </Card.Header>
            <Card.Body className="pt-0 d-flex align-items-center justify-content-center">
                {total === 0 ? (
                    <p className="text-muted small mb-0">No vehicle data</p>
                ) : (
                    <ReactApexChart
                        options={options}
                        series={series}
                        type="donut"
                        height={240}
                        width="100%"
                    />
                )}
            </Card.Body>
        </Card>
    );
}

/* Rental Status Donut Chart */
interface RentalStatusChartProps {
    active: number;
    pending: number;
    overdue: number;
}

function RentalStatusChart({
    active,
    pending,
    overdue,
}: RentalStatusChartProps) {
    const safeActive = Number(active) || 0;
    const safePending = Number(pending) || 0;
    const safeOverdue = Number(overdue) || 0;
    const rentalTotal = safeActive + safePending + safeOverdue;

    const series = [safeActive, safePending, safeOverdue];
    const options: ApexCharts.ApexOptions = {
        chart: {
            type: 'donut',
            toolbar: { show: false },
            foreColor: '#374151',
        },
        labels: ['Active', 'Pending', 'Overdue'],
        colors: ['#22c55e', '#f59e0b', '#ef4444'],
        legend: {
            show: true,
            position: 'bottom',
            fontSize: '12px',
            fontFamily: 'inherit',
            itemMargin: { horizontal: 8 },
            labels: { colors: '#374151' },
        },
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
                            formatter: w => {
                                return String(
                                    w.globals.seriesTotals.reduce(
                                        (a: number, b: number) => a + b,
                                        0
                                    )
                                );
                            },
                        },
                    },
                },
            },
        },
        dataLabels: { enabled: false },
        stroke: { width: 0 },
        tooltip: {
            theme: 'light',
            fillSeriesColor: false,
            style: { fontSize: '12px', fontFamily: 'inherit' },
            y: {
                formatter: (val: number) =>
                    `${val} rental${val !== 1 ? 's' : ''}`,
            },
        },
    };

    return (
        <Card className="h-100">
            <Card.Header className="border-0 pb-0">
                <Card.Title className="mb-0 fs-6">
                    Rental Distribution
                </Card.Title>
                <small className="text-muted">Active · Pending · Overdue</small>
            </Card.Header>
            <Card.Body className="pt-0 d-flex align-items-center justify-content-center">
                {rentalTotal === 0 ? (
                    <p className="text-muted small mb-0">No rental data</p>
                ) : (
                    <ReactApexChart
                        options={options}
                        series={series}
                        type="donut"
                        height={240}
                        width="100%"
                    />
                )}
            </Card.Body>
        </Card>
    );
}

/* Utilization Radial Chart */
function UtilizationChart({ rate }: { rate: number }) {
    rate = Number(rate) || 0;
    const options: ApexCharts.ApexOptions = {
        chart: {
            type: 'radialBar',
            toolbar: { show: false },
            foreColor: '#6b7280',
        },
        plotOptions: {
            radialBar: {
                startAngle: -135,
                endAngle: 135,
                hollow: { size: '60%', background: 'transparent' },
                track: {
                    background: '#e5e7eb',
                    strokeWidth: '100%',
                },
                dataLabels: {
                    name: {
                        show: true,
                        fontSize: '12px',
                        color: '#6b7280',
                        offsetY: 20,
                    },
                    value: {
                        offsetY: -10,
                        fontSize: '28px',
                        fontWeight: 700,
                        color: '#0074FF',
                        formatter: (val: number) => `${val}%`,
                    },
                },
            },
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'dark',
                type: 'horizontal',
                colorStops: [
                    { offset: 0, color: '#0074FF', opacity: 1 },
                    { offset: 100, color: '#22c55e', opacity: 1 },
                ],
            },
        },
        stroke: { dashArray: 4 },
        labels: ['Utilization'],
        colors: ['#0074FF'],
    };

    return (
        <Card className="h-100">
            <Card.Header className="border-0 pb-0">
                <Card.Title className="mb-0 fs-6">Fleet Utilization</Card.Title>
                <small className="text-muted">
                    Vehicles currently rented out
                </small>
            </Card.Header>
            <Card.Body className="pt-0 d-flex align-items-center justify-content-center">
                <ReactApexChart
                    options={options}
                    series={[rate]}
                    type="radialBar"
                    height={230}
                    width="100%"
                />
            </Card.Body>
        </Card>
    );
}

/* Stat Card */
interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    linkTo?: string;
    color?: string;
    trend?: { value: number; label?: string };
}

function StatCard({
    title,
    value,
    subtitle,
    linkTo,
    color = 'primary',
    trend,
}: StatCardProps) {
    const trendPositive = (trend?.value ?? 0) >= 0;

    return (
        <div className="card ic-chart-card">
            <div className="card-header d-block border-0 pb-0">
                <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 text-muted">{title}</h6>
                    {trend !== undefined && (
                        <span
                            className={`badge badge-sm ${trendPositive ? 'badge-success' : 'badge-danger'} light`}
                        >
                            {trendPositive ? '+' : ''}
                            {trend.value}
                            {trend.label ?? '%'}
                        </span>
                    )}
                </div>
                <span className={`data-value text-${color}`}>{value}</span>
                {subtitle && (
                    <small className="text-muted d-block mt-1">
                        {subtitle}
                    </small>
                )}
            </div>
            {linkTo && (
                <div className="card-footer border-0 pt-0">
                    <Link to={linkTo} className={`text-${color} small`}>
                        View all →
                    </Link>
                </div>
            )}
        </div>
    );
}

/* Recent Rentals Table */
function RecentRentalsTable({ rentals }: { rentals: RecentRental[] }) {
    return (
        <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
                <Card.Title className="mb-0">Recent Rentals</Card.Title>
                <Link
                    to={ROUTES.DASHBOARD.RENTALS.ROOT}
                    className="btn btn-sm btn-outline-primary"
                >
                    View All
                </Link>
            </Card.Header>
            <Card.Body className="p-0">
                <Table
                    hover
                    responsive
                    className="mb-0 align-middle table-padded"
                >
                    <thead>
                        <tr>
                            <th>Reference</th>
                            <th>Customer</th>
                            <th>Vehicle</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rentals.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="text-center text-muted py-4"
                                >
                                    No recent rentals
                                </td>
                            </tr>
                        ) : (
                            rentals.map(rental => (
                                <tr key={rental.id}>
                                    <td>
                                        <Link
                                            to={`${ROUTES.DASHBOARD.RENTALS.ROOT}/${rental.id}`}
                                            className="fw-semibold"
                                        >
                                            {rental.reference}
                                        </Link>
                                    </td>
                                    <td>{rental.customer ?? '-'}</td>
                                    <td>{rental.vehicle ?? '-'}</td>
                                    <td>
                                        <Badge
                                            bg={rentalStatusVariant(
                                                rental.status
                                            )}
                                            className="text-capitalize"
                                        >
                                            {rental.status}
                                        </Badge>
                                    </td>
                                    <td>
                                        <small className="text-muted">
                                            {formatDate(rental.created_at)}
                                        </small>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );
}

/* Upcoming Returns Table */
function UpcomingReturnsTable({ returns }: { returns: UpcomingReturn[] }) {
    return (
        <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
                <Card.Title className="mb-0">Upcoming Returns</Card.Title>
                <Link
                    to={ROUTES.DASHBOARD.RENTALS.ACTIVE}
                    className="btn btn-sm btn-outline-primary"
                >
                    View Active
                </Link>
            </Card.Header>
            <Card.Body className="p-0">
                <Table
                    hover
                    responsive
                    className="mb-0 align-middle table-padded"
                >
                    <thead>
                        <tr>
                            <th>Reference</th>
                            <th>Customer</th>
                            <th>Return Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {returns.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={3}
                                    className="text-center text-muted py-4"
                                >
                                    No upcoming returns
                                </td>
                            </tr>
                        ) : (
                            returns.map(r => (
                                <tr key={r.id}>
                                    <td>
                                        <Link
                                            to={`${ROUTES.DASHBOARD.RENTALS.ROOT}/${r.id}`}
                                            className="fw-semibold"
                                        >
                                            {r.reference}
                                        </Link>
                                    </td>
                                    <td>{r.customer?.name ?? '-'}</td>
                                    <td>
                                        <span
                                            className={
                                                r.days_overdue
                                                    ? 'text-danger fw-semibold'
                                                    : 'text-muted'
                                            }
                                        >
                                            {formatDate(r.return_date)}
                                            {r.days_overdue
                                                ? ` (${r.days_overdue}d overdue)`
                                                : ''}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );
}

/* Main Dashboard */
export default function Dashboard() {
    const formatCurrency = useFormatCurrency();
    const title = useTitle('Dashboard');
    const [trendPeriod, setTrendPeriod] = useState<string>('daily');
    const { hasPermission, user } = usePermission();
    const activeBranchId = useAppSelector(selectActiveBranchId);

    const { data: statsRes, isLoading: statsLoading } =
        useDashboardStats(activeBranchId);
    const { data: activityRes, isLoading: activityLoading } =
        useRecentActivity();
    const { data: returnsRes, isLoading: returnsLoading } =
        useUpcomingReturns();
    const canViewRevenue =
        user !== null && hasPermission(PERMISSIONS.REPORTS.VIEW_REVENUE);

    const { data: trendRes, isLoading: trendLoading } = useRevenueTrend(
        trendPeriod,
        canViewRevenue,
        activeBranchId
    );

    const stats = statsRes?.data;
    const branchCurrencySymbol = stats?.revenue?.currency_symbol ?? null;
    const branchCurrencyCode = stats?.revenue?.currency_code ?? null;
    const fmtRevenue = (n: number) =>
        branchCurrencySymbol
            ? formatWithSymbol(n, branchCurrencySymbol)
            : formatCurrency(n);
    const recentRentals: RecentRental[] =
        activityRes?.data?.recent_rentals ?? [];
    const upcomingReturns: UpcomingReturn[] = [
        ...(returnsRes?.data?.due_today ?? []),
        ...(returnsRes?.data?.overdue ?? []),
    ];
    const trendData: RevenueTrendPoint[] = trendRes?.data ?? [];

    // Fleet breakdown from stats
    const vehiclesAvailable = stats?.vehicles.available ?? 0;
    const vehiclesInUse = stats?.vehicles.in_use ?? 0;
    const vehiclesTotal = stats?.vehicles.total ?? 0;
    const vehiclesOther = Math.max(
        0,
        vehiclesTotal - vehiclesAvailable - vehiclesInUse
    );
    const utilizationRate = stats?.vehicles.utilization_rate ?? 0;

    if (statsLoading) {
        return (
            <>
                {title}
                <DashboardSkeleton />
            </>
        );
    }

    return (
        <>
            {title}
            <div className="pb-4">
                <div className="page-titles mb-3">
                    <h4>Dashboard</h4>
                    <p className="text-muted mb-0">
                        Welcome back! Here&apos;s what&apos;s happening.
                    </p>
                </div>

                {/* KPI Stats */}
                <Row className="g-3 mb-3">
                    {/* Business KPIs */}
                    <PermisssionGuard
                        permission={PERMISSIONS.REPORTS.VIEW_REVENUE}
                    >
                        <Col xl={3} md={6}>
                            <StatCard
                                title="Revenue This Month"
                                value={fmtRevenue(
                                    stats?.revenue.this_month ?? 0
                                )}
                                subtitle={`${fmtRevenue(stats?.revenue.pending_payments ?? 0)} pending`}
                                linkTo={ROUTES.DASHBOARD.REPORTS.REVENUE}
                                color="primary"
                            />
                        </Col>
                    </PermisssionGuard>
                    <PermisssionGuard
                        permission={PERMISSIONS.CUSTOMERS.VIEW_ALL}
                    >
                        <Col xl={3} md={6}>
                            <StatCard
                                title="Total Customers"
                                value={stats?.customers.total ?? 0}
                                subtitle={`+${stats?.customers.new_this_month ?? 0} this month`}
                                linkTo={ROUTES.DASHBOARD.CUSTOMERS.ROOT}
                                color="secondary"
                                trend={{
                                    value: stats?.customers.new_this_month ?? 0,
                                    label: ' new',
                                }}
                            />
                        </Col>
                    </PermisssionGuard>

                    {/* Rental Operational KPIs */}
                    <PermisssionGuard permission={PERMISSIONS.RENTALS.VIEW_ALL}>
                        <Col xl={3} md={6}>
                            <StatCard
                                title="Active Rentals"
                                value={stats?.rentals.active ?? 0}
                                subtitle={`${stats?.rentals.overdue ?? 0} overdue`}
                                linkTo={ROUTES.DASHBOARD.RENTALS.ACTIVE}
                                color="success"
                            />
                        </Col>
                    </PermisssionGuard>
                    <PermisssionGuard permission={PERMISSIONS.RENTALS.VIEW_ALL}>
                        <Col xl={3} md={6}>
                            <StatCard
                                title="Pending Rentals"
                                value={stats?.rentals.pending ?? 0}
                                subtitle={`${stats?.quotes.pending ?? 0} quote requests`}
                                linkTo={ROUTES.DASHBOARD.RENTALS.PENDING}
                                color="warning"
                            />
                        </Col>
                    </PermisssionGuard>
                    <PermisssionGuard permission={PERMISSIONS.RENTALS.VIEW_ALL}>
                        <Col xl={3} md={6}>
                            <StatCard
                                title="Confirmed Rentals"
                                value={stats?.rentals.confirmed ?? 0}
                                subtitle="Awaiting pickup"
                                linkTo={ROUTES.DASHBOARD.RENTALS.CONFIRMED}
                                color="info"
                            />
                        </Col>
                    </PermisssionGuard>
                    <PermisssionGuard permission={PERMISSIONS.RENTALS.VIEW_ALL}>
                        <Col xl={3} md={6}>
                            <StatCard
                                title="Overdue Rentals"
                                value={stats?.rentals.overdue ?? 0}
                                subtitle="Past return date"
                                linkTo={ROUTES.DASHBOARD.RENTALS.OVERDUE}
                                color="danger"
                            />
                        </Col>
                    </PermisssionGuard>

                    {/* Airport & Chauffeur KPIs */}
                    <PermisssionGuard
                        permission={PERMISSIONS.AIRPORT_TRANSFER.VIEW_ALL}
                    >
                        <Col xl={3} md={6}>
                            <StatCard
                                title="Airport Bookings This Month"
                                value={stats?.airport_bookings?.this_month ?? 0}
                                subtitle={`${stats?.airport_bookings?.pending ?? 0} pending`}
                                linkTo={
                                    hasPermission(
                                        PERMISSIONS.AIRPORT_TRANSFER.VIEW_ALL
                                    )
                                        ? ROUTES.DASHBOARD.AIRPORT_TRANSFER
                                              .BOOKINGS.ROOT
                                        : undefined
                                }
                                color="info"
                            />
                        </Col>
                    </PermisssionGuard>
                    <PermisssionGuard
                        permission={PERMISSIONS.CHAUFFEUR_RENTAL.VIEW_ALL}
                    >
                        <Col xl={3} md={6}>
                            <StatCard
                                title="Chauffeur Bookings This Month"
                                value={
                                    stats?.chauffeur_bookings?.this_month ?? 0
                                }
                                subtitle={`${stats?.chauffeur_bookings?.pending ?? 0} pending`}
                                linkTo={
                                    hasPermission(
                                        PERMISSIONS.CHAUFFEUR_RENTAL.VIEW_ALL
                                    )
                                        ? ROUTES.DASHBOARD.CHAUFFEUR_RENTAL
                                              .BOOKINGS.ROOT
                                        : undefined
                                }
                                color="primary"
                            />
                        </Col>
                    </PermisssionGuard>
                </Row>

                {/* Charts Row */}
                <Row className="g-3 mb-4">
                    <PermisssionGuard
                        permission={PERMISSIONS.REPORTS.VIEW_REVENUE}
                    >
                        <Col xl={5} lg={12}>
                            <RevenueChartCard
                                data={trendData}
                                isLoading={trendLoading}
                                period={trendPeriod}
                                onPeriodChange={setTrendPeriod}
                                currencySymbol={branchCurrencySymbol}
                                currencyCode={branchCurrencyCode}
                            />
                        </Col>
                    </PermisssionGuard>
                    <PermisssionGuard
                        permission={PERMISSIONS.DASHBOARD.VIEW_ANALYTICS}
                    >
                        <Col xl={4} lg={6}>
                            <FleetStatusChart
                                available={vehiclesAvailable}
                                inUse={vehiclesInUse}
                                other={vehiclesOther}
                            />
                        </Col>
                    </PermisssionGuard>
                    <PermisssionGuard
                        permission={PERMISSIONS.DASHBOARD.VIEW_ANALYTICS}
                    >
                        <Col xl={3} lg={6}>
                            <UtilizationChart rate={utilizationRate} />
                        </Col>
                    </PermisssionGuard>
                </Row>

                {/* Rental Distribution + Quick Stats */}
                <Row className="g-3 mb-4">
                    <PermisssionGuard permission={PERMISSIONS.RENTALS.VIEW_ALL}>
                        <Col xl={4} md={6}>
                            <RentalStatusChart
                                active={stats?.rentals.active ?? 0}
                                pending={stats?.rentals.pending ?? 0}
                                overdue={stats?.rentals.overdue ?? 0}
                            />
                        </Col>
                    </PermisssionGuard>
                    <PermisssionGuard permission={PERMISSIONS.RENTALS.VIEW_ALL}>
                        <Col xl={8} md={6}>
                            <Card className="h-100">
                                <Card.Header className="border-0 pb-0">
                                    <Card.Title className="mb-0 fs-6">
                                        Quick Stats
                                    </Card.Title>
                                </Card.Header>
                                <Card.Body>
                                    <Row className="g-3">
                                        <Col xs={6}>
                                            <div className="p-3 rounded border text-center">
                                                <div className="fw-bold fs-4 text-danger">
                                                    {stats?.rentals.overdue ??
                                                        0}
                                                </div>
                                                <small className="text-muted">
                                                    Overdue Rentals
                                                </small>
                                                <div className="mt-1">
                                                    <Link
                                                        to={
                                                            ROUTES.DASHBOARD
                                                                .RENTALS.OVERDUE
                                                        }
                                                        className="text-danger small"
                                                    >
                                                        View →
                                                    </Link>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col xs={6}>
                                            <div className="p-3 rounded border text-center">
                                                <div className="fw-bold fs-4 text-info">
                                                    {vehiclesInUse}
                                                </div>
                                                <small className="text-muted">
                                                    Vehicles In Use
                                                </small>
                                                <div className="mt-1">
                                                    <Link
                                                        to={
                                                            ROUTES.DASHBOARD
                                                                .VEHICLES.RENTED
                                                        }
                                                        className="text-info small"
                                                    >
                                                        View →
                                                    </Link>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col xs={6}>
                                            <div className="p-3 rounded border text-center">
                                                <div className="fw-bold fs-4 text-success">
                                                    {vehiclesAvailable}
                                                </div>
                                                <small className="text-muted">
                                                    Available Vehicles
                                                </small>
                                                <div className="mt-1">
                                                    <Link
                                                        to={
                                                            ROUTES.DASHBOARD
                                                                .VEHICLES
                                                                .AVAILABLE
                                                        }
                                                        className="text-success small"
                                                    >
                                                        View →
                                                    </Link>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col xs={6}>
                                            <div className="p-3 rounded border text-center">
                                                <div className="fw-bold fs-4 text-warning">
                                                    {stats?.quotes.pending ?? 0}
                                                </div>
                                                <small className="text-muted">
                                                    Pending Quotes
                                                </small>
                                                <div className="mt-1">
                                                    <Link
                                                        to={
                                                            ROUTES.DASHBOARD
                                                                .RENTALS.QUOTES
                                                        }
                                                        className="text-warning small"
                                                    >
                                                        View →
                                                    </Link>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </PermisssionGuard>
                </Row>

                {/* Tables */}
                <Row className="g-3">
                    <PermisssionGuard permission={PERMISSIONS.RENTALS.VIEW_ALL}>
                        <Col xl={7}>
                            {activityLoading ? (
                                <Card>
                                    <Card.Header className="d-flex justify-content-between align-items-center">
                                        <div className="placeholder-glow">
                                            <span
                                                className="placeholder col-5 rounded"
                                                style={{ height: '1rem' }}
                                            />
                                        </div>
                                    </Card.Header>
                                    <Card.Body className="p-0">
                                        <Table className="mb-0">
                                            <tbody>
                                                <SkeletonTableRows
                                                    rows={5}
                                                    cols={5}
                                                />
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            ) : (
                                <RecentRentalsTable rentals={recentRentals} />
                            )}
                        </Col>
                    </PermisssionGuard>
                    <PermisssionGuard permission={PERMISSIONS.RENTALS.VIEW_ALL}>
                        <Col xl={5}>
                            {returnsLoading ? (
                                <Card>
                                    <Card.Header className="d-flex justify-content-between align-items-center">
                                        <div className="placeholder-glow">
                                            <span
                                                className="placeholder col-5 rounded"
                                                style={{ height: '1rem' }}
                                            />
                                        </div>
                                    </Card.Header>
                                    <Card.Body className="p-0">
                                        <Table className="mb-0">
                                            <tbody>
                                                <SkeletonTableRows
                                                    rows={5}
                                                    cols={3}
                                                />
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            ) : (
                                <UpcomingReturnsTable
                                    returns={upcomingReturns}
                                />
                            )}
                        </Col>
                    </PermisssionGuard>
                </Row>
            </div>
        </>
    );
}
