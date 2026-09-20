import { useState } from 'react';
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Form,
    Modal,
    Row,
    Spinner,
} from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { DetailPageSkeleton } from '@adminComponents/skeletons/DetailPageSkeleton';
import { useAppSelector } from '@/store';
import { selectActiveBranchId } from '@/store/slices/activeBranchSlice';
import { useGeneralSettings } from '@/shared/hooks/queries/useSettings';
import { formatCurrency, formatStatus } from '@/shared/libs/utils';
import { formatWithSymbol } from '@/shared/libs/currency';

import {
    useChauffeurBooking,
    useConfirmChauffeurBooking,
    useAssignChauffeurDriver,
    useRemoveChauffeurDriver,
    useStartChauffeurTrip,
    useCompleteChauffeurTrip,
    useCancelChauffeurBooking,
    useMarkChauffeurNoShow,
    useRecordChauffeurPayment,
    useLogChauffeurPickup,
    useLogChauffeurReturn,
    useUpdateChauffeurBooking,
    useProcessChauffeurRefund,
    useSendChauffeurPaymentLink,
} from '@/shared/hooks/queries/useChauffeurBookings';
import { useAvailableChauffeursDrivers } from '@/shared/hooks/queries/useDrivers';
import { ROUTES } from '@/shared/routes';
import { useTitle } from '@/shared/hooks';
import type {
    ChauffeurBookingStatus,
    ChauffeurPaymentStatus,
    ChauffeurPaymentMethod,
    BookingRecord,
    ChauffeurPickupLogData,
    ChauffeurReturnLogData,
} from '@/shared/types/chauffeur-booking.types';
import { useTransactions } from '@/shared/hooks/queries/useTransactions';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';
import type {
    Transaction,
    TransactionStatus,
    TransactionType,
} from '@/shared/types/transaction.types';

/* Transaction History */
const TX_STATUS_VARIANT: Record<TransactionStatus, string> = {
    paid: 'success',
    pending: 'warning',
    failed: 'danger',
    under_review: 'warning',
    refunded: 'info',
};

const TX_TYPE_VARIANT: Record<TransactionType, string> = {
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

const TX_PER_PAGE = 15;

function TransactionHistorySection({ bookingId }: { bookingId: string }) {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const { data: generalSettings } = useGeneralSettings();
    const globalSymbol = generalSettings?.data?.currency_symbol ?? '₵';
    const activeBranchId = useAppSelector(selectActiveBranchId);

    const { data, isLoading } = useTransactions({
        'filter[transactable_type]': 'chauffeur_booking',
        'filter[transactable_id]': bookingId,
        per_page: TX_PER_PAGE,
        page,
    });

    const transactions: Transaction[] = data?.data ?? [];
    const meta = data?.meta ?? null;
    const stats = data?.stats;

    if (!isLoading && transactions.length === 0 && page === 1) {
        return null;
    }

    const totalPaid = stats?.total_paid ?? 0;
    const firstTx = transactions[0];
    const txShowConverted =
        !!firstTx?.exchange_rate &&
        firstTx.exchange_rate !== 1 &&
        (!activeBranchId || activeBranchId !== firstTx?.branch_id);
    const totalPaidDisplay =
        txShowConverted && firstTx?.exchange_rate && firstTx?.currency_symbol
            ? `${formatWithSymbol(totalPaid, firstTx.currency_symbol)} / ${formatWithSymbol(totalPaid * firstTx.exchange_rate, globalSymbol)}`
            : firstTx?.currency_symbol
              ? formatWithSymbol(totalPaid, firstTx.currency_symbol)
              : formatCurrency(totalPaid);
    const fmtTx = (tx: Transaction): string => {
        const showDual =
            !!tx.exchange_rate &&
            tx.exchange_rate !== 1 &&
            (!activeBranchId || activeBranchId !== tx.branch_id);
        if (showDual && tx.exchange_rate && tx.currency_symbol) {
            return `${formatWithSymbol(tx.amount, tx.currency_symbol)} / ${formatWithSymbol(tx.amount * tx.exchange_rate, globalSymbol)}`;
        }
        return tx.currency_symbol
            ? formatWithSymbol(tx.amount, tx.currency_symbol)
            : formatCurrency(tx.amount);
    };

    return (
        <Card className="mt-3 border-0 shadow-sm">
            <Card.Header
                className="py-2 px-3 d-flex align-items-center justify-content-between"
                style={{
                    background:
                        'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    borderRadius: '8px 8px 0 0',
                }}
            >
                <span
                    className="small fw-semibold text-white text-uppercase"
                    style={{ letterSpacing: '0.05em' }}
                >
                    Transaction History
                </span>
                {!isLoading && meta && (
                    <span className="small text-white-50">
                        {meta.total} record{meta.total !== 1 ? 's' : ''}{' '}
                        &middot; Total paid:{' '}
                        <span className="text-success fw-semibold">
                            {totalPaidDisplay}
                        </span>
                    </span>
                )}
            </Card.Header>
            <Card.Body className="p-0">
                {isLoading ? (
                    <div className="text-center py-3">
                        <Spinner animation="border" size="sm" />
                    </div>
                ) : (
                    <>
                        <div className="table-responsive">
                            <table
                                className="table table-sm table-hover mb-0 align-middle"
                                style={{ fontSize: '0.82rem' }}
                            >
                                <thead
                                    className="rental-tx-thead"
                                    style={{ background: '#f8f9fc' }}
                                >
                                    <tr>
                                        <th
                                            className="ps-3 fw-semibold text-muted"
                                            style={{
                                                fontSize: '0.72rem',
                                                letterSpacing: '0.04em',
                                            }}
                                        >
                                            REFERENCE
                                        </th>
                                        <th
                                            className="fw-semibold text-muted"
                                            style={{
                                                fontSize: '0.72rem',
                                                letterSpacing: '0.04em',
                                            }}
                                        >
                                            TYPE
                                        </th>
                                        <th
                                            className="fw-semibold text-muted"
                                            style={{
                                                fontSize: '0.72rem',
                                                letterSpacing: '0.04em',
                                            }}
                                        >
                                            AMOUNT
                                        </th>
                                        <th
                                            className="fw-semibold text-muted"
                                            style={{
                                                fontSize: '0.72rem',
                                                letterSpacing: '0.04em',
                                            }}
                                        >
                                            STATUS
                                        </th>
                                        <th
                                            className="fw-semibold text-muted"
                                            style={{
                                                fontSize: '0.72rem',
                                                letterSpacing: '0.04em',
                                            }}
                                        >
                                            DATE
                                        </th>
                                        <th className="pe-3" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map(tx => (
                                        <tr
                                            key={tx.id}
                                            className="rental-tx-row"
                                            style={{
                                                borderBottom:
                                                    '1px solid #f0f0f0',
                                            }}
                                        >
                                            <td className="ps-3">
                                                <span
                                                    className="fw-semibold"
                                                    style={{
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.79rem',
                                                    }}
                                                >
                                                    {tx.reference}
                                                </span>
                                                {tx.description && (
                                                    <div
                                                        className="text-muted"
                                                        style={{
                                                            fontSize: '0.72rem',
                                                            lineHeight: 1.2,
                                                        }}
                                                    >
                                                        {tx.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <Badge
                                                    bg={
                                                        TX_TYPE_VARIANT[
                                                            tx.type
                                                        ] ?? 'secondary'
                                                    }
                                                    style={{
                                                        fontSize: '0.68rem',
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {tx.type_label}
                                                </Badge>
                                            </td>
                                            <td
                                                className="fw-bold"
                                                style={{
                                                    color:
                                                        tx.status === 'paid'
                                                            ? '#16a34a'
                                                            : '#374151',
                                                }}
                                            >
                                                {fmtTx(tx)}
                                            </td>
                                            <td>
                                                <Badge
                                                    bg={
                                                        TX_STATUS_VARIANT[
                                                            tx.status
                                                        ] ?? 'secondary'
                                                    }
                                                    style={{
                                                        fontSize: '0.68rem',
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {tx.status_label}
                                                </Badge>
                                            </td>
                                            <td className="text-muted">
                                                {new Date(
                                                    tx.paid_at ?? tx.created_at
                                                ).toLocaleDateString('en-GB', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td className="text-end pe-3">
                                                <Button
                                                    size="sm"
                                                    variant="link"
                                                    className="p-0 text-primary text-decoration-none"
                                                    style={{
                                                        fontSize: '0.72rem',
                                                    }}
                                                    onClick={() =>
                                                        navigate(
                                                            ROUTES.DASHBOARD.FINANCE.TRANSACTIONS.VIEW(
                                                                tx.id
                                                            )
                                                        )
                                                    }
                                                >
                                                    View &rarr;
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {meta && meta.last_page > 1 && (
                            <div
                                className="d-flex align-items-center justify-content-between px-3 py-2 border-top"
                                style={{ fontSize: '0.78rem' }}
                            >
                                <span className="text-muted">
                                    Page {meta.current_page} of {meta.last_page}
                                </span>
                                <div className="d-flex gap-1">
                                    <Button
                                        size="sm"
                                        variant="outline-secondary"
                                        disabled={page <= 1}
                                        onClick={() => setPage(p => p - 1)}
                                        style={{
                                            fontSize: '0.72rem',
                                            padding: '2px 8px',
                                        }}
                                    >
                                        &lsaquo; Prev
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline-secondary"
                                        disabled={page >= meta.last_page}
                                        onClick={() => setPage(p => p + 1)}
                                        style={{
                                            fontSize: '0.72rem',
                                            padding: '2px 8px',
                                        }}
                                    >
                                        Next &rsaquo;
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card.Body>
        </Card>
    );
}

/* Lookup maps */
const STATUS_VARIANT: Record<ChauffeurBookingStatus, string> = {
    pending: 'secondary',
    confirmed: 'primary',
    driver_assigned: 'warning',
    in_progress: 'success',
    completed: 'success',
    cancelled: 'danger',
    no_show: 'dark',
};

const STATUS_LABEL: Record<ChauffeurBookingStatus, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    driver_assigned: 'Driver Assigned',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
};

const PAYMENT_VARIANT: Record<ChauffeurPaymentStatus, string> = {
    pending: 'warning',
    paid: 'success',
    refunded: 'info',
    waived: 'secondary',
};

const PAYMENT_LABEL: Record<ChauffeurPaymentStatus, string> = {
    pending: 'Pending',
    paid: 'Paid',
    refunded: 'Refunded',
    waived: 'Waived',
};

/* Helpers */
function fmtDate(iso: string | null | undefined) {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="d-flex justify-content-between py-2 border-bottom">
            <span className="text-muted small">{label}</span>
            <span className="fw-semibold small text-end">{value ?? '-'}</span>
        </div>
    );
}

/* Assign Driver Modal */
function AssignDriverModal({
    bookingId,
    show,
    onHide,
}: {
    bookingId: string;
    show: boolean;
    onHide: () => void;
}) {
    const [driverId, setDriverId] = useState('');
    const assignMutation = useAssignChauffeurDriver();
    const { data: driversRes, isLoading } = useAvailableChauffeursDrivers();
    const drivers = driversRes?.data ?? [];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        assignMutation.mutate(
            { id: bookingId, payload: { driver_id: driverId } },
            {
                onSuccess: () => {
                    onHide();
                    setDriverId('');
                },
            }
        );
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title className="fs-6">Assign Driver</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Select Driver</Form.Label>
                        <Form.Select
                            value={driverId}
                            onChange={e => setDriverId(e.target.value)}
                            required
                            disabled={isLoading}
                        >
                            <option value="">
                                {isLoading
                                    ? 'Loading drivers...'
                                    : 'Select a driver...'}
                            </option>
                            {drivers.map(d => (
                                <option key={d.id} value={d.id}>
                                    {d.first_name} {d.last_name} -{' '}
                                    {d.phone_number}
                                </option>
                            ))}
                        </Form.Select>
                        {drivers.length === 0 && !isLoading && (
                            <Form.Text className="text-warning">
                                No available chauffeur drivers found.
                            </Form.Text>
                        )}
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={onHide}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={assignMutation.isPending || !driverId}
                    >
                        {assignMutation.isPending
                            ? 'Assigning...'
                            : 'Assign Driver'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

/* Record Payment Modal */
function PaymentModal({
    bookingId,
    show,
    onHide,
}: {
    bookingId: string;
    show: boolean;
    onHide: () => void;
}) {
    const [method, setMethod] = useState<ChauffeurPaymentMethod | ''>('cash');
    const [ref, setRef] = useState('');
    const paymentMutation = useRecordChauffeurPayment();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!method) return;
        paymentMutation.mutate(
            {
                id: bookingId,
                payload: {
                    payment_method: method,
                    payment_reference: ref || undefined,
                },
            },
            { onSuccess: () => onHide() }
        );
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title className="fs-6">Record Payment</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Row className="g-3">
                        <Col xs={12}>
                            <Form.Group>
                                <Form.Label>Payment Method</Form.Label>
                                <Form.Select
                                    value={method}
                                    onChange={e =>
                                        setMethod(
                                            e.target
                                                .value as ChauffeurPaymentMethod
                                        )
                                    }
                                    required
                                >
                                    <option value="cash">Cash</option>
                                    <option value="mobile_money">
                                        Mobile Money
                                    </option>
                                    <option value="bank_transfer">
                                        Bank Transfer
                                    </option>
                                    <option value="offline_transfer">
                                        Offline Transfer
                                    </option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col xs={12}>
                            <Form.Group>
                                <Form.Label>Reference (optional)</Form.Label>
                                <Form.Control
                                    placeholder="Transaction reference"
                                    value={ref}
                                    onChange={e => setRef(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={onHide}>
                        Cancel
                    </Button>
                    <Button
                        variant="success"
                        type="submit"
                        disabled={paymentMutation.isPending}
                    >
                        {paymentMutation.isPending
                            ? 'Recording...'
                            : 'Record Payment'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

/* Refund Modal */
function RefundModal({
    booking,
    currencySymbol,
    show,
    onHide,
}: {
    booking: {
        id: string;
        total_amount: number;
        cancellation_fee_applied: number | null;
    };
    currencySymbol: string;
    show: boolean;
    onHide: () => void;
}) {
    const [action, setAction] = useState<'approve' | 'waive'>('approve');
    const [note, setNote] = useState('');
    const refundMutation = useProcessChauffeurRefund();

    const cancellationFee = booking.cancellation_fee_applied ?? 0;
    const netRefund = Math.max(0, booking.total_amount - cancellationFee);

    const fmtR = (n: number) => formatWithSymbol(n, currencySymbol);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        refundMutation.mutate(
            { id: booking.id, action, note: note || undefined },
            {
                onSuccess: () => {
                    onHide();
                    setNote('');
                    setAction('approve');
                },
            }
        );
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title className="fs-6">Process Refund</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {/* Refund breakdown */}
                    <div className="border rounded p-3 mb-3 bg-light">
                        <div className="d-flex justify-content-between small mb-1">
                            <span className="text-muted">Amount Paid</span>
                            <span className="fw-semibold">
                                {fmtR(booking.total_amount)}
                            </span>
                        </div>
                        {cancellationFee > 0 && (
                            <div className="d-flex justify-content-between small mb-1">
                                <span className="text-muted">
                                    Cancellation Fee
                                </span>
                                <span className="text-danger fw-semibold">
                                    - {fmtR(cancellationFee)}
                                </span>
                            </div>
                        )}
                        <div className="d-flex justify-content-between small border-top pt-2 mt-1">
                            <span className="fw-bold">Net Refund</span>
                            <span className="fw-bold text-success">
                                {fmtR(netRefund)}
                            </span>
                        </div>
                    </div>

                    {/* Action selection */}
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Action</Form.Label>
                        <div className="d-flex gap-3">
                            <Form.Check
                                type="radio"
                                id="refund-approve"
                                label="Approve Refund"
                                name="refundAction"
                                value="approve"
                                checked={action === 'approve'}
                                onChange={() => setAction('approve')}
                            />
                            <Form.Check
                                type="radio"
                                id="refund-waive"
                                label="Waive (no refund)"
                                name="refundAction"
                                value="waive"
                                checked={action === 'waive'}
                                onChange={() => setAction('waive')}
                            />
                        </div>
                        <Form.Text className="text-muted">
                            {action === 'approve'
                                ? 'The customer has been refunded. A confirmation email will be sent.'
                                : 'No money will be returned. No email will be sent.'}
                        </Form.Text>
                    </Form.Group>

                    <Form.Group>
                        <Form.Label>
                            Note{' '}
                            <span className="text-muted small">(optional)</span>
                        </Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            placeholder="Internal note or reason..."
                            value={note}
                            onChange={e => setNote(e.target.value)}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="light"
                        onClick={onHide}
                        disabled={refundMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant={action === 'approve' ? 'info' : 'secondary'}
                        type="submit"
                        disabled={refundMutation.isPending}
                    >
                        {refundMutation.isPending
                            ? 'Processing...'
                            : action === 'approve'
                              ? 'Confirm Refund'
                              : 'Waive Refund'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

/* Pickup Log Modal */
function PickupLogModal({
    bookingId,
    show,
    onHide,
}: {
    bookingId: string;
    show: boolean;
    onHide: () => void;
}) {
    const [form, setForm] = useState<ChauffeurPickupLogData>({
        customer_present: true,
    });
    const logMutation = useLogChauffeurPickup();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        logMutation.mutate(
            { id: bookingId, payload: form },
            { onSuccess: () => onHide() }
        );
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title className="fs-6">Log Pickup</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Row className="g-3">
                        <Col xs={12}>
                            <Form.Group>
                                <Form.Label>Pickup Location</Form.Label>
                                <Form.Control
                                    placeholder="Actual pickup address"
                                    value={form.pickup_location ?? ''}
                                    onChange={e =>
                                        setForm(p => ({
                                            ...p,
                                            pickup_location: e.target.value,
                                        }))
                                    }
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Odometer Reading (km)</Form.Label>
                                <Form.Control
                                    type="number"
                                    min={0}
                                    value={form.odometer_reading ?? ''}
                                    onChange={e =>
                                        setForm(p => ({
                                            ...p,
                                            odometer_reading: e.target.value
                                                ? Number(e.target.value)
                                                : undefined,
                                        }))
                                    }
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Customer Present</Form.Label>
                                <Form.Select
                                    value={form.customer_present ? 'yes' : 'no'}
                                    onChange={e =>
                                        setForm(p => ({
                                            ...p,
                                            customer_present:
                                                e.target.value === 'yes',
                                        }))
                                    }
                                >
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col xs={12}>
                            <Form.Group>
                                <Form.Label>Driver Notes</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    placeholder="Optional notes"
                                    value={form.driver_notes ?? ''}
                                    onChange={e =>
                                        setForm(p => ({
                                            ...p,
                                            driver_notes: e.target.value,
                                        }))
                                    }
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={onHide}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={logMutation.isPending}
                    >
                        {logMutation.isPending ? 'Logging...' : 'Log Pickup'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

/* Return Log Modal */
function ReturnLogModal({
    bookingId,
    show,
    onHide,
}: {
    bookingId: string;
    show: boolean;
    onHide: () => void;
}) {
    const [form, setForm] = useState<ChauffeurReturnLogData>({});
    const logMutation = useLogChauffeurReturn();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        logMutation.mutate(
            { id: bookingId, payload: form },
            { onSuccess: () => onHide() }
        );
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title className="fs-6">Log Return</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Odometer Reading (km)</Form.Label>
                                <Form.Control
                                    type="number"
                                    min={0}
                                    value={form.odometer_reading ?? ''}
                                    onChange={e =>
                                        setForm(p => ({
                                            ...p,
                                            odometer_reading: e.target.value
                                                ? Number(e.target.value)
                                                : undefined,
                                        }))
                                    }
                                />
                            </Form.Group>
                        </Col>
                        <Col xs={12}>
                            <Form.Group>
                                <Form.Label>Condition Notes</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    placeholder="Vehicle condition on return"
                                    value={form.condition_notes ?? ''}
                                    onChange={e =>
                                        setForm(p => ({
                                            ...p,
                                            condition_notes: e.target.value,
                                        }))
                                    }
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={onHide}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={logMutation.isPending}
                    >
                        {logMutation.isPending ? 'Logging...' : 'Log Return'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

/* Cancel Modal */
function CancelModal({
    bookingId,
    show,
    onHide,
}: {
    bookingId: string;
    show: boolean;
    onHide: () => void;
}) {
    const [reason, setReason] = useState('');
    const cancelMutation = useCancelChauffeurBooking();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        cancelMutation.mutate(
            { id: bookingId, payload: { reason: reason || undefined } },
            {
                onSuccess: () => {
                    onHide();
                    setReason('');
                },
            }
        );
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title className="fs-6">Cancel Booking</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <p className="text-muted small mb-3">
                        A cancellation fee may apply. This cannot be undone.
                    </p>
                    <Form.Group>
                        <Form.Label>Reason (optional)</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={onHide}>
                        Back
                    </Button>
                    <Button
                        variant="danger"
                        type="submit"
                        disabled={cancelMutation.isPending}
                    >
                        {cancelMutation.isPending
                            ? 'Cancelling...'
                            : 'Cancel Booking'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

/* No Show Confirm Modal */
function NoShowConfirmModal({
    bookingId,
    show,
    onHide,
}: {
    bookingId: string;
    show: boolean;
    onHide: () => void;
}) {
    const noShowMutation = useMarkChauffeurNoShow();

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title className="fs-6">Mark as No Show</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p className="text-muted small mb-0">
                    Are you sure you want to mark this booking as{' '}
                    <strong>No Show</strong>? A no-show fee may be applied. This
                    cannot be undone.
                </p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="light" onClick={onHide}>
                    Back
                </Button>
                <Button
                    variant="dark"
                    disabled={noShowMutation.isPending}
                    onClick={() =>
                        noShowMutation.mutate(bookingId, {
                            onSuccess: () => onHide(),
                        })
                    }
                >
                    {noShowMutation.isPending
                        ? 'Marking...'
                        : 'Confirm No Show'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

/* Staff Notes Modal */
function StaffNotesModal({
    bookingId,
    currentNotes,
    show,
    onHide,
}: {
    bookingId: string;
    currentNotes: string | null;
    show: boolean;
    onHide: () => void;
}) {
    const [notes, setNotes] = useState(currentNotes ?? '');
    const updateMutation = useUpdateChauffeurBooking();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(
            { id: bookingId, payload: { staff_notes: notes || null } },
            { onSuccess: () => onHide() }
        );
    };

    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            onShow={() => setNotes(currentNotes ?? '')}
        >
            <Modal.Header closeButton>
                <Modal.Title className="fs-6">Staff Notes</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Form.Control
                        as="textarea"
                        rows={5}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Internal notes about this booking..."
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={onHide}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={updateMutation.isPending}
                    >
                        {updateMutation.isPending ? 'Saving...' : 'Save Notes'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

/* Audit Timeline */
function AuditTimeline({ records }: { records: BookingRecord[] }) {
    if (records.length === 0) {
        return <p className="text-muted small">No activity recorded yet.</p>;
    }
    return (
        <div>
            {records.map(r => (
                <div key={r.id} className="d-flex gap-3 mb-3">
                    <div
                        className="rounded-circle bg-primary flex-shrink-0"
                        style={{ width: 10, height: 10, marginTop: 5 }}
                    />
                    <div>
                        <span className="fw-semibold small">
                            {formatStatus(r.action)}
                        </span>
                        {r.notes && (
                            <span className="text-muted small ms-2">
                                - {r.notes}
                            </span>
                        )}
                        <br />
                        <small className="text-muted">
                            {r.performed_by?.name ?? 'System'} &middot;{' '}
                            {fmtDate(r.created_at)}
                        </small>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* Main Component */
export default function ChauffeurBookingDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: res, isLoading, isError } = useChauffeurBooking(id!);
    const booking = res?.data;

    const activeBranchId = useAppSelector(selectActiveBranchId);
    const { data: generalSettings } = useGeneralSettings();
    const globalSymbol = generalSettings?.data?.currency_symbol ?? 'GHS';

    useTitle(
        booking ? `Booking ${booking.booking_reference}` : 'Booking Detail'
    );

    const confirmMutation = useConfirmChauffeurBooking();
    const removeDriveMutation = useRemoveChauffeurDriver();
    const startTripMutation = useStartChauffeurTrip();
    const completeTripMutation = useCompleteChauffeurTrip();
    const sendPaymentLinkMutation = useSendChauffeurPaymentLink();

    const [showAssign, setShowAssign] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [showPickupLog, setShowPickupLog] = useState(false);
    const [showReturnLog, setShowReturnLog] = useState(false);
    const [showCancel, setShowCancel] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [showNoShow, setShowNoShow] = useState(false);
    const [showRefund, setShowRefund] = useState(false);
    const [showSendPaymentLinkConfirm, setShowSendPaymentLinkConfirm] =
        useState(false);

    if (isLoading) {
        return <DetailPageSkeleton cards={3} />;
    }

    if (isError || !booking) {
        return (
            <Alert variant="danger">
                Booking not found.{' '}
                <Alert.Link
                    onClick={() =>
                        navigate(
                            ROUTES.DASHBOARD.CHAUFFEUR_RENTAL.BOOKINGS.ROOT
                        )
                    }
                >
                    Back to bookings
                </Alert.Link>
            </Alert>
        );
    }

    const showConverted =
        !!booking.exchange_rate &&
        booking.exchange_rate !== 1 &&
        (!activeBranchId || activeBranchId !== booking.branch_id);

    const fmtC = (n: number): string =>
        booking.currency_symbol
            ? formatWithSymbol(n, booking.currency_symbol)
            : formatCurrency(n);

    const fmtCDual = (n: number): string => {
        if (!showConverted || !booking.exchange_rate) return fmtC(n);
        const globalAmt = n * booking.exchange_rate;
        return `${fmtC(n)} / ${formatWithSymbol(globalAmt, globalSymbol)}`;
    };

    const s = booking.booking_status;
    const canConfirm = s === 'pending';
    const canAssignDriver = s === 'confirmed' || s === 'driver_assigned';
    const canRemoveDriver = s === 'driver_assigned';
    const canStartTrip = s === 'confirmed' || s === 'driver_assigned';
    const canCompleteTrip = s === 'in_progress';
    const canNoShow = s === 'confirmed' || s === 'driver_assigned';
    const canCancel = booking.is_cancellable;
    const canLogPickup = !booking.pickup_log;
    const canLogReturn = !booking.return_log;
    const canRecordPayment = booking.payment_status !== 'paid';
    const canSendPaymentLink =
        booking.payment_status !== 'paid' &&
        !!booking.chauffeur_customer?.email;
    const canRefund = s === 'cancelled' && booking.payment_status === 'paid';

    return (
        <div className="pb-4">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
                <div>
                    <button
                        className="btn btn-link text-muted p-0 mb-1"
                        style={{ fontSize: 13 }}
                        onClick={() =>
                            navigate(
                                ROUTES.DASHBOARD.CHAUFFEUR_RENTAL.BOOKINGS.ROOT
                            )
                        }
                    >
                        &larr; Back to Bookings
                    </button>
                    <h4 className="mb-1">{booking.booking_reference}</h4>
                    <div className="d-flex gap-2 flex-wrap">
                        <Badge bg={STATUS_VARIANT[booking.booking_status]}>
                            {STATUS_LABEL[booking.booking_status]}
                        </Badge>
                        <Badge bg={PAYMENT_VARIANT[booking.payment_status]}>
                            {PAYMENT_LABEL[booking.payment_status]}
                        </Badge>
                        <span className="fw-bold text-primary">
                            {fmtCDual(booking.total_amount)}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <PermisssionGuard
                    permission={PERMISSIONS.CHAUFFEUR_RENTAL.MANAGE_BOOKINGS}
                >
                    <div className="d-flex flex-wrap gap-2">
                        {canConfirm && (
                            <Button
                                size="sm"
                                variant="primary"
                                disabled={confirmMutation.isPending}
                                onClick={() =>
                                    confirmMutation.mutate(booking.id)
                                }
                            >
                                {confirmMutation.isPending
                                    ? 'Confirming...'
                                    : 'Confirm'}
                            </Button>
                        )}
                        {canAssignDriver && (
                            <Button
                                size="sm"
                                variant="warning"
                                onClick={() => setShowAssign(true)}
                            >
                                {booking.driver
                                    ? 'Change Driver'
                                    : 'Assign Driver'}
                            </Button>
                        )}
                        {canRemoveDriver && (
                            <Button
                                size="sm"
                                variant="outline-warning"
                                disabled={removeDriveMutation.isPending}
                                onClick={() =>
                                    removeDriveMutation.mutate(booking.id)
                                }
                            >
                                Remove Driver
                            </Button>
                        )}
                        {canStartTrip && (
                            <Button
                                size="sm"
                                variant="info"
                                disabled={startTripMutation.isPending}
                                onClick={() =>
                                    startTripMutation.mutate(booking.id)
                                }
                            >
                                Start Trip
                            </Button>
                        )}
                        {canCompleteTrip && (
                            <Button
                                size="sm"
                                variant="success"
                                disabled={completeTripMutation.isPending}
                                onClick={() =>
                                    completeTripMutation.mutate(booking.id)
                                }
                            >
                                Complete Trip
                            </Button>
                        )}
                        {canLogPickup && (
                            <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => setShowPickupLog(true)}
                            >
                                Log Pickup
                            </Button>
                        )}
                        {canLogReturn && (
                            <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => setShowReturnLog(true)}
                            >
                                Log Return
                            </Button>
                        )}
                        {canRecordPayment && (
                            <Button
                                size="sm"
                                variant="outline-success"
                                onClick={() => setShowPayment(true)}
                            >
                                Record Payment
                            </Button>
                        )}
                        {canSendPaymentLink && (
                            <Button
                                size="sm"
                                variant="outline-primary"
                                disabled={sendPaymentLinkMutation.isPending}
                                onClick={() =>
                                    setShowSendPaymentLinkConfirm(true)
                                }
                            >
                                <i className="fas fa-link me-1" />
                                {sendPaymentLinkMutation.isPending
                                    ? 'Sending...'
                                    : 'Send Payment Link'}
                            </Button>
                        )}
                        {canNoShow && (
                            <Button
                                size="sm"
                                variant="dark"
                                onClick={() => setShowNoShow(true)}
                            >
                                No Show
                            </Button>
                        )}
                        {canCancel && (
                            <Button
                                size="sm"
                                variant="danger"
                                onClick={() => setShowCancel(true)}
                            >
                                Cancel
                            </Button>
                        )}
                        {canRefund && (
                            <Button
                                size="sm"
                                variant="outline-info"
                                onClick={() => setShowRefund(true)}
                            >
                                Refund
                            </Button>
                        )}
                    </div>
                </PermisssionGuard>
            </div>

            <Row className="g-4">
                {/* Trip Details */}
                <Col lg={6}>
                    <Card>
                        <Card.Header>
                            <Card.Title className="fs-6">
                                Trip Details
                            </Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <InfoRow
                                label="Pickup Time"
                                value={fmtDate(booking.pickup_time)}
                            />
                            <InfoRow
                                label="Return Time"
                                value={fmtDate(booking.return_time)}
                            />
                            <InfoRow
                                label="Actual Pickup"
                                value={fmtDate(booking.actual_pickup_time)}
                            />
                            <InfoRow
                                label="Actual Return"
                                value={fmtDate(booking.actual_return_time)}
                            />
                            <InfoRow
                                label="Pickup Location"
                                value={booking.pickup_location?.name}
                            />
                            <InfoRow
                                label="Branch"
                                value={booking.branch?.name}
                            />
                            <InfoRow
                                label="Vehicle"
                                value={
                                    booking.vehicle
                                        ? `${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.license_plate})`
                                        : null
                                }
                            />
                            <InfoRow
                                label="Driver"
                                value={
                                    booking.driver
                                        ? `${booking.driver.name} - ${booking.driver.phone}`
                                        : null
                                }
                            />
                            <InfoRow
                                label="Created By"
                                value={booking.created_by?.name}
                            />
                        </Card.Body>
                    </Card>
                </Col>

                {/* Customer */}
                <Col lg={6}>
                    <Card>
                        <Card.Header>
                            <Card.Title className="fs-6">Customer</Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <InfoRow
                                label="Name"
                                value={booking.chauffeur_customer?.full_name}
                            />
                            <InfoRow
                                label="Phone"
                                value={booking.chauffeur_customer?.phone}
                            />
                            <InfoRow
                                label="Email"
                                value={booking.chauffeur_customer?.email}
                            />
                            <InfoRow
                                label="Expected Destination"
                                value={
                                    booking.chauffeur_customer
                                        ?.expected_destination
                                }
                            />
                        </Card.Body>
                    </Card>
                </Col>

                {/* Pricing */}
                <Col lg={6}>
                    <Card>
                        <Card.Header>
                            <Card.Title className="fs-6">
                                Pricing Breakdown
                            </Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <InfoRow
                                label="Base Price"
                                value={fmtCDual(booking.base_price_snapshot)}
                            />
                            {booking.pickup_charge_snapshot > 0 && (
                                <InfoRow
                                    label="Pickup Charge"
                                    value={fmtCDual(
                                        booking.pickup_charge_snapshot
                                    )}
                                />
                            )}
                            {booking.coupon_discount_snapshot > 0 && (
                                <InfoRow
                                    label="Coupon Discount"
                                    value={`-${fmtC(booking.coupon_discount_snapshot)}`}
                                />
                            )}
                            <InfoRow
                                label={`VAT (${booking.vat_rate_snapshot}%)`}
                                value={fmtCDual(booking.vat_amount)}
                            />
                            {booking.overtime_hours > 0 && (
                                <>
                                    <InfoRow
                                        label="Overtime Hours"
                                        value={`${booking.overtime_hours}h`}
                                    />
                                    <InfoRow
                                        label="Overtime Charge"
                                        value={fmtCDual(
                                            booking.overtime_charge
                                        )}
                                    />
                                </>
                            )}
                            {booking.cancellation_fee_applied != null && (
                                <InfoRow
                                    label="Cancellation Fee"
                                    value={fmtCDual(
                                        booking.cancellation_fee_applied
                                    )}
                                />
                            )}
                            {booking.no_show_fee_applied != null && (
                                <InfoRow
                                    label="No-Show Fee"
                                    value={fmtCDual(
                                        booking.no_show_fee_applied
                                    )}
                                />
                            )}
                            <div className="d-flex justify-content-between py-2 fw-bold">
                                <span>Total</span>
                                <span className="text-primary">
                                    {fmtCDual(booking.total_amount)}
                                </span>
                            </div>
                            <hr />
                            <InfoRow
                                label="Payment Method"
                                value={booking.payment_method}
                            />
                            <InfoRow
                                label="Payment Reference"
                                value={booking.payment_reference}
                            />
                        </Card.Body>
                    </Card>
                </Col>

                {/* Staff Notes */}
                <Col lg={6}>
                    <Card>
                        <Card.Header className="d-flex align-items-center justify-content-between">
                            <Card.Title className="fs-6 mb-0">
                                Staff Notes
                            </Card.Title>
                            <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={() => setShowNotes(true)}
                            >
                                Edit
                            </Button>
                        </Card.Header>
                        <Card.Body>
                            {booking.staff_notes ? (
                                <p className="small mb-0">
                                    {booking.staff_notes}
                                </p>
                            ) : (
                                <p className="text-muted small mb-0">
                                    No notes.
                                </p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Pickup Log */}
                <Col lg={6}>
                    <Card>
                        <Card.Header className="d-flex align-items-center justify-content-between">
                            <Card.Title className="fs-6 mb-0">
                                Pickup Log
                            </Card.Title>
                            {canLogPickup && (
                                <Button
                                    size="sm"
                                    variant="outline-primary"
                                    onClick={() => setShowPickupLog(true)}
                                >
                                    Log Pickup
                                </Button>
                            )}
                        </Card.Header>
                        <Card.Body>
                            {booking.pickup_log ? (
                                <>
                                    <InfoRow
                                        label="Location"
                                        value={
                                            booking.pickup_log.pickup_location
                                        }
                                    />
                                    <InfoRow
                                        label="Odometer"
                                        value={
                                            booking.pickup_log
                                                .odometer_reading != null
                                                ? `${booking.pickup_log.odometer_reading} km`
                                                : null
                                        }
                                    />
                                    <InfoRow
                                        label="Customer Present"
                                        value={
                                            booking.pickup_log.customer_present
                                                ? 'Yes'
                                                : 'No'
                                        }
                                    />
                                    <InfoRow
                                        label="Driver Notes"
                                        value={booking.pickup_log.driver_notes}
                                    />
                                </>
                            ) : (
                                <p className="text-muted small mb-0">
                                    No pickup logged yet.
                                </p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Return Log */}
                <Col lg={6}>
                    <Card>
                        <Card.Header className="d-flex align-items-center justify-content-between">
                            <Card.Title className="fs-6 mb-0">
                                Return Log
                            </Card.Title>
                            {canLogReturn && (
                                <Button
                                    size="sm"
                                    variant="outline-primary"
                                    onClick={() => setShowReturnLog(true)}
                                >
                                    Log Return
                                </Button>
                            )}
                        </Card.Header>
                        <Card.Body>
                            {booking.return_log ? (
                                <>
                                    <InfoRow
                                        label="Odometer"
                                        value={
                                            booking.return_log
                                                .odometer_reading != null
                                                ? `${booking.return_log.odometer_reading} km`
                                                : null
                                        }
                                    />
                                    <InfoRow
                                        label="Condition Notes"
                                        value={
                                            booking.return_log.condition_notes
                                        }
                                    />
                                    <InfoRow
                                        label="Overtime"
                                        value={
                                            booking.return_log
                                                .overtime_minutes > 0
                                                ? `${booking.return_log.overtime_minutes} mins`
                                                : 'None'
                                        }
                                    />
                                </>
                            ) : (
                                <p className="text-muted small mb-0">
                                    No return logged yet.
                                </p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Booking Records */}
                <Col xs={12}>
                    <Card>
                        <Card.Header>
                            <Card.Title className="fs-6">
                                Booking History
                            </Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <AuditTimeline
                                records={booking.booking_records ?? []}
                            />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Transaction History */}
            <TransactionHistorySection bookingId={booking.id} />

            {/* Modals */}
            <AssignDriverModal
                bookingId={booking.id}
                show={showAssign}
                onHide={() => setShowAssign(false)}
            />
            <PaymentModal
                bookingId={booking.id}
                show={showPayment}
                onHide={() => setShowPayment(false)}
            />
            <PickupLogModal
                bookingId={booking.id}
                show={showPickupLog}
                onHide={() => setShowPickupLog(false)}
            />
            <ReturnLogModal
                bookingId={booking.id}
                show={showReturnLog}
                onHide={() => setShowReturnLog(false)}
            />
            <CancelModal
                bookingId={booking.id}
                show={showCancel}
                onHide={() => setShowCancel(false)}
            />
            <StaffNotesModal
                bookingId={booking.id}
                currentNotes={booking.staff_notes}
                show={showNotes}
                onHide={() => setShowNotes(false)}
            />
            <NoShowConfirmModal
                bookingId={booking.id}
                show={showNoShow}
                onHide={() => setShowNoShow(false)}
            />
            <RefundModal
                booking={booking}
                currencySymbol={booking.currency_symbol ?? globalSymbol}
                show={showRefund}
                onHide={() => setShowRefund(false)}
            />

            {/* Send Payment Link Confirmation Modal */}
            <Modal
                show={showSendPaymentLinkConfirm}
                onHide={() => setShowSendPaymentLinkConfirm(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Send Payment Link</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="mb-3">
                        Send a payment link to{' '}
                        <strong>
                            {booking.chauffeur_customer?.full_name ??
                                'customer'}
                        </strong>
                        {booking.chauffeur_customer?.email && (
                            <>
                                {' '}
                                at{' '}
                                <strong>
                                    {booking.chauffeur_customer.email}
                                </strong>
                            </>
                        )}
                        .
                    </p>
                    <div
                        className="rounded-3 p-3 mb-2"
                        style={{
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                        }}
                    >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small">Amount</span>
                            <span className="fw-bold text-success">
                                {fmtCDual(booking.total_amount)}
                            </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted small">Reference</span>
                            <span className="fw-semibold small">
                                {booking.booking_reference}
                            </span>
                        </div>
                    </div>
                    <p className="text-muted small mb-0">
                        The customer will receive an email with a secure link to
                        complete their payment online.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowSendPaymentLinkConfirm(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        disabled={sendPaymentLinkMutation.isPending}
                        onClick={() => {
                            setShowSendPaymentLinkConfirm(false);
                            sendPaymentLinkMutation.mutate(booking.id);
                        }}
                    >
                        {sendPaymentLinkMutation.isPending
                            ? 'Sending...'
                            : 'Send Link'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
