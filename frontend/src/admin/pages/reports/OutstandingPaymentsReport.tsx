import { Card, Table, Badge } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { selectActiveBranchId } from '@/store/slices/activeBranchSlice';
import type { OutstandingRentalRow } from '@/shared/types';
import { useOutstandingPaymentsReport } from '@/shared/hooks/queries/useReports';
import { useQueueAndDownloadExport } from '@/shared/hooks/queries/useExports';
import ReportPageLayout, { StatCard } from './ReportPageLayout';
import { formatDate } from '@/shared/libs/utils';
import { formatWithSymbol } from '@/shared/libs/currency';
import { useTitle } from '@/shared/hooks';
import {
    useFormatCurrency,
    useGeneralSettings,
} from '@/shared/hooks/queries/useSettings';

export default function OutstandingPaymentsReport() {
    const title = useTitle('Outstanding Payments');
    const formatCurrency = useFormatCurrency();
    const { data: generalSettings } = useGeneralSettings();
    const globalSymbol = generalSettings?.data?.currency_symbol ?? '₵';
    const activeBranchId = useSelector(selectActiveBranchId);
    const {
        data: response,
        isLoading,
        isError,
    } = useOutstandingPaymentsReport(
        activeBranchId ? { branch_id: activeBranchId } : {}
    );
    const rows: OutstandingRentalRow[] = response?.data?.rentals ?? [];
    const summary = response?.data?.summary;
    const queueExport = useQueueAndDownloadExport();

    return (
        <>
            {title}
            <ReportPageLayout
                title="Outstanding Payments"
                subtitle="Rentals with pending or partial payments"
                onExport={() =>
                    queueExport.mutate({
                        type: 'report-outstanding-payments',
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
                            label="Total Outstanding"
                            value={formatCurrency(
                                Number(summary.total_outstanding ?? 0)
                            )}
                            color="danger"
                        />
                        <StatCard
                            label="Total Rentals"
                            value={String(summary.total_rentals ?? 0)}
                            color="secondary"
                        />
                        <StatCard
                            label="Pending"
                            value={String(summary.pending_count ?? 0)}
                            color="warning"
                        />
                        <StatCard
                            label="Partial"
                            value={String(summary.partial_count ?? 0)}
                            color="info"
                        />
                    </div>
                )}
                <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white border-bottom">
                        <Card.Title className="mb-0">
                            Unpaid Balances
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
                                    <th>Reference</th>
                                    <th>Customer</th>
                                    <th>Vehicle</th>
                                    <th>Total Cost</th>
                                    <th>Amount Paid</th>
                                    <th>Amount Due</th>
                                    <th>Payment Status</th>
                                    <th>Rental Status</th>
                                    <th>Return Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="text-center text-muted py-4"
                                        >
                                            No outstanding payments
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map(row => (
                                        <tr key={row.id}>
                                            <td className="fw-semibold">
                                                {row.reference ?? '-'}
                                            </td>
                                            <td>{row.customer?.name ?? '-'}</td>
                                            <td>{row.vehicle?.name ?? '-'}</td>
                                            <td>
                                                {formatWithSymbol(
                                                    row.total_cost ?? 0,
                                                    row.currency_symbol ??
                                                        globalSymbol
                                                )}
                                            </td>
                                            <td>
                                                {formatWithSymbol(
                                                    row.amount_paid ?? 0,
                                                    row.currency_symbol ??
                                                        globalSymbol
                                                )}
                                            </td>
                                            <td className="fw-semibold text-danger">
                                                {formatWithSymbol(
                                                    row.amount_due ?? 0,
                                                    row.currency_symbol ??
                                                        globalSymbol
                                                )}
                                            </td>
                                            <td>
                                                <Badge
                                                    bg={
                                                        row.payment_status ===
                                                        'partial'
                                                            ? 'warning'
                                                            : 'danger'
                                                    }
                                                    text={
                                                        row.payment_status ===
                                                        'partial'
                                                            ? 'dark'
                                                            : undefined
                                                    }
                                                    className="text-capitalize"
                                                >
                                                    {row.payment_status ?? '-'}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Badge
                                                    bg="secondary"
                                                    className="text-capitalize"
                                                >
                                                    {(
                                                        row.status ?? '-'
                                                    ).replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td>
                                                <small className="text-muted">
                                                    {row.return_date
                                                        ? formatDate(
                                                              row.return_date
                                                          )
                                                        : '-'}
                                                </small>
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
