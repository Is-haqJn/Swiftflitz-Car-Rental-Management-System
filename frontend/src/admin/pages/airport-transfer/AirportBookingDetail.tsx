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
import { useSelector } from 'react-redux';
import { DetailPageSkeleton } from '@adminComponents/skeletons/DetailPageSkeleton';
import { selectActiveBranchId } from '@/store/slices/activeBranchSlice';
import { useGeneralSettings } from '@/shared/hooks/queries/useSettings';
import { formatWithSymbol } from '@/shared/libs/currency';
import { formatCurrency } from '@/shared/libs/utils';

import {
    useAirportBooking,
    useConfirmAirportBooking,
    useAssignAirportBookingDriver,
    useRemoveAirportBookingDriver,
    useStartAirportTrip,
    useCompleteAirportTrip,
    useCancelAirportBooking,
    useMarkAirportBookingNoShow,
    useRecordAirportBookingPayment,
    useRefundAirportBooking,
    useSendAirportPaymentLink,
} from '@/shared/hooks/queries/useAirportBookings';
import { useAvailableAirportDrivers } from '@/shared/hooks/queries/useDrivers';
import { useAvailableFleetVehiclesForAirport } from '@/shared/hooks/queries/useFleetVehicles';
import { ROUTES } from '@/shared/routes';
import { PERMISSIONS } from '@/shared/config/permissions';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { useTitle } from '@/shared/hooks';
import type {
    AirportBookingStatus,
    AirportPaymentStatus,
    AirportPaymentMethod,
    AssignmentTarget,
    BookingRecord,
} from '@/shared/types/airport-booking.types';
import { useTransactions } from '@/shared/hooks/queries/useTransactions';
import type {
    Transaction,
    TransactionStatus,
    TransactionType,
} from '@/shared/types/transaction.types';
import { formatStatus } from '@/shared/libs/utils';
import { FaPlane } from 'react-icons/fa6';

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
    const activeBranchId = useSelector(selectActiveBranchId);

    const { data, isLoading } = useTransactions({
        'filter[transactable_type]': 'airport_booking',
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
    const fmtTxAmt = (tx: Transaction): string => {
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
                                                {fmtTxAmt(tx)}
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
const STATUS_VARIANT: Record<AirportBookingStatus, string> = {
    pending: 'secondary',
    payment_received: 'info',
    confirmed: 'primary',
    driver_assigned: 'warning',
    in_progress: 'success',
    completed: 'success',
    cancelled: 'danger',
    no_show: 'dark',
};

const STATUS_LABEL: Record<AirportBookingStatus, string> = {
    pending: 'Pending',
    payment_received: 'Payment Received',
    confirmed: 'Confirmed',
    driver_assigned: 'Driver Assigned',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
};

const PAYMENT_VARIANT: Record<AirportPaymentStatus, string> = {
    pending: 'warning',
    paid: 'success',
    refunded: 'info',
};

const PAYMENT_LABEL: Record<AirportPaymentStatus, string> = {
    pending: 'Pending',
    paid: 'Paid',
    refunded: 'Refunded',
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

/* Assign Modal */
const ASSIGN_TITLES: Record<AssignmentTarget, string> = {
    driver_only: 'Assign Driver',
    vehicle_only: 'Assign Vehicle',
    driver_and_vehicle: 'Assign Driver & Vehicle',
};

function AssignModal({
    bookingId,
    target,
    show,
    onHide,
}: {
    bookingId: string;
    target: AssignmentTarget;
    show: boolean;
    onHide: () => void;
}) {
    const [driverId, setDriverId] = useState('');
    const [vehicleId, setVehicleId] = useState('');
    const assignMutation = useAssignAirportBookingDriver();

    const needsDriver =
        target === 'driver_only' || target === 'driver_and_vehicle';
    const needsVehicle =
        target === 'vehicle_only' || target === 'driver_and_vehicle';

    const { data: driversRes, isLoading: driversLoading } =
        useAvailableAirportDrivers(show && needsDriver);
    const { data: vehiclesRes, isLoading: vehiclesLoading } =
        useAvailableFleetVehiclesForAirport(show && needsVehicle);

    const drivers = driversRes?.data ?? [];
    const vehicles = vehiclesRes?.data ?? [];

    const canSubmit =
        (!needsDriver || !!driverId) && (!needsVehicle || !!vehicleId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: { driver_id?: string; vehicle_id?: string } = {};
        if (needsDriver) payload.driver_id = driverId;
        if (needsVehicle) payload.vehicle_id = vehicleId;

        assignMutation.mutate(
            { id: bookingId, payload },
            {
                onSuccess: () => {
                    onHide();
                    setDriverId('');
                    setVehicleId('');
                },
            }
        );
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title className="fs-6">
                    {ASSIGN_TITLES[target]}
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {needsDriver && (
                        <Form.Group className={needsVehicle ? 'mb-3' : ''}>
                            <Form.Label>Driver</Form.Label>
                            <Form.Select
                                value={driverId}
                                onChange={e => setDriverId(e.target.value)}
                                required
                                disabled={driversLoading}
                            >
                                <option value="">
                                    {driversLoading
                                        ? 'Loading drivers…'
                                        : 'Select a driver…'}
                                </option>
                                {drivers.map(d => (
                                    <option key={d.id} value={d.id}>
                                        {d.first_name} {d.last_name} -{' '}
                                        {d.phone_number}
                                    </option>
                                ))}
                            </Form.Select>
                            {drivers.length === 0 && !driversLoading && (
                                <Form.Text className="text-warning">
                                    No available airport drivers found.
                                </Form.Text>
                            )}
                        </Form.Group>
                    )}

                    {needsVehicle && (
                        <Form.Group>
                            <Form.Label>Fleet Vehicle</Form.Label>
                            <Form.Select
                                value={vehicleId}
                                onChange={e => setVehicleId(e.target.value)}
                                required
                                disabled={vehiclesLoading}
                            >
                                <option value="">
                                    {vehiclesLoading
                                        ? 'Loading vehicles…'
                                        : 'Select a vehicle…'}
                                </option>
                                {vehicles.map(v => (
                                    <option key={v.id} value={v.id}>
                                        {v.year} {v.make} {v.model} (
                                        {v.license_plate})
                                    </option>
                                ))}
                            </Form.Select>
                            {vehicles.length === 0 && !vehiclesLoading && (
                                <Form.Text className="text-warning">
                                    No available fleet vehicles found.
                                </Form.Text>
                            )}
                        </Form.Group>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={onHide}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={assignMutation.isPending || !canSubmit}
                    >
                        {assignMutation.isPending ? 'Assigning…' : 'Assign'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

/* Record Payment Modal */
function RecordPaymentModal({
    bookingId,
    show,
    onHide,
}: {
    bookingId: string;
    show: boolean;
    onHide: () => void;
}) {
    const [method, setMethod] = useState<AirportPaymentMethod>('cash');
    const [reference, setReference] = useState('');
    const recordMutation = useRecordAirportBookingPayment();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        recordMutation.mutate(
            {
                id: bookingId,
                payload: {
                    payment_method: method,
                    payment_reference: reference || undefined,
                },
            },
            {
                onSuccess: () => {
                    onHide();
                    setMethod('cash');
                    setReference('');
                },
            }
        );
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title className="fs-6">Record Payment</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Payment Method</Form.Label>
                        <Form.Select
                            value={method}
                            onChange={e =>
                                setMethod(
                                    e.target.value as AirportPaymentMethod
                                )
                            }
                            required
                        >
                            <option value="cash">Cash</option>
                            <option value="mobile_money">Mobile Money</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="offline_transfer">
                                Offline Transfer
                            </option>
                        </Form.Select>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Reference (optional)</Form.Label>
                        <Form.Control
                            placeholder="Transaction reference"
                            value={reference}
                            onChange={e => setReference(e.target.value)}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={onHide}>
                        Cancel
                    </Button>
                    <Button
                        variant="success"
                        type="submit"
                        disabled={recordMutation.isPending}
                    >
                        {recordMutation.isPending
                            ? 'Recording…'
                            : 'Record Payment'}
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
    const cancelMutation = useCancelAirportBooking();

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
                        A cancellation fee may apply depending on how close to
                        the scheduled time this cancellation is made.
                    </p>
                    <Form.Group>
                        <Form.Label>Reason (optional)</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Reason for cancellation"
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
                            ? 'Cancelling…'
                            : 'Cancel Booking'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

/* Trip Records Card */
const ACTION_LABEL: Record<BookingRecord['action'], string> = {
    trip_started: 'Trip Started',
    trip_completed: 'Trip Completed',
};

const ACTION_VARIANT: Record<BookingRecord['action'], string> = {
    trip_started: 'info',
    trip_completed: 'success',
};

function TripRecordsCard({ records }: { records: BookingRecord[] }) {
    return (
        <Card className="mb-3 border-0 shadow-sm">
            <Card.Header className="bg-transparent border-bottom py-3">
                <Card.Title className="mb-0 fw-semibold">
                    Trip Records
                </Card.Title>
            </Card.Header>
            <Card.Body className="p-0">
                <table className="table table-sm mb-0">
                    <thead className="table-light">
                        <tr>
                            <th className="ps-3 small">Action</th>
                            <th className="small">Performed By</th>
                            <th className="pe-3 small">Date / Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map(r => (
                            <tr key={r.id}>
                                <td className="ps-3">
                                    <Badge
                                        bg={
                                            ACTION_VARIANT[r.action] ??
                                            'secondary'
                                        }
                                        className="small"
                                    >
                                        {ACTION_LABEL[r.action] ?? r.action}
                                    </Badge>
                                </td>
                                <td className="small">
                                    {r.performed_by?.name ?? '-'}
                                </td>
                                <td className="pe-3 small text-muted">
                                    {fmtDate(r.created_at)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card.Body>
        </Card>
    );
}

/* Main Component */
export default function AirportBookingDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    useTitle('Airport Booking Detail');

    const { data: res, isLoading, isError } = useAirportBooking(id!);

    const confirmMutation = useConfirmAirportBooking();
    const removeDriverMutation = useRemoveAirportBookingDriver();
    const startTripMutation = useStartAirportTrip();
    const completeTripMutation = useCompleteAirportTrip();
    const noShowMutation = useMarkAirportBookingNoShow();
    const refundMutation = useRefundAirportBooking();
    const sendPaymentLinkMutation = useSendAirportPaymentLink();

    const [assignTarget, setAssignTarget] = useState<AssignmentTarget | null>(
        null
    );
    const [showPayment, setShowPayment] = useState(false);
    const [showCancel, setShowCancel] = useState(false);
    const [showSendPaymentLinkConfirm, setShowSendPaymentLinkConfirm] =
        useState(false);

    const activeBranchId = useSelector(selectActiveBranchId);
    const { data: generalSettings } = useGeneralSettings();

    if (isLoading) {
        return <DetailPageSkeleton cards={3} />;
    }

    if (isError || !res?.data) {
        return <Alert variant="danger">Booking not found.</Alert>;
    }

    const b = res.data;

    const globalSymbol = generalSettings?.data?.currency_symbol ?? 'GHS';
    const showConverted =
        !!b.exchange_rate &&
        b.exchange_rate !== 1 &&
        (!activeBranchId || activeBranchId !== b.branch_id);

    const fmtA = (n: number): string =>
        b.currency_symbol
            ? formatWithSymbol(n, b.currency_symbol)
            : formatCurrency(n);

    const fmtADual = (n: number): string => {
        if (!showConverted || !b.exchange_rate) return fmtA(n);
        const globalAmt = n * b.exchange_rate;
        return `${fmtA(n)} / ${formatWithSymbol(globalAmt, globalSymbol)}`;
    };

    const bookingStatus = b.booking_status as AirportBookingStatus;
    const paymentStatus = b.payment_status as AirportPaymentStatus;

    const hasDriver = !!b.driver;
    const hasVehicle = !!b.vehicle;

    const canConfirm = bookingStatus === 'payment_received';
    const showAssignDriver =
        bookingStatus === 'confirmed' ||
        (bookingStatus === 'driver_assigned' && !hasDriver);
    const showAssignVehicle =
        bookingStatus === 'confirmed' ||
        (bookingStatus === 'driver_assigned' && !hasVehicle);
    const showAssignBoth = bookingStatus === 'confirmed';
    const canRemoveDriver = bookingStatus === 'driver_assigned';
    const canStartTrip =
        (bookingStatus === 'confirmed' ||
            bookingStatus === 'driver_assigned') &&
        hasDriver &&
        hasVehicle;
    const canCompleteTrip = bookingStatus === 'in_progress';
    const canCancel = b.is_cancellable;
    const canNoShow =
        bookingStatus === 'confirmed' || bookingStatus === 'driver_assigned';
    const canRecordPayment = paymentStatus === 'pending';
    const canSendPaymentLink =
        paymentStatus === 'pending' && !!b.airport_customer?.email;
    const canRefund = bookingStatus === 'cancelled' && paymentStatus === 'paid';

    const isTerminal = ['completed', 'cancelled', 'no_show'].includes(
        bookingStatus
    );

    return (
        <div className="pb-4">
            {/* Page Header */}
            <div className="page-titles mb-3 d-flex justify-content-between align-items-center">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <h4 className="mb-0">{b.booking_reference}</h4>
                        <Badge
                            bg={STATUS_VARIANT[bookingStatus] ?? 'secondary'}
                        >
                            {STATUS_LABEL[bookingStatus] ?? bookingStatus}
                        </Badge>
                    </div>
                    <small className="text-muted">
                        <FaPlane className="me-1" />
                        {b.direction === 'pickup'
                            ? 'Airport Pickup'
                            : 'Airport Dropoff'}
                        {b.airport ? ` - ${b.airport.name}` : ''}
                    </small>
                </div>
                <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() =>
                        navigate(
                            ROUTES.DASHBOARD.AIRPORT_TRANSFER.BOOKINGS.ROOT
                        )
                    }
                >
                    Back
                </button>
            </div>

            {/* Action Panel */}
            {!isTerminal && (
                <PermisssionGuard
                    permission={PERMISSIONS.AIRPORT_TRANSFER.MANAGE_BOOKINGS}
                >
                    <Card className="mb-3 border-0 shadow-sm">
                        <Card.Body className="py-2">
                            <div className="d-flex flex-wrap gap-2 align-items-center">
                                <span className="text-muted small fw-semibold me-2">
                                    Actions:
                                </span>

                                {canRecordPayment && (
                                    <Button
                                        variant="success"
                                        size="sm"
                                        onClick={() => setShowPayment(true)}
                                    >
                                        Record Payment
                                    </Button>
                                )}

                                {canSendPaymentLink && (
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        disabled={
                                            sendPaymentLinkMutation.isPending
                                        }
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

                                {canConfirm && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        disabled={confirmMutation.isPending}
                                        onClick={() =>
                                            confirmMutation.mutate(b.id)
                                        }
                                    >
                                        {confirmMutation.isPending
                                            ? 'Confirming…'
                                            : 'Confirm Booking'}
                                    </Button>
                                )}

                                {showAssignDriver && (
                                    <Button
                                        variant="warning"
                                        size="sm"
                                        onClick={() =>
                                            setAssignTarget('driver_only')
                                        }
                                    >
                                        Assign Driver
                                    </Button>
                                )}

                                {showAssignVehicle && (
                                    <Button
                                        variant="outline-warning"
                                        size="sm"
                                        onClick={() =>
                                            setAssignTarget('vehicle_only')
                                        }
                                    >
                                        Assign Vehicle
                                    </Button>
                                )}

                                {showAssignBoth && (
                                    <Button
                                        variant="warning"
                                        size="sm"
                                        onClick={() =>
                                            setAssignTarget(
                                                'driver_and_vehicle'
                                            )
                                        }
                                    >
                                        Assign Driver & Vehicle
                                    </Button>
                                )}

                                {canRemoveDriver && (
                                    <Button
                                        variant="outline-warning"
                                        size="sm"
                                        disabled={
                                            removeDriverMutation.isPending
                                        }
                                        onClick={() =>
                                            removeDriverMutation.mutate(b.id)
                                        }
                                    >
                                        {removeDriverMutation.isPending
                                            ? 'Removing…'
                                            : 'Remove Assignment'}
                                    </Button>
                                )}

                                {canStartTrip && (
                                    <Button
                                        variant="info"
                                        size="sm"
                                        disabled={startTripMutation.isPending}
                                        onClick={() =>
                                            startTripMutation.mutate(b.id)
                                        }
                                    >
                                        {startTripMutation.isPending
                                            ? 'Starting…'
                                            : 'Start Trip'}
                                    </Button>
                                )}

                                {canCompleteTrip && (
                                    <Button
                                        variant="success"
                                        size="sm"
                                        disabled={
                                            completeTripMutation.isPending
                                        }
                                        onClick={() =>
                                            completeTripMutation.mutate(b.id)
                                        }
                                    >
                                        {completeTripMutation.isPending
                                            ? 'Completing…'
                                            : 'Complete Trip'}
                                    </Button>
                                )}

                                {canNoShow && (
                                    <Button
                                        variant="dark"
                                        size="sm"
                                        disabled={noShowMutation.isPending}
                                        onClick={() =>
                                            noShowMutation.mutate(b.id)
                                        }
                                    >
                                        {noShowMutation.isPending
                                            ? '…'
                                            : 'Mark No-Show'}
                                    </Button>
                                )}

                                {canCancel && (
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => setShowCancel(true)}
                                    >
                                        Cancel Booking
                                    </Button>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </PermisssionGuard>
            )}

            {/* Cancellation info */}
            {bookingStatus === 'cancelled' && (
                <Alert variant="danger" className="mb-3">
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                        <div>
                            <div className="fw-semibold">Booking Cancelled</div>
                            {b.cancelled_at && (
                                <div className="small">
                                    Cancelled at: {fmtDate(b.cancelled_at)}
                                    {b.cancelled_by &&
                                        ` by ${b.cancelled_by.name}`}
                                </div>
                            )}
                            {b.cancellation_fee_applied != null && (
                                <div className="small">
                                    Cancellation fee:{' '}
                                    {fmtADual(b.cancellation_fee_applied)}
                                </div>
                            )}
                        </div>
                        {canRefund && (
                            <Button
                                variant="outline-info"
                                size="sm"
                                disabled={refundMutation.isPending}
                                onClick={() => refundMutation.mutate(b.id)}
                            >
                                {refundMutation.isPending
                                    ? 'Marking...'
                                    : 'Mark as Refunded'}
                            </Button>
                        )}
                    </div>
                </Alert>
            )}

            <Row className="g-3 align-items-start">
                {/* Left column */}
                <Col lg={8}>
                    {/* Booking Details */}
                    <Card className="mb-3 border-0 shadow-sm">
                        <Card.Header className="bg-transparent border-bottom py-3">
                            <Card.Title className="mb-0 fw-semibold">
                                Booking Details
                            </Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <InfoRow
                                label="Reference"
                                value={b.booking_reference}
                            />
                            <InfoRow
                                label="Direction"
                                value={
                                    b.direction === 'pickup'
                                        ? 'Airport Pickup'
                                        : 'Airport Dropoff'
                                }
                            />
                            <InfoRow
                                label="Airport"
                                value={
                                    b.airport
                                        ? `${b.airport.name}${b.airport.city ? `, ${b.airport.city}` : ''}`
                                        : null
                                }
                            />
                            <InfoRow
                                label="Terminal"
                                value={b.terminal_location?.name}
                            />
                            <InfoRow
                                label="Area / Drop-off Zone"
                                value={b.area_location?.name}
                            />
                            {b.specific_address && (
                                <InfoRow
                                    label="Specific Address"
                                    value={b.specific_address}
                                />
                            )}
                            <InfoRow
                                label="Scheduled At"
                                value={fmtDate(b.scheduled_at)}
                            />
                            <InfoRow label="Package" value={b.package?.name} />
                            <InfoRow label="Branch" value={b.branch?.name} />
                            <InfoRow
                                label="Source"
                                value={
                                    b.booking_source === 'staff'
                                        ? 'Staff'
                                        : 'Online'
                                }
                            />
                            <InfoRow
                                label="Created"
                                value={
                                    <>
                                        {fmtDate(b.created_at)}
                                        {b.created_by && (
                                            <span className="text-muted">
                                                {' '}
                                                by {b.created_by.name}
                                            </span>
                                        )}
                                    </>
                                }
                            />
                        </Card.Body>
                    </Card>

                    {/* Passenger & Flight Details */}
                    <Card className="mb-3 border-0 shadow-sm">
                        <Card.Header className="bg-transparent border-bottom py-3">
                            <Card.Title className="mb-0 fw-semibold">
                                Passenger & Flight Details
                            </Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <InfoRow
                                label="Passenger Name"
                                value={b.passenger_name}
                            />
                            <InfoRow
                                label="Passenger Phone"
                                value={b.passenger_phone}
                            />
                            <InfoRow
                                label="Passengers"
                                value={b.passenger_count}
                            />
                            <InfoRow
                                label="Flight Number"
                                value={b.flight_number}
                            />
                            <InfoRow label="Airline" value={b.airline} />
                        </Card.Body>
                    </Card>

                    {/* Trip Records */}
                    {b.booking_records && b.booking_records.length > 0 && (
                        <TripRecordsCard records={b.booking_records} />
                    )}
                </Col>

                {/* Right column */}
                <Col lg={4}>
                    {/* Customer */}
                    <Card className="mb-3 border-0 shadow-sm">
                        <Card.Header className="bg-transparent border-bottom py-3">
                            <Card.Title className="mb-0 fw-semibold">
                                Customer
                            </Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <InfoRow
                                label="Name"
                                value={b.airport_customer?.full_name}
                            />
                            <InfoRow
                                label="Email"
                                value={b.airport_customer?.email}
                            />
                            <InfoRow
                                label="Phone"
                                value={b.airport_customer?.phone}
                            />
                        </Card.Body>
                    </Card>

                    {/* Driver & Vehicle */}
                    <Card className="mb-3 border-0 shadow-sm">
                        <Card.Header className="bg-transparent border-bottom py-3">
                            <Card.Title className="mb-0 fw-semibold">
                                Driver & Vehicle
                            </Card.Title>
                        </Card.Header>
                        <Card.Body>
                            {b.driver ? (
                                <>
                                    <InfoRow
                                        label="Driver"
                                        value={b.driver.name}
                                    />
                                    <InfoRow
                                        label="Driver Phone"
                                        value={b.driver.phone}
                                    />
                                </>
                            ) : (
                                <p className="text-muted small mb-0">
                                    No driver assigned yet.
                                </p>
                            )}
                            {b.vehicle && (
                                <>
                                    <InfoRow
                                        label="Vehicle"
                                        value={`${b.vehicle.make} ${b.vehicle.model}`}
                                    />
                                    <InfoRow
                                        label="Plate"
                                        value={b.vehicle.license_plate}
                                    />
                                    <InfoRow
                                        label="Color"
                                        value={b.vehicle.color}
                                    />
                                </>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Pricing Breakdown */}
                    <Card className="mb-3 border-0 shadow-sm">
                        <Card.Header className="bg-transparent border-bottom py-3">
                            <Card.Title className="mb-0 fw-semibold">
                                Pricing Breakdown
                            </Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <InfoRow
                                label="Package Rate"
                                value={fmtADual(b.package_rate_snapshot)}
                            />
                            <InfoRow
                                label="Area Charge"
                                value={fmtADual(b.area_charge_snapshot)}
                            />
                            {b.coupon_discount_snapshot > 0 && (
                                <InfoRow
                                    label="Coupon Discount"
                                    value={`-${fmtADual(b.coupon_discount_snapshot)}`}
                                />
                            )}
                            <InfoRow
                                label={`VAT (${b.vat_rate_snapshot}%)`}
                                value={fmtADual(b.vat_amount)}
                            />
                            <div className="d-flex justify-content-between py-2 mt-1">
                                <span className="fw-bold">Total</span>
                                <span className="fw-bold text-primary fs-6">
                                    {fmtADual(b.total_amount)}
                                </span>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Payment Status */}
                    <Card className="mb-3 border-0 shadow-sm">
                        <Card.Header className="bg-transparent border-bottom py-3">
                            <Card.Title className="mb-0 fw-semibold">
                                Payment
                            </Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <div className="mb-2">
                                <Badge
                                    bg={
                                        PAYMENT_VARIANT[paymentStatus] ??
                                        'secondary'
                                    }
                                >
                                    {PAYMENT_LABEL[paymentStatus] ??
                                        paymentStatus}
                                </Badge>
                            </div>
                            <InfoRow
                                label="Method"
                                value={
                                    b.payment_method
                                        ? formatStatus(b.payment_method)
                                        : null
                                }
                            />
                            <InfoRow
                                label="Reference"
                                value={b.payment_reference}
                            />
                        </Card.Body>
                    </Card>

                    {/* Staff Notes */}
                    {b.staff_notes && (
                        <Card className="mb-3 border-0 shadow-sm">
                            <Card.Header className="bg-transparent border-bottom py-3">
                                <Card.Title className="mb-0 fw-semibold">
                                    Staff Notes
                                </Card.Title>
                            </Card.Header>
                            <Card.Body>
                                <p className="mb-0 small">{b.staff_notes}</p>
                            </Card.Body>
                        </Card>
                    )}
                </Col>
            </Row>

            {/* Transaction History */}
            <TransactionHistorySection bookingId={b.id} />

            {/* Modals */}
            {assignTarget && (
                <AssignModal
                    bookingId={b.id}
                    target={assignTarget}
                    show={!!assignTarget}
                    onHide={() => setAssignTarget(null)}
                />
            )}
            <RecordPaymentModal
                bookingId={b.id}
                show={showPayment}
                onHide={() => setShowPayment(false)}
            />
            <CancelModal
                bookingId={b.id}
                show={showCancel}
                onHide={() => setShowCancel(false)}
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
                            {b.airport_customer?.full_name ?? b.passenger_name}
                        </strong>
                        {b.airport_customer?.email && (
                            <>
                                {' '}
                                at <strong>{b.airport_customer.email}</strong>
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
                                {fmtADual(b.total_amount ?? 0)}
                            </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted small">Reference</span>
                            <span className="fw-semibold small">
                                {b.booking_reference}
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
                            sendPaymentLinkMutation.mutate(b.id);
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
