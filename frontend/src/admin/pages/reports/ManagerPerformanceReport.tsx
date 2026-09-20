import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectActiveBranchId } from '@/store/slices/activeBranchSlice';
import { Card, Table, Badge } from 'react-bootstrap';
import { useManagerPerformanceReport } from '@/shared/hooks/queries/useReports';
import { useQueueAndDownloadExport } from '@/shared/hooks/queries/useExports';
import type { ReportFilters, ManagerPerformanceRow } from '@/shared/types';
import ReportPageLayout, { StatCard } from './ReportPageLayout';
import { useTitle } from '@/shared/hooks';
import { useFormatCurrency } from '@/shared/hooks/queries/useSettings';

export default function ManagerPerformanceReport() {
    const title = useTitle('Manager Performance');
    const formatCurrency = useFormatCurrency();
    const activeBranchId = useSelector(selectActiveBranchId);
    const [filters, setFilters] = useState<ReportFilters>({});

    const {
        data: response,
        isLoading,
        isError,
    } = useManagerPerformanceReport({
        ...filters,
        ...(activeBranchId ? { branch_id: activeBranchId } : {}),
    });
    const rows: ManagerPerformanceRow[] = response?.data?.managers ?? [];
    const queueExport = useQueueAndDownloadExport();

    const summary = useMemo(() => {
        if (!rows.length) return null;
        const totalRevenue = rows.reduce(
            (s, r) => s + (r.total_revenue ?? 0),
            0
        );
        const totalRentals = rows.reduce(
            (s, r) => s + (r.total_rentals ?? 0),
            0
        );
        const avgCompletion = rows.length
            ? rows.reduce((s, r) => s + (r.completion_rate ?? 0), 0) /
              rows.length
            : 0;
        return {
            totalRevenue,
            totalRentals,
            avgCompletion: Math.round(avgCompletion * 10) / 10,
        };
    }, [rows]);

    return (
        <>
            {title}
            <ReportPageLayout
                title="Manager Performance"
                subtitle="Rental activity and revenue per manager"
                filters={filters}
                onFiltersChange={setFilters}
                onExport={() =>
                    queueExport.mutate({
                        type: 'report-manager-performance',
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
                            label="Active Managers"
                            value={String(rows.length)}
                            color="secondary"
                        />
                        <StatCard
                            label="Total Revenue"
                            value={formatCurrency(summary.totalRevenue)}
                            color="primary"
                        />
                        <StatCard
                            label="Total Rentals"
                            value={String(summary.totalRentals)}
                            color="info"
                        />
                        <StatCard
                            label="Avg Completion Rate"
                            value={`${summary.avgCompletion}%`}
                            color="success"
                        />
                    </div>
                )}
                <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white border-bottom">
                        <Card.Title className="mb-0">
                            Manager Overview
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
                                    <th>Manager</th>
                                    <th>Email</th>
                                    <th>Total</th>
                                    <th>Completed</th>
                                    <th>Cancelled</th>
                                    <th>Revenue</th>
                                    <th>Completion %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="text-center text-muted py-4"
                                        >
                                            No manager data for selected period
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map(row => (
                                        <tr
                                            key={
                                                row.manager?.id ??
                                                row.manager?.email
                                            }
                                        >
                                            <td className="fw-semibold">
                                                {row.manager?.name ?? '-'}
                                            </td>
                                            <td className="text-muted">
                                                {row.manager?.email ?? '-'}
                                            </td>
                                            <td>{row.total_rentals ?? 0}</td>
                                            <td>
                                                <Badge bg="success">
                                                    {row.completed_rentals ?? 0}
                                                </Badge>
                                            </td>
                                            <td>
                                                {(row.cancelled_rentals ?? 0) >
                                                0 ? (
                                                    <Badge bg="warning">
                                                        {row.cancelled_rentals}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted">
                                                        0
                                                    </span>
                                                )}
                                            </td>
                                            <td className="fw-semibold text-primary">
                                                {formatCurrency(
                                                    row.total_revenue ?? 0
                                                )}
                                            </td>
                                            <td>
                                                <span
                                                    className={
                                                        (row.completion_rate ??
                                                            0) >= 80
                                                            ? 'text-success fw-semibold'
                                                            : (row.completion_rate ??
                                                                    0) >= 50
                                                              ? 'text-warning fw-semibold'
                                                              : 'text-danger fw-semibold'
                                                    }
                                                >
                                                    {row.completion_rate ?? 0}%
                                                </span>
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
