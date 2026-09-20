import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectActiveBranchId } from '@/store/slices/activeBranchSlice';
import {
    Card,
    Table,
    Row,
    Col,
    ButtonGroup,
    Button,
    OverlayTrigger,
    Tooltip,
} from 'react-bootstrap';
import { ChartSkeleton } from '@adminComponents/skeletons/ChartSkeleton';
import ReactApexChart from 'react-apexcharts';
import { useRevenueReport } from '@/shared/hooks/queries/useReports';
import { useQueueAndDownloadExport } from '@/shared/hooks/queries/useExports';
import type { ReportFilters, DailyRevenueRow } from '@/shared/types';
import ReportPageLayout, { StatCard } from './ReportPageLayout';
import { formatDate } from '@/shared/libs/utils';
import { useTitle } from '@/shared/hooks';
import { useFormatCurrency } from '@/shared/hooks/queries/useSettings';

type ChartPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

const CHART_PERIODS: { value: ChartPeriod; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
];

export default function RevenueReport() {
    const title = useTitle('Revenue Report');
    const formatCurrency = useFormatCurrency();
    const activeBranchId = useSelector(selectActiveBranchId);
    const [filters, setFilters] = useState<ReportFilters>({});
    const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('daily');

    const {
        data: response,
        isLoading,
        isError,
    } = useRevenueReport({
        ...filters,
        ...(activeBranchId ? { branch_id: activeBranchId } : {}),
        chart_period: chartPeriod,
    });
    const summary = response?.data?.summary;
    const periodNote: string = response?.data?.period_note ?? '';
    const rows: DailyRevenueRow[] = response?.data?.chart ?? [];
    const queueExport = useQueueAndDownloadExport();

    /* Cumulative running total for the detail table */
    let runningTotal = 0;
    const rowsWithRunning = rows.map(row => {
        runningTotal += row.revenue ?? 0;
        return { ...row, running_total: runningTotal };
    });

    const xAxisLabel = (row: DailyRevenueRow) =>
        (row as DailyRevenueRow & { period_label?: string }).period_label ??
        row.date ??
        '';

    const tableLabel = (row: DailyRevenueRow) => {
        const label = (row as DailyRevenueRow & { period_label?: string })
            .period_label;
        if (label) return label;
        return row.date ? formatDate(row.date) : '-';
    };

    return (
        <>
            {title}
            <ReportPageLayout
                title="Revenue Report"
                subtitle="Collected cash vs billed amounts - based on payment transactions"
                filters={filters}
                onFiltersChange={newFilters => {
                    setFilters(newFilters);
                }}
                onExport={() =>
                    queueExport.mutate({
                        type: 'report-revenue',
                        format: 'pdf',
                        filters,
                    })
                }
                isExporting={queueExport.isPending}
                isWaiting={queueExport.isWaiting}
                isLoading={isLoading}
                isError={isError}
            >
                {summary && (
                    <>
                        {/* Period note tooltip shown next to stat cards */}
                        {periodNote && (
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <OverlayTrigger
                                    placement="right"
                                    overlay={
                                        <Tooltip id="period-note-tooltip">
                                            {periodNote}
                                        </Tooltip>
                                    }
                                >
                                    <span
                                        className="badge bg-light text-muted border small fw-normal"
                                        style={{ cursor: 'help' }}
                                    >
                                        <i className="bi bi-info-circle me-1" />
                                        How values are calculated
                                    </span>
                                </OverlayTrigger>
                            </div>
                        )}

                        {/* Row 1: Revenue metrics */}
                        <div className="row g-3 mb-3">
                            <StatCard
                                label="Gross Billed Revenue"
                                value={formatCurrency(
                                    summary.gross_revenue ?? 0
                                )}
                                color="secondary"
                                colClass="col-md-3 col-sm-6"
                            />
                            <StatCard
                                label="Collected Revenue"
                                value={formatCurrency(
                                    summary.collected_revenue ?? 0
                                )}
                                color="primary"
                                colClass="col-md-3 col-sm-6"
                            />
                            <StatCard
                                label="Refunded"
                                value={formatCurrency(
                                    summary.refunded_amount ?? 0
                                )}
                                color="info"
                                colClass="col-md-3 col-sm-6"
                            />
                            <StatCard
                                label="Net Revenue"
                                value={formatCurrency(summary.net_revenue ?? 0)}
                                color="success"
                                colClass="col-md-3 col-sm-6"
                            />
                        </div>

                        {/* Row 2: Performance metrics */}
                        <div className="row g-3 mb-3">
                            <StatCard
                                label="Outstanding Balance"
                                value={formatCurrency(
                                    summary.outstanding_balance ?? 0
                                )}
                                color="warning"
                                colClass="col-md-3 col-sm-6"
                            />
                            <StatCard
                                label="Collection Rate"
                                value={`${summary.collection_rate ?? 0}%`}
                                color={
                                    (summary.collection_rate ?? 0) >= 90
                                        ? 'success'
                                        : (summary.collection_rate ?? 0) >= 70
                                          ? 'warning'
                                          : 'danger'
                                }
                                colClass="col-md-3 col-sm-6"
                            />
                            <StatCard
                                label="Total Rentals"
                                value={summary.total_rentals ?? 0}
                                color="secondary"
                                colClass="col-md-3 col-sm-6"
                            />
                            <StatCard
                                label="Avg. Revenue / Rental"
                                value={formatCurrency(
                                    summary.average_per_rental ?? 0
                                )}
                                color="primary"
                                colClass="col-md-3 col-sm-6"
                            />
                        </div>
                    </>
                )}

                <Row className="g-3 mb-3">
                    <Col>
                        <Card className="border-0 shadow-sm">
                            <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <div>
                                    <Card.Title className="mb-0 fs-6">
                                        Revenue Trend
                                    </Card.Title>
                                    {!isLoading && rows.length > 0 && (
                                        <small className="text-muted">
                                            {formatCurrency(
                                                rows.reduce(
                                                    (s, r) =>
                                                        s + (r.revenue ?? 0),
                                                    0
                                                )
                                            )}{' '}
                                            &middot;{' '}
                                            {rows.reduce(
                                                (s, r) =>
                                                    s +
                                                    ((
                                                        r as DailyRevenueRow & {
                                                            transaction_count?: number;
                                                        }
                                                    ).transaction_count ?? 0),
                                                0
                                            )}{' '}
                                            transactions
                                        </small>
                                    )}
                                </div>
                                <ButtonGroup size="sm">
                                    {CHART_PERIODS.map(p => (
                                        <Button
                                            key={p.value}
                                            variant={
                                                chartPeriod === p.value
                                                    ? 'primary'
                                                    : 'outline-secondary'
                                            }
                                            onClick={() =>
                                                setChartPeriod(p.value)
                                            }
                                            style={{ fontSize: '0.75rem' }}
                                        >
                                            {p.label}
                                        </Button>
                                    ))}
                                </ButtonGroup>
                            </Card.Header>
                            <Card.Body className="pt-2 pb-0">
                                {isLoading ? (
                                    <ChartSkeleton />
                                ) : rows.length === 0 ? (
                                    <div className="text-center text-muted py-5 small">
                                        No revenue data for selected period
                                    </div>
                                ) : (
                                    <ReactApexChart
                                        type="area"
                                        height={300}
                                        series={[
                                            {
                                                name: 'Collected Revenue',
                                                data: rows.map(r =>
                                                    Number(r.revenue ?? 0)
                                                ),
                                            },
                                        ]}
                                        options={{
                                            chart: {
                                                type: 'area',
                                                toolbar: { show: false },
                                                zoom: { enabled: false },
                                                foreColor: '#6b7280',
                                            },
                                            colors: ['#22c55e'],
                                            stroke: {
                                                curve: 'smooth',
                                                width: 2,
                                                colors: ['#22c55e'],
                                            },
                                            fill: {
                                                type: 'gradient',
                                                gradient: {
                                                    shadeIntensity: 1,
                                                    opacityFrom: 0.35,
                                                    opacityTo: 0.03,
                                                    stops: [0, 90, 100],
                                                },
                                            },
                                            dataLabels: { enabled: false },
                                            markers: { size: 0 },
                                            xaxis: {
                                                categories: rows.map(r =>
                                                    xAxisLabel(r)
                                                ),
                                                axisBorder: { show: false },
                                                axisTicks: { show: false },
                                                tickAmount: Math.min(
                                                    rows.length,
                                                    12
                                                ),
                                                labels: {
                                                    rotate:
                                                        rows.length > 10
                                                            ? -30
                                                            : 0,
                                                    rotateAlways: false,
                                                    style: {
                                                        colors: '#6b7280',
                                                        fontSize: '11px',
                                                    },
                                                },
                                            },
                                            yaxis: {
                                                min: 0,
                                                labels: {
                                                    formatter: (v: number) => {
                                                        if (v >= 1_000_000) {
                                                            return `${(v / 1_000_000).toFixed(1)}M`;
                                                        }
                                                        if (v >= 1_000) {
                                                            return `${(v / 1_000).toFixed(0)}K`;
                                                        }
                                                        return v.toFixed(0);
                                                    },
                                                    style: {
                                                        colors: '#6b7280',
                                                        fontSize: '11px',
                                                    },
                                                },
                                            },
                                            grid: {
                                                borderColor: '#f1f5f9',
                                                strokeDashArray: 4,
                                                yaxis: {
                                                    lines: { show: true },
                                                },
                                            },
                                            tooltip: {
                                                theme: 'light',
                                                fillSeriesColor: false,
                                                style: {
                                                    fontSize: '12px',
                                                    fontFamily: 'inherit',
                                                },
                                                y: {
                                                    formatter: (v: number) =>
                                                        formatCurrency(v),
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
                                            },
                                        }}
                                    />
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white border-bottom">
                        <Card.Title className="mb-0">
                            Revenue Details
                        </Card.Title>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <Table
                            hover
                            responsive
                            className="table-striped-thead table-wide table-sm table-border-last-0 mb-0"
                        >
                            <thead>
                                <tr>
                                    <th>Period</th>
                                    <th>Transactions</th>
                                    <th>Revenue</th>
                                    <th className="text-end">Cumulative</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rowsWithRunning.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="text-center text-muted py-4"
                                        >
                                            No revenue data for selected period
                                        </td>
                                    </tr>
                                ) : (
                                    rowsWithRunning.map((row, idx) => (
                                        <tr key={idx}>
                                            <td className="fw-semibold">
                                                {tableLabel(row)}
                                            </td>
                                            <td>
                                                {(
                                                    row as DailyRevenueRow & {
                                                        transaction_count?: number;
                                                    }
                                                ).transaction_count ?? 0}
                                            </td>
                                            <td className="text-primary fw-semibold">
                                                {formatCurrency(
                                                    row.revenue ?? 0
                                                )}
                                            </td>
                                            <td className="text-end text-muted">
                                                {formatCurrency(
                                                    row.running_total
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            </ReportPageLayout>
        </>
    );
}
