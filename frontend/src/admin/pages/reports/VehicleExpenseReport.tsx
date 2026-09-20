import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectActiveBranchId } from '@/store/slices/activeBranchSlice';
import { Card, Table, Badge, Row, Col, Pagination } from 'react-bootstrap';
import ReactApexChart from 'react-apexcharts';
import { useVehicleExpenseReport } from '@/shared/hooks/queries/useReports';
import type { ReportFilters, VehicleExpenseRow } from '@/shared/types';
import ReportPageLayout, { StatCard } from './ReportPageLayout';
import { formatDate } from '@/shared/libs/utils';
import { formatWithSymbol } from '@/shared/libs/currency';
import { useTitle } from '@/shared/hooks';
import {
    useFormatCurrency,
    useGeneralSettings,
} from '@/shared/hooks/queries/useSettings';

const EXPENSE_TYPE_COLORS: Record<string, string> = {
    fuel: 'primary',
    maintenance: 'warning',
    insurance: 'success',
    repair: 'danger',
    cleaning: 'info',
    other: 'secondary',
};

const TYPE_CHART_COLORS = [
    '#0074FF',
    '#ffc107',
    '#198754',
    '#dc3545',
    '#0dcaf0',
    '#6c757d',
];

export default function VehicleExpenseReport() {
    const title = useTitle('Vehicle Expenses');
    const formatCurrency = useFormatCurrency();
    const { data: generalSettings } = useGeneralSettings();
    const globalSymbol = generalSettings?.data?.currency_symbol ?? '₵';
    const activeBranchId = useSelector(selectActiveBranchId);
    const [filters, setFilters] = useState<ReportFilters>({});
    const [page, setPage] = useState(1);

    const handleFiltersChange = (newFilters: ReportFilters) => {
        setFilters(newFilters);
        setPage(1);
    };

    const {
        data: response,
        isLoading,
        isError,
    } = useVehicleExpenseReport({
        ...filters,
        ...(activeBranchId ? { branch_id: activeBranchId } : {}),
        page,
        per_page: 15,
    });
    const summary = response?.data?.summary;
    const expenses: VehicleExpenseRow[] = response?.data?.expenses ?? [];
    const byVehicle = response?.data?.by_vehicle ?? [];
    const byType = summary?.by_type ?? ({} as Record<string, number>);
    const pagination = response?.data?.expenses_pagination;

    const typeLabels = Object.keys(byType);
    const typeValues = Object.values(byType) as number[];

    return (
        <>
            {title}
            <ReportPageLayout
                title="Vehicle Expense Report"
                subtitle="Track fuel, maintenance, insurance and other vehicle costs"
                filters={filters}
                onFiltersChange={handleFiltersChange}
                isLoading={isLoading}
                isError={isError}
            >
                {summary && (
                    <div className="row g-3 mb-3">
                        <StatCard
                            label="Total Expenses"
                            value={formatCurrency(summary.total_expenses ?? 0)}
                            color="danger"
                        />
                        <StatCard
                            label="Total Records"
                            value={String(summary.total_records ?? 0)}
                            color="secondary"
                        />
                        <StatCard
                            label="Vehicles With Expenses"
                            value={String(byVehicle.length)}
                            color="primary"
                        />
                        <StatCard
                            label="Maintenance Total"
                            value={formatCurrency(byType['maintenance'] ?? 0)}
                            color="warning"
                        />
                    </div>
                )}

                {typeLabels.length > 0 && (
                    <Row className="g-3 mb-3">
                        <Col md={5}>
                            <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-white border-bottom">
                                    <Card.Title className="mb-0">
                                        Expenses by Type
                                    </Card.Title>
                                </Card.Header>
                                <Card.Body className="p-3">
                                    <ReactApexChart
                                        type="donut"
                                        height={240}
                                        series={typeValues}
                                        options={{
                                            chart: {
                                                type: 'donut',
                                                animations: { enabled: false },
                                            },
                                            labels: typeLabels.map(
                                                l =>
                                                    l.charAt(0).toUpperCase() +
                                                    l.slice(1)
                                            ),
                                            colors: TYPE_CHART_COLORS,
                                            legend: { position: 'bottom' },
                                            dataLabels: { enabled: true },
                                            plotOptions: {
                                                pie: { donut: { size: '60%' } },
                                            },
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
                        <Col md={7}>
                            <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-white border-bottom">
                                    <Card.Title className="mb-0">
                                        Expenses by Vehicle
                                    </Card.Title>
                                </Card.Header>
                                <Card.Body className="p-3">
                                    <ReactApexChart
                                        type="bar"
                                        height={240}
                                        series={[
                                            {
                                                name: 'Total',
                                                data: byVehicle
                                                    .slice(0, 8)
                                                    .map(v => v.total),
                                            },
                                        ]}
                                        options={{
                                            chart: {
                                                type: 'bar',
                                                toolbar: { show: false },
                                                animations: { enabled: false },
                                            },
                                            colors: ['#dc3545'],
                                            plotOptions: {
                                                bar: {
                                                    horizontal: true,
                                                    borderRadius: 3,
                                                },
                                            },
                                            dataLabels: { enabled: false },
                                            xaxis: {
                                                categories: byVehicle
                                                    .slice(0, 8)
                                                    .map(v => v.vehicle ?? '-'),
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
                    <Card.Header className="bg-white border-bottom">
                        <Card.Title className="mb-0">
                            Expense Records
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
                                    <th>Date</th>
                                    <th>Vehicle</th>
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>Recorded By</th>
                                    <th className="text-end">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="text-center text-muted py-4"
                                        >
                                            No expense records for selected
                                            period
                                        </td>
                                    </tr>
                                ) : (
                                    expenses.map(row => (
                                        <tr key={row.id}>
                                            <td className="fw-semibold">
                                                {formatDate(row.expense_date)}
                                            </td>
                                            <td>
                                                {row.vehicle ?? '-'}
                                                {row.license_plate && (
                                                    <span className="text-muted ms-1 small">
                                                        ({row.license_plate})
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <Badge
                                                    bg={
                                                        EXPENSE_TYPE_COLORS[
                                                            row.expense_type
                                                        ] ?? 'secondary'
                                                    }
                                                    className="text-capitalize"
                                                >
                                                    {row.expense_type}
                                                </Badge>
                                            </td>
                                            <td>{row.description}</td>
                                            <td className="text-muted">
                                                {row.recorded_by ?? '-'}
                                            </td>
                                            <td className="text-end fw-semibold text-danger">
                                                {formatWithSymbol(
                                                    row.amount,
                                                    row.currency_symbol ??
                                                        globalSymbol
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                        {pagination && pagination.last_page > 1 && (
                            <div className="d-flex justify-content-center pt-3 pb-2">
                                <Pagination size="sm" className="mb-0">
                                    <Pagination.Prev
                                        disabled={page <= 1}
                                        onClick={() =>
                                            setPage(p => Math.max(1, p - 1))
                                        }
                                    />
                                    {Array.from(
                                        { length: pagination.last_page },
                                        (_, i) => i + 1
                                    ).map(p => (
                                        <Pagination.Item
                                            key={p}
                                            active={p === page}
                                            onClick={() => setPage(p)}
                                        >
                                            {p}
                                        </Pagination.Item>
                                    ))}
                                    <Pagination.Next
                                        disabled={page >= pagination.last_page}
                                        onClick={() =>
                                            setPage(p =>
                                                Math.min(
                                                    pagination.last_page,
                                                    p + 1
                                                )
                                            )
                                        }
                                    />
                                </Pagination>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </ReportPageLayout>
        </>
    );
}
