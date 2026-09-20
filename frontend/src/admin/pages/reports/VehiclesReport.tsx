import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectActiveBranchId } from '@/store/slices/activeBranchSlice';
import { Card, Table, Badge, Row, Col } from 'react-bootstrap';
import ReactApexChart from 'react-apexcharts';
import { useVehiclesReport } from '@/shared/hooks/queries/useReports';
import { useQueueAndDownloadExport } from '@/shared/hooks/queries/useExports';
import type { ReportFilters, VehicleReportRow } from '@/shared/types';
import ReportPageLayout, { StatCard } from './ReportPageLayout';
import { useTitle } from '@/shared/hooks';

export default function VehiclesReport() {
    const title = useTitle('Vehicles Report');
    const activeBranchId = useSelector(selectActiveBranchId);
    const [filters, setFilters] = useState<ReportFilters>({});

    const {
        data: response,
        isLoading,
        isError,
    } = useVehiclesReport({
        ...filters,
        ...(activeBranchId ? { branch_id: activeBranchId } : {}),
    });
    const rows: VehicleReportRow[] = response?.data?.vehicles ?? [];
    const summary = response?.data?.summary;
    const queueExport = useQueueAndDownloadExport();

    return (
        <>
            {title}
            <ReportPageLayout
                title="Vehicles Report"
                subtitle="Fleet utilization, rental counts, and vehicle performance"
                filters={filters}
                onFiltersChange={setFilters}
                onExport={() =>
                    queueExport.mutate({
                        type: 'report-vehicles',
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
                            label="Total Vehicles"
                            value={String(summary.total_vehicles ?? 0)}
                            color="secondary"
                        />
                        <StatCard
                            label="Available"
                            value={String(summary.available_count ?? 0)}
                            color="success"
                        />
                        <StatCard
                            label="In Use"
                            value={String(summary.rented_count ?? 0)}
                            color="primary"
                        />
                        <StatCard
                            label="Avg Utilization"
                            value={`${String(summary.average_utilization ?? 0)}%`}
                            color="info"
                        />
                    </div>
                )}

                {summary && (
                    <Row className="g-3 mb-3">
                        <Col md={6}>
                            <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-white border-bottom">
                                    <Card.Title className="mb-0">
                                        Fleet Status Distribution
                                    </Card.Title>
                                </Card.Header>
                                <Card.Body className="p-2">
                                    <ReactApexChart
                                        type="donut"
                                        height={240}
                                        series={[
                                            summary.available_count ?? 0,
                                            summary.rented_count ?? 0,
                                            summary.maintenance_count ?? 0,
                                        ]}
                                        options={{
                                            chart: {
                                                type: 'donut',
                                                animations: { enabled: false },
                                            },
                                            labels: [
                                                'Available',
                                                'In Use',
                                                'Maintenance',
                                            ],
                                            colors: [
                                                '#198754',
                                                '#0074FF',
                                                '#ffc107',
                                            ],
                                            legend: { position: 'bottom' },
                                            dataLabels: { enabled: true },
                                            plotOptions: {
                                                pie: { donut: { size: '60%' } },
                                            },
                                            tooltip: {
                                                y: {
                                                    formatter: (v: number) =>
                                                        v + ' vehicles',
                                                },
                                            },
                                        }}
                                    />
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-white border-bottom">
                                    <Card.Title className="mb-0">
                                        Top Vehicles by Rentals
                                    </Card.Title>
                                </Card.Header>
                                <Card.Body className="p-2">
                                    <ReactApexChart
                                        type="bar"
                                        height={240}
                                        series={[
                                            {
                                                name: 'Rentals',
                                                data: rows
                                                    .slice(0, 8)
                                                    .map(
                                                        r =>
                                                            r.total_rentals ?? 0
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
                                                    .slice(0, 8)
                                                    .map(r => r.name ?? '-'),
                                                labels: {
                                                    style: { fontSize: '10px' },
                                                },
                                            },
                                            grid: { borderColor: '#f1f1f1' },
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
                            Vehicle Performance
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
                                    <th>Vehicle</th>
                                    <th>License Plate</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th>Total Rentals</th>
                                    <th>Utilization %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="text-center text-muted py-4"
                                        >
                                            No vehicle data for selected period
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map(row => (
                                        <tr key={row.id}>
                                            <td className="fw-semibold">
                                                {row.name ?? '-'}
                                            </td>
                                            <td>{row.license_plate ?? '-'}</td>
                                            <td>{row.category ?? '-'}</td>
                                            <td>
                                                <Badge
                                                    bg={
                                                        row.status ===
                                                        'available'
                                                            ? 'success'
                                                            : row.status ===
                                                                'rented'
                                                              ? 'primary'
                                                              : 'warning'
                                                    }
                                                    className="text-capitalize"
                                                >
                                                    {row.status ?? '-'}
                                                </Badge>
                                            </td>
                                            <td>{row.total_rentals ?? 0}</td>
                                            <td>
                                                {row.utilization_rate ?? 0}%
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
