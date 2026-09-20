import { Badge, Card, Table } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { selectActiveBranchId } from '@/store/slices/activeBranchSlice';
import { Link } from 'react-router-dom';
import { useMaintenanceReport } from '@/shared/hooks/queries/useReports';
import { useQueueAndDownloadExport } from '@/shared/hooks/queries/useExports';
import type { DamageReportRow, MaintenanceVehicleRow } from '@/shared/types';
import ReportPageLayout, { StatCard } from './ReportPageLayout';
import { formatDate, formatCurrency } from '@/shared/libs/utils';
import { useTitle } from '@/shared/hooks';

function fmtCurrency(val: number | null | undefined): string {
    if (val == null) return '-';
    return formatCurrency(val);
}

function severityVariant(severity: string | null): string {
    const map: Record<string, string> = {
        minor: 'warning',
        moderate: 'orange',
        severe: 'danger',
    };
    return map[severity ?? ''] ?? 'secondary';
}

function settlementVariant(status: string | null): string {
    if (status === 'settled') return 'success';
    if (status === 'pending') return 'warning';
    return 'secondary';
}

export default function MaintenanceReport() {
    const title = useTitle('Maintenance Report');
    const activeBranchId = useSelector(selectActiveBranchId);
    const {
        data: response,
        isLoading,
        isError,
    } = useMaintenanceReport(
        activeBranchId ? { branch_id: activeBranchId } : {}
    );
    const rows: MaintenanceVehicleRow[] =
        response?.data?.maintenance_vehicles ?? [];
    const damageRows: DamageReportRow[] = response?.data?.damage_reports ?? [];
    const summary = response?.data?.summary;
    const queueExport = useQueueAndDownloadExport();

    return (
        <>
            {title}
            <ReportPageLayout
                title="Maintenance & Repairs"
                subtitle="Vehicle maintenance history and damage settlement records"
                onExport={() =>
                    queueExport.mutate({
                        type: 'report-maintenance',
                        format: 'pdf',
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
                            label="Vehicles in Maintenance"
                            value={summary.maintenance_count ?? 0}
                            color="warning"
                        />
                        <StatCard
                            label="Damage Reports"
                            value={summary.damage_reports_count ?? 0}
                            color="danger"
                        />
                        <StatCard
                            label="Total Estimated Damage"
                            value={fmtCurrency(summary.total_estimated_damage)}
                            color="warning"
                        />
                        <StatCard
                            label="Total Confirmed Damage"
                            value={fmtCurrency(summary.total_actual_damage)}
                            color="danger"
                        />
                    </div>
                )}

                {/* Vehicles in Maintenance */}
                <Card className="border-0 shadow-sm mb-3">
                    <Card.Header className="bg-white border-bottom">
                        <Card.Title className="mb-0">
                            Vehicles in Maintenance
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
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="text-center text-muted py-4"
                                        >
                                            No vehicles currently in maintenance
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map(row => (
                                        <tr key={row.id}>
                                            <td className="fw-semibold">
                                                {row.name}
                                            </td>
                                            <td>
                                                <code>{row.license_plate}</code>
                                            </td>
                                            <td className="text-capitalize text-muted">
                                                {row.category ?? '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>

                {/* Damage Reports */}
                <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white border-bottom">
                        <Card.Title className="mb-0">Damage Reports</Card.Title>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <Table
                            hover
                            responsive
                            className="table-striped-thead table-wide table-sm table-border-last-0 mb-0"
                        >
                            <thead>
                                <tr>
                                    <th>Rental Ref</th>
                                    <th>Vehicle</th>
                                    <th>Damage</th>
                                    <th className="text-end">Estimated</th>
                                    <th className="text-end">Confirmed</th>
                                    <th>Settlement</th>
                                    <th>Return Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {damageRows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="text-center text-muted py-4"
                                        >
                                            No damage reports found
                                        </td>
                                    </tr>
                                ) : (
                                    damageRows.map(row => (
                                        <tr key={row.id}>
                                            <td>
                                                {row.rental_reference ? (
                                                    <Link
                                                        to={`/management/rentals/${row.id}`}
                                                        className="fw-semibold"
                                                    >
                                                        {row.rental_reference}
                                                    </Link>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td>
                                                <div className="fw-semibold">
                                                    {row.vehicle_name ?? '-'}
                                                </div>
                                                {row.license_plate && (
                                                    <small className="text-muted">
                                                        <code>
                                                            {row.license_plate}
                                                        </code>
                                                    </small>
                                                )}
                                            </td>
                                            <td>
                                                <div className="d-flex flex-wrap gap-1">
                                                    {row.damage_types.map(t => (
                                                        <Badge
                                                            key={t}
                                                            bg="danger"
                                                            className="text-capitalize fw-normal"
                                                            style={{
                                                                fontSize:
                                                                    '0.7rem',
                                                            }}
                                                        >
                                                            {t}
                                                        </Badge>
                                                    ))}
                                                </div>
                                                {row.damage_severity && (
                                                    <Badge
                                                        bg={severityVariant(
                                                            row.damage_severity
                                                        )}
                                                        className="mt-1 text-capitalize fw-normal"
                                                        style={{
                                                            fontSize: '0.7rem',
                                                        }}
                                                    >
                                                        {row.damage_severity}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="text-end">
                                                {row.estimated_cost != null ? (
                                                    fmtCurrency(
                                                        row.estimated_cost
                                                    )
                                                ) : (
                                                    <span className="text-muted">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-end">
                                                {row.actual_cost != null ? (
                                                    <span className="fw-semibold text-danger">
                                                        {fmtCurrency(
                                                            row.actual_cost
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {row.settlement_status ? (
                                                    <Badge
                                                        bg={settlementVariant(
                                                            row.settlement_status
                                                        )}
                                                        className="text-capitalize fw-normal"
                                                    >
                                                        {row.settlement_status}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-muted">
                                                {formatDate(row.return_date)}
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
