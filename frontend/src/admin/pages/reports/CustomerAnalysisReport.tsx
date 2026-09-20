import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectActiveBranchId } from '@/store/slices/activeBranchSlice';
import {
    Card,
    Form,
    Table,
    Badge,
    ProgressBar,
    Row,
    Col,
} from 'react-bootstrap';
import ReactApexChart from 'react-apexcharts';
import { useCustomerAnalysisReport } from '@/shared/hooks/queries/useReports';
import { useQueueAndDownloadExport } from '@/shared/hooks/queries/useExports';
import type {
    ReportFilters,
    TopCustomerRow,
    CustomerAnalysisSummary,
} from '@/shared/types';
import ReportPageLayout, { StatCard } from './ReportPageLayout';
import { useTitle } from '@/shared/hooks';
import { useFormatCurrency } from '@/shared/hooks/queries/useSettings';

export default function CustomerAnalysisReport() {
    const title = useTitle('Customer Analysis');
    const formatCurrency = useFormatCurrency();
    const activeBranchId = useSelector(selectActiveBranchId);
    const [filters, setFilters] = useState<ReportFilters>({ limit: 10 });

    const {
        data: response,
        isLoading,
        isError,
    } = useCustomerAnalysisReport({
        ...filters,
        ...(activeBranchId ? { branch_id: activeBranchId } : {}),
    });
    const rows: TopCustomerRow[] = useMemo(
        () => response?.data?.top_customers ?? [],
        [response?.data?.top_customers]
    );
    const summary: CustomerAnalysisSummary | undefined =
        response?.data?.summary;
    const queueExport = useQueueAndDownloadExport();

    const maxRevenue = useMemo(
        () => rows.reduce((m, r) => Math.max(m, r.total_spend), 1),
        [rows]
    );

    return (
        <>
            {title}
            <ReportPageLayout
                title="Customer Analysis"
                subtitle="Customer rental patterns, frequency, and value"
                filters={filters}
                onFiltersChange={setFilters}
                onExport={() =>
                    queueExport.mutate({
                        type: 'report-customer-analysis',
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
                    <div className="row g-3 mb-3">
                        <StatCard
                            label="Total Customers"
                            value={String(summary.total_customers ?? 0)}
                            color="secondary"
                            colClass="col-md-2 col-sm-4"
                        />
                        <StatCard
                            label="New This Period"
                            value={String(summary.new_customers ?? 0)}
                            color="success"
                            colClass="col-md-2 col-sm-4"
                        />
                        <StatCard
                            label="Blacklisted"
                            value={String(summary.blacklisted_count ?? 0)}
                            color="danger"
                            colClass="col-md-2 col-sm-4"
                        />
                        <StatCard
                            label="Expiring Licenses"
                            value={String(summary.expiring_licenses ?? 0)}
                            color="warning"
                            colClass="col-md-2 col-sm-4"
                        />
                        <StatCard
                            label="Expired Licenses"
                            value={String(summary.expired_licenses ?? 0)}
                            color="danger"
                            colClass="col-md-2 col-sm-4"
                        />
                        <StatCard
                            label="Repeat Customers"
                            value={String(
                                rows.filter(r => r.rentals_count > 1).length
                            )}
                            color="info"
                            colClass="col-md-2 col-sm-4"
                        />
                    </div>
                )}

                {rows.length > 0 && (
                    <Row className="g-3 mb-3">
                        <Col>
                            <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-white border-bottom">
                                    <Card.Title className="mb-0">
                                        Top Customer Spend
                                    </Card.Title>
                                </Card.Header>
                                <Card.Body className="p-3">
                                    <ReactApexChart
                                        type="bar"
                                        height={240}
                                        series={[
                                            {
                                                name: 'Total Spend',
                                                data: rows
                                                    .slice(0, 10)
                                                    .map(r =>
                                                        Number(
                                                            r.total_spend ?? 0
                                                        )
                                                    ),
                                            },
                                        ]}
                                        options={{
                                            chart: {
                                                type: 'bar',
                                                toolbar: { show: false },
                                                animations: { enabled: false },
                                            },
                                            colors: ['#0074FF'],
                                            plotOptions: {
                                                bar: {
                                                    horizontal: true,
                                                    borderRadius: 3,
                                                },
                                            },
                                            dataLabels: { enabled: false },
                                            xaxis: {
                                                categories: rows
                                                    .slice(0, 10)
                                                    .map(r => r.name ?? '-'),
                                                labels: {
                                                    style: { fontSize: '10px' },
                                                },
                                            },
                                            yaxis: {
                                                labels: {
                                                    style: { fontSize: '10px' },
                                                },
                                            },
                                            grid: { borderColor: '#f1f1f1' },
                                            tooltip: {
                                                y: {
                                                    formatter: (v: number) =>
                                                        formatCurrency(v),
                                                },
                                            },
                                        }}
                                    />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                )}

                <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center">
                        <Card.Title className="mb-0">Top Customers</Card.Title>
                        <Form.Select
                            size="sm"
                            className="tw:h-[2.9rem]"
                            style={{ width: 'auto' }}
                            value={Number(filters.limit ?? 10)}
                            onChange={e =>
                                setFilters(f => ({
                                    ...f,
                                    limit: Number(e.target.value),
                                }))
                            }
                        >
                            <option value={10}>Top 10</option>
                            <option value={25}>Top 25</option>
                            <option value={50}>Top 50</option>
                            <option value={0}>All</option>
                        </Form.Select>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <Table
                            hover
                            responsive
                            className="table-striped-thead table-wide table-sm table-border-last-0 mb-0"
                        >
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Customer</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Rentals</th>
                                    <th>Total Spent</th>
                                    <th style={{ minWidth: 120 }}>
                                        Revenue Share
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="text-center text-muted py-4"
                                        >
                                            No customer data for selected period
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((row, idx) => (
                                        <tr key={row.id}>
                                            <td className="text-muted small">
                                                {idx + 1}
                                            </td>
                                            <td className="fw-semibold">
                                                {row.name}
                                                {row.rentals_count > 1 && (
                                                    <Badge
                                                        bg="info"
                                                        className="ms-1"
                                                        style={{ fontSize: 9 }}
                                                    >
                                                        Repeat
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="text-muted">
                                                {row.email}
                                            </td>
                                            <td>{row.phone ?? '-'}</td>
                                            <td>{row.rentals_count}</td>
                                            <td className="fw-semibold text-primary">
                                                {formatCurrency(
                                                    row.total_spend
                                                )}
                                            </td>
                                            <td>
                                                <ProgressBar
                                                    now={Math.round(
                                                        (row.total_spend /
                                                            maxRevenue) *
                                                            100
                                                    )}
                                                    variant="primary"
                                                    style={{ height: 6 }}
                                                    title={`${Math.round((row.total_spend / maxRevenue) * 100)}%`}
                                                />
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
