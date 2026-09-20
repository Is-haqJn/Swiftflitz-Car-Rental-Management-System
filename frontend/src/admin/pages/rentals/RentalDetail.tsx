import { Fragment, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiExternalLink } from 'react-icons/fi';
import { FaCheck, FaXmark, FaPause, FaPlay } from 'react-icons/fa6';
import {
    Row,
    Col,
    Card,
    Badge,
    Button,
    Spinner,
    Alert,
    Modal,
    Form,
} from 'react-bootstrap';
import { DetailPageSkeleton } from '@adminComponents/skeletons/DetailPageSkeleton';
import { useForm, Controller } from 'react-hook-form';
import { useTusMultiUpload } from '@/shared/hooks/useTusMultiUpload';
import { useTitle } from '@/shared/hooks';
import {
    useCancellationSettings,
    useCurrency,
    useEarlyReturnSettings,
    useFormatCurrency,
    useGeneralSettings,
} from '@/shared/hooks/queries/useSettings';
import { useAppSelector } from '@/store';
import { selectActiveBranchId } from '@/store/slices/activeBranchSlice';
import { ROUTES } from '@/shared/routes';
import {
    formatDate,
    formatDateTime,
    formatStatus,
    formatTime,
} from '@/shared/libs/utils';
import { formatWithSymbol } from '@/shared/libs/currency';
import {
    useRental,
    useConfirmRental,
    useProcessPickup,
    useProcessReturn,
    useApproveReturn,
    useCancelRental,
    useCancelPreview,
    useSettleRental,
    useSettleDamage,
    useRecordRepairCost,
    useCollectDamageBalance,
    useCollectDeposit,
    useRefundDeposit,
    useSettleWithDeposit,
    useDeleteRental,
    useSettleRefund,
    useSendPaymentLink,
    useSendDamagePaymentLink,
    useSendDepositPaymentLink,
    useUploadPickupVideos,
    useUploadReturnVideos,
} from '@/shared/hooks/queries/useRentals';
import {
    useRequestReupload,
    useSendCompleteProfileLink,
} from '@/shared/hooks/queries/useCustomers';
import type {
    Rental,
    RentalStatus,
    ProcessPickupData,
    ProcessReturnData,
    SettleRentalData,
    SettleDamageData,
    RecordRepairCostData,
    CancelRentalData,
    SettleRefundData,
    ApproveReturnData,
} from '@/shared/types/rental.types';
import InspectionComparisonCard from './RentalInspections/InspectionComparisonCard';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';
import { useTransactions } from '@/shared/hooks/queries/useTransactions';
import type {
    Transaction,
    TransactionStatus,
    TransactionType,
} from '@/shared/types/transaction.types';
import SwitchVehicleModal from './SwitchVehicleModal';
import ExtendRentalModal from './ExtendRentalModal';
import EditRentalModal from './EditRentalModal';
import CustomerProfilePreviewModal from './CustomerProfilePreviewModal';

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

function TransactionHistorySection({ rentalId }: { rentalId: string }) {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const formatCurrency = useFormatCurrency();
    const { data: generalSettings } = useGeneralSettings();
    const globalSymbol = generalSettings?.data?.currency_symbol ?? 'GHS';
    const activeBranchId = useAppSelector(selectActiveBranchId);

    const { data, isLoading } = useTransactions({
        'filter[transactable_type]': 'rental',
        'filter[transactable_id]': rentalId,
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
                                                className={`fw-bold rental-tx-amount${tx.status === 'paid' ? ' rental-tx-amount--paid' : ''}`}
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

/* Status helpers */
const STATUS_COLORS: Record<RentalStatus, string> = {
    pending: 'secondary',
    confirmed: 'info',
    active: 'success',
    overdue: 'danger',
    returned: 'warning',
    completed: 'dark',
    cancelled: 'light',
};

const STATUS_LABELS: Record<RentalStatus, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    active: 'Active',
    overdue: 'Overdue',
    returned: 'Pending Approval',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

/* Info row helper (dl-based, compact) */
function InfoRow({
    label,
    value,
    highlight,
}: {
    label: string;
    value: React.ReactNode;
    highlight?: boolean;
}) {
    return (
        <>
            <dt
                className="col-5 fw-normal text-muted"
                style={{ fontSize: '0.8rem' }}
            >
                {label}
            </dt>
            <dd
                className={`col-7 text-end mb-0 ${highlight ? 'fw-semibold' : ''}`}
                style={{ fontSize: '0.82rem' }}
            >
                {value ?? <span className="text-muted">-</span>}
            </dd>
        </>
    );
}

/* Confirm Modal */
function ConfirmModal({
    show,
    title,
    message,
    onConfirm,
    onCancel,
    isPending,
    variant = 'primary',
}: {
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isPending: boolean;
    variant?: string;
}) {
    return (
        <Modal show={show} onHide={onCancel} centered>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{message}</Modal.Body>
            <Modal.Footer>
                <Button variant="light" onClick={onCancel} disabled={isPending}>
                    Cancel
                </Button>
                <Button
                    variant={variant}
                    onClick={onConfirm}
                    disabled={isPending}
                >
                    {isPending ? (
                        <Spinner animation="border" size="sm" />
                    ) : (
                        'Confirm'
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

/* Fuel Level Selector */
const FUEL_LEVELS = [
    { value: 'empty', label: 'Empty', variant: 'outline-danger' },
    { value: 'quarter', label: '¼', variant: 'outline-warning' },
    { value: 'half', label: '½', variant: 'outline-warning' },
    { value: 'three_quarter', label: '¾', variant: 'outline-success' },
    { value: 'full', label: 'Full', variant: 'outline-success' },
] as const;

const FUEL_LEVELS_ACTIVE = [
    { value: 'empty', label: 'Empty', variant: 'danger' },
    { value: 'quarter', label: '¼', variant: 'warning' },
    { value: 'half', label: '½', variant: 'warning' },
    { value: 'three_quarter', label: '¾', variant: 'success' },
    { value: 'full', label: 'Full', variant: 'success' },
] as const;

function FuelLevelSelector({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div>
            <Form.Label>Fuel Level</Form.Label>
            <div className="btn-group w-100" role="group">
                {FUEL_LEVELS.map((level, i) => {
                    const active = FUEL_LEVELS_ACTIVE[i];
                    const isSelected = value === level.value;
                    return (
                        <Button
                            key={level.value}
                            type="button"
                            variant={
                                isSelected ? active.variant : level.variant
                            }
                            onClick={() => onChange(level.value)}
                            className="fw-semibold"
                        >
                            {level.label}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}

/* Inspection Photo Upload */
function InspectionPhotoUpload({
    tus,
    onFilesSelected,
    label = 'Photos',
    accept = 'image/jpeg,image/png,image/webp',
    helpText,
    buttonLabel,
}: {
    tus: ReturnType<typeof useTusMultiUpload>;
    onFilesSelected: (files: File[]) => void;
    label?: string;
    accept?: string;
    helpText?: string;
    buttonLabel?: string;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previews, setPreviews] = useState<
        { id: string; url: string; isVideo: boolean; name: string }[]
    >([]);
    const isVideoMode = accept.startsWith('video/');
    const resolvedButtonLabel =
        buttonLabel ?? (isVideoMode ? 'Add Videos' : 'Add Photos');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files ?? []);
        if (!selected.length) return;
        const tusIds = tus.addFiles(selected);
        const newPreviews = selected.map((f, i) => ({
            id: tusIds[i],
            url: isVideoMode ? '' : URL.createObjectURL(f),
            isVideo: isVideoMode,
            name: f.name,
        }));
        setPreviews(prev => [...prev, ...newPreviews]);
        onFilesSelected(selected);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemove = (fileId: string, previewUrl: string) => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviews(prev => prev.filter(p => p.id !== fileId));
        tus.removeFile(fileId);
    };

    useEffect(() => {
        return () => {
            previews.forEach(p => { if (p.url) URL.revokeObjectURL(p.url); });
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div>
            <Form.Label>{label}</Form.Label>
            {previews.length > 0 && (
                <div className="d-flex flex-wrap gap-2 mb-2">
                    {previews.map(p => (
                        <div
                            key={p.id}
                            style={{
                                position: 'relative',
                                width: 72,
                                height: 72,
                            }}
                        >
                            {p.isVideo ? (
                                <div
                                    className="d-flex flex-column align-items-center justify-content-center text-muted small"
                                    style={{
                                        width: 72,
                                        height: 72,
                                        borderRadius: 6,
                                        border: '1px solid #dee2e6',
                                        background: '#f8f9fa',
                                        overflow: 'hidden',
                                        padding: '4px 2px',
                                        textAlign: 'center',
                                    }}
                                >
                                    <span style={{ fontSize: 20 }}>🎬</span>
                                    <span
                                        className="text-truncate w-100"
                                        style={{ fontSize: 9 }}
                                    >
                                        {p.name}
                                    </span>
                                </div>
                            ) : (
                                <img
                                    src={p.url}
                                    alt="preview"
                                    style={{
                                        width: 72,
                                        height: 72,
                                        objectFit: 'cover',
                                        borderRadius: 6,
                                        border: '1px solid #dee2e6',
                                    }}
                                />
                            )}
                            <button
                                type="button"
                                onClick={() => handleRemove(p.id, p.url)}
                                style={{
                                    position: 'absolute',
                                    top: -6,
                                    right: -6,
                                    background: '#dc3545',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: 18,
                                    height: 18,
                                    fontSize: 11,
                                    lineHeight: '18px',
                                    cursor: 'pointer',
                                    padding: 0,
                                }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
            {tus.files.length > 0 && (
                <div className="mb-2">
                    {tus.files.map(f => (
                        <div
                            key={f.id}
                            className="d-flex align-items-center gap-2 small text-muted mb-1"
                        >
                            <span
                                className="text-truncate"
                                style={{ maxWidth: 160 }}
                            >
                                {f.file.name}
                            </span>
                            {(f.status === 'uploading' || f.status === 'paused') && (
                                <>
                                    <div
                                        className="progress flex-grow-1"
                                        style={{ height: 6 }}
                                    >
                                        <div
                                            className={`progress-bar${f.status === 'paused' ? ' bg-warning' : ''}`}
                                            style={{ width: `${f.percent}%` }}
                                        />
                                    </div>
                                    <span style={{ minWidth: 32, textAlign: 'right' }}>
                                        {f.percent}%
                                    </span>
                                </>
                            )}
                            {f.status === 'success' && (
                                <span className="text-success flex-grow-1">
                                    <FaCheck />
                                </span>
                            )}
                            {f.status === 'error' && (
                                <span className="text-danger flex-grow-1">
                                    <FaXmark /> {f.error}
                                </span>
                            )}
                            {f.status === 'pending' && (
                                <span className="flex-grow-1 text-muted fst-italic">
                                    queued
                                </span>
                            )}
                            {/* Pause / Resume */}
                            {f.status === 'uploading' && (
                                <button
                                    type="button"
                                    title="Pause"
                                    onClick={() => tus.pauseFile(f.id)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        padding: '0 2px',
                                        cursor: 'pointer',
                                        color: '#6c757d',
                                        lineHeight: 1,
                                    }}
                                >
                                    <FaPause size={11} />
                                </button>
                            )}
                            {f.status === 'paused' && (
                                <button
                                    type="button"
                                    title="Resume"
                                    onClick={() => tus.resumeFile(f.id)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        padding: '0 2px',
                                        cursor: 'pointer',
                                        color: '#0d6efd',
                                        lineHeight: 1,
                                    }}
                                >
                                    <FaPlay size={11} />
                                </button>
                            )}
                            {/* Cancel */}
                            {(f.status === 'uploading' ||
                                f.status === 'paused' ||
                                f.status === 'pending' ||
                                f.status === 'error') && (
                                <button
                                    type="button"
                                    title="Cancel"
                                    onClick={() => tus.removeFile(f.id)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        padding: '0 2px',
                                        cursor: 'pointer',
                                        color: '#dc3545',
                                        lineHeight: 1,
                                    }}
                                >
                                    <FaXmark size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
            <div className="d-flex gap-2">
                <Button
                    type="button"
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {resolvedButtonLabel}
                </Button>
            </div>
            {helpText && (
                <Form.Text className="text-muted">{helpText}</Form.Text>
            )}
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                multiple
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
        </div>
    );
}

const DAMAGE_TYPES = [
    'scratch',
    'dent',
    'broken glass',
    'flat tire',
    'body damage',
    'interior damage',
    'bumper damage',
    'mirror damage',
    'mechanical',
    'other',
];

/* Pickup Modal */
interface PickupForm {
    fuel_level: string;
    mileage: string;
    condition_notes: string;
    damage_noted: boolean;
    damage_types: string[];
    damage_severity: string;
    damage_description: string;
    early_pickup_option: 'shift_return_date' | 'keep_return_date';
    late_pickup_fee: string;
    amount_paid: string;
    collect_deposit: boolean;
}

function PickupModal({
    show,
    onClose,
    rental,
    formatCurrency: formatCurrencyProp,
}: {
    show: boolean;
    onClose: () => void;
    rental: Rental;
    formatCurrency?: (n: number) => string;
}) {
    const formatCurrencyFallback = useFormatCurrency();
    const formatCurrency = formatCurrencyProp ?? formatCurrencyFallback;
    const pickupMutation = useProcessPickup();
    const uploadPickupVideosMutation = useUploadPickupVideos();
    const tus = useTusMultiUpload({
        endpoint: '/api/v1/uploads/tus',
        entityType: 'rental_inspection_image',
    });
    const videoTus = useTusMultiUpload({
        endpoint: '/api/v1/uploads/tus',
        entityType: 'rental_video',
    });
    const { register, handleSubmit, reset, watch, control, setValue } =
        useForm<PickupForm>({
            defaultValues: {
                fuel_level: 'full',
                mileage: '',
                condition_notes: '',
                damage_noted: false,
                damage_types: [],
                damage_severity: '',
                damage_description: '',
                early_pickup_option: 'shift_return_date' as const,
                late_pickup_fee: '',
                amount_paid: '',
                collect_deposit: false,
            },
        });

    const pendingSubmitRef = useRef<PickupForm | null>(null);
    const damageNoted = watch('damage_noted');

    // Detect early pickup: scheduled pickup date is in the future
    const scheduledPickup = new Date(rental.pickup_date);
    scheduledPickup.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const earlyPickupDays = Math.round(
        (scheduledPickup.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isEarlyPickup = earlyPickupDays > 0;

    // Approximate extra cost for Scenario A (keep return date)
    const approxExtraBase = isEarlyPickup
        ? earlyPickupDays * rental.daily_rate
        : 0;
    const vatRatio =
        rental.subtotal > 0 && rental.vat_amount != null
            ? rental.vat_amount / rental.subtotal
            : 0;
    const approxExtraTotal = isEarlyPickup
        ? Math.round(approxExtraBase * (1 + vatRatio) * 100) / 100
        : 0;

    const newShiftedReturnDate = isEarlyPickup
        ? (() => {
              const d = new Date(rental.return_date);
              d.setDate(d.getDate() - earlyPickupDays);
              return d.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
              });
          })()
        : null;

    const showDepositCheckbox =
        !rental.skip_security_deposit &&
        rental.security_deposit_status === 'pending' &&
        (rental.security_deposit_amount ?? 0) > 0;

    useEffect(() => {
        if (!show) return;
        reset({
            fuel_level: 'full',
            mileage: '',
            condition_notes: '',
            damage_noted: false,
            damage_types: [],
            damage_severity: '',
            damage_description: '',
            early_pickup_option: 'shift_return_date',
            late_pickup_fee: '',
            amount_paid: '',
            collect_deposit: false,
        });
        pendingSubmitRef.current = null;
        tus.clearAll();
        videoTus.clearAll();
    }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-submit once all pending uploads (photos + videos) finish
    useEffect(() => {
        if (!pendingSubmitRef.current) return;
        if (tus.isUploading || tus.hasPending) return;
        if (videoTus.isUploading || videoTus.hasPending) return;
        const hasPaused =
            tus.files.some(f => f.status === 'paused') ||
            videoTus.files.some(f => f.status === 'paused');
        if (hasPaused) return;
        const data = pendingSubmitRef.current;
        pendingSubmitRef.current = null;
        doPickupSubmit(data);
    }, [tus.isUploading, tus.hasPending, tus.files, videoTus.isUploading, videoTus.hasPending, videoTus.files]); // eslint-disable-line react-hooks/exhaustive-deps

    const doPickupSubmit = (data: PickupForm) => {
        const tokens = tus.getUploadTokens();
        const videoTokens = videoTus.getUploadTokens();
        const payload: ProcessPickupData = {
            fuel_level: data.fuel_level || undefined,
            mileage: data.mileage ? Number(data.mileage) : undefined,
            condition_notes: data.condition_notes || undefined,
            damage_noted: data.damage_noted,
            damage_types:
                data.damage_noted && data.damage_types.length > 0
                    ? data.damage_types
                    : undefined,
            damage_severity:
                data.damage_noted && data.damage_severity
                    ? data.damage_severity
                    : undefined,
            damage_description:
                data.damage_noted && data.damage_description
                    ? data.damage_description
                    : undefined,
            early_pickup_option: isEarlyPickup
                ? data.early_pickup_option
                : undefined,
            late_pickup_fee: data.late_pickup_fee
                ? Number(data.late_pickup_fee)
                : undefined,
            photo_tus_tokens: tokens.length > 0 ? tokens : undefined,
            amount_paid: data.amount_paid
                ? Number(data.amount_paid)
                : undefined,
            collect_deposit: data.collect_deposit || undefined,
        };
        pickupMutation.mutate(
            { id: rental.id, data: payload },
            {
                onSuccess: () => {
                    tus.clearAll();
                    videoTus.clearAll();
                    if (videoTokens.length > 0) {
                        uploadPickupVideosMutation.mutate({
                            id: rental.id,
                            videoTusTokens: videoTokens,
                        });
                    }
                    reset();
                    onClose();
                },
            }
        );
    };

    const onSubmit = (data: PickupForm) => {
        if (tus.isUploading || videoTus.isUploading) return;
        const hasPaused =
            tus.files.some(f => f.status === 'paused') ||
            videoTus.files.some(f => f.status === 'paused');
        if (hasPaused) return;
        if (tus.hasPending || videoTus.hasPending) {
            pendingSubmitRef.current = data;
            if (tus.hasPending) tus.startAll();
            if (videoTus.hasPending) videoTus.startAll();
            return;
        }
        doPickupSubmit(data);
    };

    return (
        <Modal
            show={show}
            onHide={onClose}
            centered
            size="lg"
            backdrop={tus.isUploading || tus.hasPending || videoTus.isUploading || videoTus.hasPending || tus.files.some(f => f.status === 'paused') || videoTus.files.some(f => f.status === 'paused') ? 'static' : true}
            keyboard={!(tus.isUploading || tus.hasPending || videoTus.isUploading || videoTus.hasPending || tus.files.some(f => f.status === 'paused') || videoTus.files.some(f => f.status === 'paused'))}
        >
            <Modal.Header closeButton>
                <Modal.Title>Process Pickup</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Modal.Body>
                    {isEarlyPickup && (
                        <div className="alert alert-warning mb-3 p-3">
                            <div className="fw-semibold mb-2">
                                Early Pickup - {earlyPickupDays} day
                                {earlyPickupDays !== 1 ? 's' : ''} ahead of
                                schedule
                            </div>
                            <div className="mb-2 small text-muted">
                                Scheduled pickup:{' '}
                                <strong>
                                    {formatDate(rental.pickup_date)}
                                </strong>
                                &nbsp;·&nbsp; Original return:{' '}
                                <strong>
                                    {formatDate(rental.return_date)}
                                </strong>
                            </div>
                            <div className="d-flex flex-column gap-2">
                                <Form.Check
                                    type="radio"
                                    id="early_option_shift"
                                    label={
                                        <span>
                                            <strong>
                                                Shift return date to{' '}
                                                {newShiftedReturnDate}
                                            </strong>
                                            <span className="text-muted ms-1 small">
                                                - keep {rental.rental_days}{' '}
                                                days, no extra charge
                                            </span>
                                        </span>
                                    }
                                    value="shift_return_date"
                                    {...register('early_pickup_option')}
                                />
                                <Form.Check
                                    type="radio"
                                    id="early_option_keep"
                                    label={
                                        <span>
                                            <strong>
                                                Keep original return date (
                                                {new Date(
                                                    rental.return_date
                                                ).toLocaleDateString('en-GB', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                                )
                                            </strong>
                                            <span className="text-muted ms-1 small">
                                                -{' '}
                                                {rental.rental_days +
                                                    earlyPickupDays}{' '}
                                                days total, approx. +
                                                {formatCurrency(
                                                    approxExtraTotal
                                                )}{' '}
                                                extra
                                            </span>
                                        </span>
                                    }
                                    value="keep_return_date"
                                    {...register('early_pickup_option')}
                                />
                            </div>
                        </div>
                    )}
                    <Row className="g-3">
                        <Col md={12}>
                            <Controller
                                name="fuel_level"
                                control={control}
                                render={({ field }) => (
                                    <FuelLevelSelector
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Mileage (km)</Form.Label>
                                <Form.Control
                                    type="number"
                                    min={0}
                                    {...register('mileage')}
                                />
                                <Form.Text className="text-muted">
                                    Current odometer reading at pickup.
                                </Form.Text>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Late Pickup Fee</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    placeholder="0.00"
                                    {...register('late_pickup_fee')}
                                />
                                <Form.Text className="text-muted">
                                    Extra charge if customer picked up later
                                    than scheduled.
                                </Form.Text>
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Condition Notes</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    {...register('condition_notes')}
                                />
                                <Form.Text className="text-muted">
                                    Note any pre-existing marks, scratches, or
                                    observations before the customer drives off.
                                </Form.Text>
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <InspectionPhotoUpload
                                tus={tus}
                                onFilesSelected={() => {}}
                            />
                        </Col>
                        <Col md={12}>
                            <InspectionPhotoUpload
                                tus={videoTus}
                                onFilesSelected={() => {}}
                                label="Pickup Videos"
                                accept="video/mp4,video/quicktime,video/webm"
                                helpText="Record the vehicle condition at pickup (mp4, mov, webm)."
                            />
                        </Col>
                        <Col md={12}>
                            <Form.Check
                                type="switch"
                                id="pickup_damage_noted"
                                label="Damage noted at pickup"
                                {...register('damage_noted')}
                            />
                        </Col>
                        {damageNoted && (
                            <>
                                <Col md={12}>
                                    <Form.Label className="mb-1">
                                        Damage Types
                                    </Form.Label>
                                    <div className="d-flex flex-wrap gap-2">
                                        {DAMAGE_TYPES.map(dt => (
                                            <Form.Check
                                                key={dt}
                                                inline
                                                type="checkbox"
                                                id={`pickup_damage_type_${dt}`}
                                                label={
                                                    dt.charAt(0).toUpperCase() +
                                                    dt.slice(1)
                                                }
                                                value={dt}
                                                {...register('damage_types')}
                                            />
                                        ))}
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Severity</Form.Label>
                                        <div className="d-flex gap-3">
                                            {(
                                                [
                                                    'minor',
                                                    'moderate',
                                                    'severe',
                                                ] as const
                                            ).map(s => (
                                                <Form.Check
                                                    key={s}
                                                    type="radio"
                                                    id={`pickup_severity_${s}`}
                                                    label={
                                                        s
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                        s.slice(1)
                                                    }
                                                    value={s}
                                                    {...register(
                                                        'damage_severity'
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </Form.Group>
                                </Col>
                                <Col md={12}>
                                    <Form.Group>
                                        <Form.Label>
                                            Damage Description
                                        </Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            placeholder="Describe the damage…"
                                            {...register('damage_description')}
                                        />
                                    </Form.Group>
                                </Col>
                            </>
                        )}

                        {/* Payment + Deposit at Pickup */}
                        {(rental.amount_due > 0 || showDepositCheckbox) && (
                            <Col md={12}>
                                <hr className="my-1" />
                                <p className="small fw-semibold mb-2 text-muted text-uppercase">
                                    Collect at Pickup
                                </p>
                                <Row className="g-3">
                                    {rental.amount_due > 0 && (
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="d-flex justify-content-between w-100">
                                                    Amount Collected
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="p-0 small"
                                                        onClick={() =>
                                                            setValue(
                                                                'amount_paid',
                                                                rental.amount_due.toString()
                                                            )
                                                        }
                                                    >
                                                        Collect full
                                                    </Button>
                                                </Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    step="0.01"
                                                    min={0}
                                                    max={rental.amount_due}
                                                    placeholder="0.00"
                                                    {...register('amount_paid')}
                                                />
                                                <Form.Text className="text-muted">
                                                    Outstanding:{' '}
                                                    {formatCurrency(
                                                        rental.amount_due
                                                    )}
                                                </Form.Text>
                                            </Form.Group>
                                        </Col>
                                    )}
                                    {showDepositCheckbox && (
                                        <Col
                                            md={6}
                                            className="d-flex align-items-center pt-2"
                                        >
                                            <Form.Check
                                                type="checkbox"
                                                id="collect_deposit"
                                                label={`Deposit collected (${formatCurrency(rental.security_deposit_amount ?? 0)})`}
                                                {...register('collect_deposit')}
                                            />
                                        </Col>
                                    )}
                                </Row>
                            </Col>
                        )}
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="light"
                        onClick={onClose}
                        disabled={pickupMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={
                            pickupMutation.isPending ||
                            tus.isUploading ||
                            videoTus.isUploading ||
                            tus.files.some(f => f.status === 'paused') ||
                            videoTus.files.some(f => f.status === 'paused')
                        }
                    >
                        {pickupMutation.isPending ? (
                            <Spinner animation="border" size="sm" />
                        ) : tus.isUploading ? (
                            'Uploading photos…'
                        ) : videoTus.isUploading ? (
                            'Uploading videos…'
                        ) : tus.files.some(f => f.status === 'paused') || videoTus.files.some(f => f.status === 'paused') ? (
                            'Resume uploads to continue'
                        ) : (
                            'Process Pickup'
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

/* Return Modal */
interface ReturnForm {
    fuel_level: string;
    mileage: string;
    condition_notes: string;
    damage_noted: boolean;
    damage_types: string[];
    damage_severity: string;
    damage_description: string;
    estimated_repair_cost: string;
    early_return_reason: string;
    waive_early_return_charge: boolean;
    early_return_charge_waiver_reason: string;
    amount_paid: string;
}

function ReturnModal({
    show,
    onClose,
    rental,
    formatCurrency: formatCurrencyProp,
}: {
    show: boolean;
    onClose: () => void;
    rental: Rental;
    formatCurrency?: (n: number) => string;
}) {
    const formatCurrencyFallback = useFormatCurrency();
    const formatCurrency = formatCurrencyProp ?? formatCurrencyFallback;
    const returnMutation = useProcessReturn();
    const uploadReturnVideosMutation = useUploadReturnVideos();
    const { data: earlyReturnSettingsRes } = useEarlyReturnSettings();
    const earlyReturnSettings = earlyReturnSettingsRes?.data;
    const tus = useTusMultiUpload({
        endpoint: '/api/v1/uploads/tus',
        entityType: 'rental_inspection_image',
    });
    const videoTus = useTusMultiUpload({
        endpoint: '/api/v1/uploads/tus',
        entityType: 'rental_video',
    });
    const { register, handleSubmit, watch, reset, control, setValue } =
        useForm<ReturnForm>({
            defaultValues: {
                fuel_level: 'full',
                mileage: '',
                condition_notes: '',
                damage_noted: false,
                damage_types: [],
                damage_severity: '',
                damage_description: '',
                estimated_repair_cost: '',
                early_return_reason: '',
                waive_early_return_charge: false,
                early_return_charge_waiver_reason: '',
                amount_paid: '',
            },
        });

    useEffect(() => {
        if (!show) return;
        reset({
            fuel_level: 'full',
            mileage: '',
            condition_notes: '',
            damage_noted: false,
            damage_types: [],
            damage_severity: '',
            damage_description: '',
            estimated_repair_cost: '',
            early_return_reason: '',
            waive_early_return_charge: false,
            early_return_charge_waiver_reason: '',
            amount_paid: '',
        });
        pendingReturnSubmitRef.current = null;
        tus.clearAll();
        videoTus.clearAll();
    }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

    const damageNoted = watch('damage_noted');
    const waiveEarlyReturnCharge = watch('waive_early_return_charge');

    // Early return detection
    const scheduledReturn = new Date(rental.return_date);
    scheduledReturn.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const savedDays = Math.round(
        (scheduledReturn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isEarlyReturn = savedDays > 0;
    const threshold = earlyReturnSettings?.early_return_threshold_days ?? 2;
    const isBelowThreshold = isEarlyReturn && savedDays <= threshold;
    const chargeWillApply =
        isEarlyReturn &&
        !isBelowThreshold &&
        (earlyReturnSettings?.early_return_charge_enabled ?? false);
    const refundEnabled =
        earlyReturnSettings?.early_return_refund_enabled ?? true;
    const pendingReturnSubmitRef = useRef<ReturnForm | null>(null);

    // Auto-submit once all pending uploads (photos + videos) finish
    useEffect(() => {
        if (!pendingReturnSubmitRef.current) return;
        if (tus.isUploading || tus.hasPending) return;
        if (videoTus.isUploading || videoTus.hasPending) return;
        const hasPaused =
            tus.files.some(f => f.status === 'paused') ||
            videoTus.files.some(f => f.status === 'paused');
        if (hasPaused) return;
        const data = pendingReturnSubmitRef.current;
        pendingReturnSubmitRef.current = null;
        doReturnSubmit(data);
    }, [tus.isUploading, tus.hasPending, tus.files, videoTus.isUploading, videoTus.hasPending, videoTus.files]); // eslint-disable-line react-hooks/exhaustive-deps

    const doReturnSubmit = (data: ReturnForm) => {
        const tokens = tus.getUploadTokens();
        const videoTokens = videoTus.getUploadTokens();
        const payload: ProcessReturnData = {
            fuel_level: data.fuel_level || undefined,
            mileage: data.mileage ? Number(data.mileage) : undefined,
            condition_notes: data.condition_notes || undefined,
            damage_noted: data.damage_noted,
            estimated_repair_cost:
                data.damage_noted && data.estimated_repair_cost
                    ? Number(data.estimated_repair_cost)
                    : undefined,
            early_return_reason: data.early_return_reason || undefined,
            waive_early_return_charge:
                isEarlyReturn && !isBelowThreshold
                    ? data.waive_early_return_charge
                    : undefined,
            early_return_charge_waiver_reason: data.waive_early_return_charge
                ? data.early_return_charge_waiver_reason || undefined
                : undefined,
            photo_tus_tokens: tokens.length > 0 ? tokens : undefined,
            amount_paid: data.amount_paid
                ? Number(data.amount_paid)
                : undefined,
            ...(data.damage_noted && {
                damage_types:
                    data.damage_types.length > 0
                        ? data.damage_types
                        : undefined,
                damage_severity: data.damage_severity || undefined,
                damage_description: data.damage_description || undefined,
            }),
        };
        returnMutation.mutate(
            { id: rental.id, data: payload },
            {
                onSuccess: () => {
                    tus.clearAll();
                    videoTus.clearAll();
                    if (videoTokens.length > 0) {
                        uploadReturnVideosMutation.mutate({
                            id: rental.id,
                            videoTusTokens: videoTokens,
                        });
                    }
                    reset();
                    onClose();
                },
            }
        );
    };

    const onSubmit = (data: ReturnForm) => {
        if (tus.isUploading || videoTus.isUploading) return;
        const hasPaused =
            tus.files.some(f => f.status === 'paused') ||
            videoTus.files.some(f => f.status === 'paused');
        if (hasPaused) return;
        if (tus.hasPending || videoTus.hasPending) {
            pendingReturnSubmitRef.current = data;
            if (tus.hasPending) tus.startAll();
            if (videoTus.hasPending) videoTus.startAll();
            return;
        }
        doReturnSubmit(data);
    };

    return (
        <Modal
            show={show}
            onHide={onClose}
            centered
            size="lg"
            backdrop={tus.isUploading || tus.hasPending || videoTus.isUploading || videoTus.hasPending || tus.files.some(f => f.status === 'paused') || videoTus.files.some(f => f.status === 'paused') ? 'static' : true}
            keyboard={!(tus.isUploading || tus.hasPending || videoTus.isUploading || videoTus.hasPending || tus.files.some(f => f.status === 'paused') || videoTus.files.some(f => f.status === 'paused'))}
        >
            <Modal.Header closeButton>
                <Modal.Title>Process Return</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Modal.Body>
                    <Row className="g-3">
                        <Col md={12}>
                            <Controller
                                name="fuel_level"
                                control={control}
                                render={({ field }) => (
                                    <FuelLevelSelector
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Mileage (km)</Form.Label>
                                <Form.Control
                                    type="number"
                                    min={0}
                                    {...register('mileage')}
                                />
                                <Form.Text className="text-muted">
                                    Current odometer reading at return.
                                </Form.Text>
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Condition Notes</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    {...register('condition_notes')}
                                />
                                <Form.Text className="text-muted">
                                    Note the vehicle condition as returned - any
                                    new marks, fuel level, or cleanliness
                                    issues.
                                </Form.Text>
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <InspectionPhotoUpload
                                tus={tus}
                                onFilesSelected={() => {}}
                            />
                        </Col>
                        <Col md={12}>
                            <InspectionPhotoUpload
                                tus={videoTus}
                                onFilesSelected={() => {}}
                                label="Return Videos"
                                accept="video/mp4,video/quicktime,video/webm"
                                helpText="Record the vehicle condition at return (mp4, mov, webm)."
                            />
                        </Col>
                        <Col md={12}>
                            <Form.Check
                                type="switch"
                                id="return_damage_noted"
                                label="Damage noted at return"
                                {...register('damage_noted')}
                            />
                        </Col>
                        {damageNoted && (
                            <>
                                <Col md={12}>
                                    <Form.Label className="mb-1">
                                        Damage Types
                                    </Form.Label>
                                    <div className="d-flex flex-wrap gap-2">
                                        {DAMAGE_TYPES.map(dt => (
                                            <Form.Check
                                                key={dt}
                                                inline
                                                type="checkbox"
                                                id={`damage_type_${dt}`}
                                                label={
                                                    dt.charAt(0).toUpperCase() +
                                                    dt.slice(1)
                                                }
                                                value={dt}
                                                {...register('damage_types')}
                                            />
                                        ))}
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Severity</Form.Label>
                                        <div className="d-flex gap-3">
                                            {(
                                                [
                                                    'minor',
                                                    'moderate',
                                                    'severe',
                                                ] as const
                                            ).map(s => (
                                                <Form.Check
                                                    key={s}
                                                    type="radio"
                                                    id={`severity_${s}`}
                                                    label={
                                                        s
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                        s.slice(1)
                                                    }
                                                    value={s}
                                                    {...register(
                                                        'damage_severity'
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>
                                            Estimated Repair Cost
                                        </Form.Label>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            {...register(
                                                'estimated_repair_cost'
                                            )}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={12}>
                                    <Form.Group>
                                        <Form.Label>
                                            Damage Description
                                        </Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            placeholder="Describe the damage…"
                                            {...register('damage_description')}
                                        />
                                    </Form.Group>
                                </Col>
                            </>
                        )}
                        {isEarlyReturn && (
                            <Col md={12}>
                                <Alert
                                    variant={
                                        isBelowThreshold
                                            ? 'secondary'
                                            : 'warning'
                                    }
                                    className="mb-0 py-2"
                                >
                                    <strong>Early Return Detected</strong> -{' '}
                                    {savedDays} day{savedDays !== 1 ? 's' : ''}{' '}
                                    before scheduled return (
                                    {formatDate(rental.return_date)}).
                                    {isBelowThreshold && (
                                        <div className="mt-1 small">
                                            Within the {threshold}-day forfeit
                                            threshold - no charge, no refund.
                                            Unused days are forfeited.
                                        </div>
                                    )}
                                    {!isBelowThreshold &&
                                        !refundEnabled &&
                                        rental.amount_paid > 0 && (
                                            <div className="mt-1 small text-danger fw-semibold">
                                                Any amount paid beyond days used
                                                will be forfeited - no refund
                                                will be issued.
                                            </div>
                                        )}
                                    {!isBelowThreshold && chargeWillApply && (
                                        <div className="mt-2">
                                            <Form.Check
                                                type="switch"
                                                id="rd_waive_early_return_charge"
                                                label="Waive early return charge"
                                                {...register(
                                                    'waive_early_return_charge'
                                                )}
                                            />
                                            {waiveEarlyReturnCharge && (
                                                <Form.Control
                                                    className="mt-2"
                                                    size="sm"
                                                    placeholder="Reason for waiving charge…"
                                                    {...register(
                                                        'early_return_charge_waiver_reason'
                                                    )}
                                                />
                                            )}
                                        </div>
                                    )}
                                </Alert>
                            </Col>
                        )}

                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Early Return Reason</Form.Label>
                                <Form.Control
                                    placeholder="If returning before scheduled date…"
                                    {...register('early_return_reason')}
                                />
                            </Form.Group>
                        </Col>

                        {/* Collect payment at return */}
                        {rental.amount_due > 0 && (
                            <Col md={12}>
                                <hr className="my-1" />
                                <p className="small fw-semibold mb-2 text-muted text-uppercase">
                                    Collect at Return
                                </p>
                                {damageNoted && (
                                    <Alert
                                        variant="info"
                                        className="small py-2 mb-2"
                                    >
                                        Damage repair costs will be assessed
                                        separately after return.
                                    </Alert>
                                )}
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="d-flex justify-content-between w-100">
                                                Amount Collected
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="p-0 small"
                                                    onClick={() =>
                                                        setValue(
                                                            'amount_paid',
                                                            rental.amount_due.toString()
                                                        )
                                                    }
                                                >
                                                    Collect full
                                                </Button>
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                min={0}
                                                max={rental.amount_due}
                                                placeholder="0.00"
                                                {...register('amount_paid')}
                                            />
                                            <Form.Text className="text-muted">
                                                Outstanding:{' '}
                                                {formatCurrency(
                                                    rental.amount_due
                                                )}
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Col>
                        )}
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="light"
                        onClick={onClose}
                        disabled={returnMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="warning"
                        disabled={
                            returnMutation.isPending ||
                            tus.isUploading ||
                            videoTus.isUploading ||
                            tus.files.some(f => f.status === 'paused') ||
                            videoTus.files.some(f => f.status === 'paused')
                        }
                    >
                        {returnMutation.isPending ? (
                            <Spinner animation="border" size="sm" />
                        ) : tus.isUploading ? (
                            'Uploading photos…'
                        ) : videoTus.isUploading ? (
                            'Uploading videos…'
                        ) : tus.files.some(f => f.status === 'paused') || videoTus.files.some(f => f.status === 'paused') ? (
                            'Resume uploads to continue'
                        ) : (
                            'Process Return'
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

/* Approve Return Modal */
function ApproveReturnModal({
    show,
    onClose,
    rental,
    formatCurrency,
}: {
    show: boolean;
    onClose: () => void;
    rental: Rental;
    formatCurrency: (amount: number) => string;
}) {
    const approveMutation = useApproveReturn();
    const [forceSettle, setForceSettle] = useState(false);

    useEffect(() => {
        if (!show) setForceSettle(false);
    }, [show]);

    const hasPendingSettlement = rental.settlement_status === 'pending';
    const hasPendingDamage = rental.damage_settlement_status === 'pending';
    const hasAnythingPending = hasPendingSettlement || hasPendingDamage;

    const depositAvailable = Math.max(
        0,
        rental.deposit_paid -
            (rental.deposit_applied_to_balance ?? 0) -
            (rental.cancellation_deposit_deduction ?? 0) -
            (rental.damage_settlement_status === 'forfeited'
                ? (rental.actual_repair_cost ?? 0)
                : 0) -
            rental.deposit_refunded
    );
    const willRefundDeposit =
        rental.security_deposit_status === 'held' && depositAvailable > 0;

    const handleConfirm = () => {
        const data: ApproveReturnData = forceSettle
            ? { force_settle: true }
            : {};
        approveMutation.mutate(
            { id: rental.id, data },
            { onSuccess: () => onClose() }
        );
    };

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Approve Return</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <ul className="small mb-3 ps-3">
                    <li>Mark rental as completed</li>
                    {willRefundDeposit && (
                        <li>
                            Refund{' '}
                            <strong>{formatCurrency(depositAvailable)}</strong>{' '}
                            security deposit to customer
                        </li>
                    )}
                </ul>

                {hasAnythingPending && !forceSettle && (
                    <Alert variant="warning" className="small py-2">
                        {hasPendingSettlement && (
                            <div>
                                Rental balance settlement is still pending.
                            </div>
                        )}
                        {hasPendingDamage && (
                            <div>Damage settlement is still pending.</div>
                        )}
                        <div className="mt-1">
                            Check the box below to force-settle and approve
                            anyway.
                        </div>
                    </Alert>
                )}

                <Form.Check
                    type="checkbox"
                    id="force_settle_approve"
                    label="Mark all outstanding amounts as settled"
                    checked={forceSettle}
                    onChange={e => setForceSettle(e.target.checked)}
                />

                {forceSettle && (
                    <Alert variant="warning" className="small py-2 mt-2">
                        <strong>Warning:</strong> This will mark all outstanding
                        balances and damage costs as settled, and assumes all
                        payments have been collected and refunds issued.
                        {rental.amount_due > 0 && (
                            <span>
                                {' '}
                                Amount due ({formatCurrency(rental.amount_due)})
                                will be written off.
                            </span>
                        )}{' '}
                        This cannot be undone.
                    </Alert>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button
                    variant="light"
                    onClick={onClose}
                    disabled={approveMutation.isPending}
                >
                    Cancel
                </Button>
                <Button
                    variant="success"
                    onClick={handleConfirm}
                    disabled={
                        approveMutation.isPending ||
                        (hasAnythingPending && !forceSettle)
                    }
                >
                    {approveMutation.isPending ? (
                        <Spinner animation="border" size="sm" />
                    ) : forceSettle ? (
                        'Approve & Settle All'
                    ) : (
                        'Approve Return'
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

/* Settle Modal */
function SettleModal({
    show,
    onClose,
    rentalId,
    amountDue,
    currency,
}: {
    show: boolean;
    onClose: () => void;
    rentalId: string;
    amountDue: number;
    currency: string;
}) {
    const settleMutation = useSettleRental();
    const { register, handleSubmit, reset } = useForm<SettleRentalData>({
        defaultValues: { amount: amountDue, payment_method: 'cash', notes: '' },
    });

    useEffect(() => {
        if (!show) return;
        reset({ amount: amountDue, payment_method: 'cash', notes: '' });
    }, [show, amountDue]);

    const onSubmit = (data: SettleRentalData) => {
        settleMutation.mutate(
            { id: rentalId, data },
            {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            }
        );
    };

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Record Payment</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Modal.Body>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    Amount ({currency}){' '}
                                    <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min={0.01}
                                    {...register('amount', { required: true })}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Payment Method</Form.Label>
                                <Form.Select {...register('payment_method')}>
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="bank_transfer">
                                        Bank Transfer
                                    </option>
                                    <option value="mobile_money">
                                        Mobile Money
                                    </option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Notes</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    {...register('notes')}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="light"
                        onClick={onClose}
                        disabled={settleMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={settleMutation.isPending}
                    >
                        {settleMutation.isPending ? (
                            <Spinner animation="border" size="sm" />
                        ) : (
                            'Record Payment'
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

/* Damage Settle Modal */
function DamageSettleModal({
    show,
    onClose,
    rental,
    availableDeposit,
    onSettled,
    formatCurrency: formatCurrencyProp,
}: {
    show: boolean;
    onClose: () => void;
    rental: Rental;
    availableDeposit: number;
    onSettled: (info: {
        actual_repair_cost: number;
        outcome: 'settled' | 'forfeited';
        balance_collected_now?: boolean;
        available_deposit: number;
    }) => void;
    formatCurrency?: (n: number) => string;
}) {
    const formatCurrencyFallback = useFormatCurrency();
    const formatCurrency = formatCurrencyProp ?? formatCurrencyFallback;
    const settleDamageMutation = useSettleDamage();
    const { register, handleSubmit, reset, watch } = useForm<
        SettleDamageData & { balance_collected_now: boolean }
    >({
        defaultValues: {
            actual_repair_cost: rental.estimated_repair_cost ?? 0,
            outcome: 'settled',
            balance_collected_now: true,
            notes: '',
        },
    });

    const outcome = watch('outcome');
    const repairCost = watch('actual_repair_cost');
    const balanceCollectedNow = watch('balance_collected_now');
    const hasDepositHeld =
        rental.security_deposit_status === 'held' && rental.deposit_paid > 0;
    const shortfall = Math.max(0, Number(repairCost) - availableDeposit);

    useEffect(() => {
        if (!show) return;
        reset({
            actual_repair_cost: rental.estimated_repair_cost ?? 0,
            outcome: 'settled',
            balance_collected_now: true,
            notes: '',
        });
    }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

    const onSubmit = (
        data: SettleDamageData & { balance_collected_now: boolean }
    ) => {
        const payload: SettleDamageData = {
            actual_repair_cost: data.actual_repair_cost,
            outcome: data.outcome,
            notes: data.notes,
            balance_collected_now:
                data.outcome === 'forfeited' && shortfall > 0
                    ? data.balance_collected_now
                    : undefined,
        };
        settleDamageMutation.mutate(
            { id: rental.id, data: payload },
            {
                onSuccess: () => {
                    reset();
                    onClose();
                    onSettled({
                        actual_repair_cost: Number(data.actual_repair_cost),
                        outcome: data.outcome,
                        balance_collected_now:
                            data.outcome === 'forfeited' && shortfall > 0
                                ? data.balance_collected_now
                                : undefined,
                        available_deposit: availableDeposit,
                    });
                },
            }
        );
    };

    const depositCovers = Math.min(Number(repairCost), availableDeposit);

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Settle Damage</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Modal.Body>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    Actual Repair Cost{' '}
                                    <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    {...register('actual_repair_cost', {
                                        required: true,
                                        valueAsNumber: true,
                                    })}
                                />
                                {rental.estimated_repair_cost != null && (
                                    <Form.Text className="text-muted">
                                        Estimated:{' '}
                                        {formatCurrency(
                                            rental.estimated_repair_cost
                                        )}
                                    </Form.Text>
                                )}
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Settlement Method</Form.Label>
                                <Form.Select {...register('outcome')}>
                                    <option value="settled">
                                        Customer paid directly
                                    </option>
                                    {hasDepositHeld && (
                                        <option value="forfeited">
                                            Deduct from security deposit
                                        </option>
                                    )}
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        {outcome === 'forfeited' && hasDepositHeld && (
                            <Col md={12}>
                                <div className="border rounded p-2 small bg-light">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="text-muted">
                                            Repair cost:
                                        </span>
                                        <strong>
                                            {formatCurrency(Number(repairCost))}
                                        </strong>
                                    </div>
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="text-muted">
                                            Security deposit used:
                                        </span>
                                        <strong>
                                            {formatCurrency(depositCovers)}
                                        </strong>
                                    </div>
                                    {shortfall > 0 && (
                                        <>
                                            <div className="d-flex justify-content-between border-top pt-1 mt-1">
                                                <span className="text-danger fw-semibold">
                                                    Remaining balance:
                                                </span>
                                                <strong className="text-danger">
                                                    {formatCurrency(shortfall)}
                                                </strong>
                                            </div>
                                            <hr className="my-2" />
                                            <Form.Check
                                                type="checkbox"
                                                id="balance_collected_now"
                                                label={`Collect remaining ${formatCurrency(shortfall)} now`}
                                                {...register(
                                                    'balance_collected_now'
                                                )}
                                            />
                                            {!balanceCollectedNow && (
                                                <Form.Text className="text-muted d-block mt-1">
                                                    Balance will be recorded as
                                                    pending and can be collected
                                                    later.
                                                </Form.Text>
                                            )}
                                        </>
                                    )}
                                    {shortfall === 0 && (
                                        <div className="text-success small mt-1">
                                            Deposit fully covers the repair
                                            cost.
                                        </div>
                                    )}
                                </div>
                            </Col>
                        )}

                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Notes</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    {...register('notes')}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="light"
                        onClick={onClose}
                        disabled={settleDamageMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="danger"
                        disabled={settleDamageMutation.isPending}
                    >
                        {settleDamageMutation.isPending ? (
                            <Spinner animation="border" size="sm" />
                        ) : (
                            'Confirm Settlement'
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

/* Record Repair Cost Modal */
function RecordRepairCostModal({
    show,
    onClose,
    rental,
}: {
    show: boolean;
    onClose: () => void;
    rental: Rental;
}) {
    const recordMutation = useRecordRepairCost();
    const { register, handleSubmit, reset } = useForm<RecordRepairCostData>({
        defaultValues: {
            estimated_repair_cost: rental.estimated_repair_cost ?? 0,
        },
    });

    useEffect(() => {
        if (!show) return;
        reset({ estimated_repair_cost: rental.estimated_repair_cost ?? 0 });
    }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

    const onSubmit = (data: RecordRepairCostData) => {
        recordMutation.mutate(
            { id: rental.id, data },
            {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            }
        );
    };

    return (
        <Modal show={show} onHide={onClose} centered size="sm">
            <Modal.Header closeButton>
                <Modal.Title>Record Repair Cost</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>
                            Estimated Repair Cost{' '}
                            <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            type="number"
                            step="0.01"
                            min={0}
                            {...register('estimated_repair_cost', {
                                required: true,
                                valueAsNumber: true,
                            })}
                        />
                        <Form.Text className="text-muted">
                            This is the estimated cost - the actual cost will be
                            confirmed at settlement.
                        </Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="light"
                        onClick={onClose}
                        disabled={recordMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="warning"
                        disabled={recordMutation.isPending}
                    >
                        {recordMutation.isPending ? (
                            <Spinner animation="border" size="sm" />
                        ) : (
                            'Save'
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

/* Damage Invoice Modal */
function DamageInvoiceModal({
    show,
    onClose,
    rental,
    formatCurrency: formatCurrencyProp,
}: {
    show: boolean;
    onClose: () => void;
    rental: Rental;
    formatCurrency?: (n: number) => string;
}) {
    const formatCurrencyFallback = useFormatCurrency();
    const formatCurrency = formatCurrencyProp ?? formatCurrencyFallback;

    const inspection =
        rental.inspections?.find(i => i.type === 'return' && i.damage_noted) ??
        rental.inspections?.find(i => i.damage_noted);

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Damage Invoice</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="border rounded p-3 small">
                    <div className="d-flex justify-content-between mb-2">
                        <div>
                            <div className="fw-bold">Damage Report</div>
                            <div className="text-muted">{rental.reference}</div>
                        </div>
                        <Badge bg="warning" text="dark">
                            Damage Noted
                        </Badge>
                    </div>
                    <hr />

                    {inspection && (
                        <>
                            {inspection.damage_types &&
                                inspection.damage_types.length > 0 && (
                                    <div className="mb-1 d-flex justify-content-between">
                                        <span className="text-muted">
                                            Damage Type(s):
                                        </span>
                                        <span className="text-end">
                                            {inspection.damage_types.join(', ')}
                                        </span>
                                    </div>
                                )}
                            {inspection.damage_severity && (
                                <div className="mb-1 d-flex justify-content-between">
                                    <span className="text-muted">
                                        Severity:
                                    </span>
                                    <span className="text-capitalize">
                                        {inspection.damage_severity}
                                    </span>
                                </div>
                            )}
                            {inspection.damage_description && (
                                <div className="mb-2">
                                    <div className="text-muted">
                                        Description:
                                    </div>
                                    <div className="fst-italic">
                                        {inspection.damage_description}
                                    </div>
                                </div>
                            )}
                            <hr />
                        </>
                    )}

                    {rental.estimated_repair_cost != null && (
                        <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted">
                                Estimated Repair:
                            </span>
                            <strong>
                                {formatCurrency(rental.estimated_repair_cost)}
                            </strong>
                        </div>
                    )}
                    {rental.actual_repair_cost != null && (
                        <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted">Actual Repair:</span>
                            <strong>
                                {formatCurrency(rental.actual_repair_cost)}
                            </strong>
                        </div>
                    )}
                    {rental.damage_settlement_status === 'forfeited' &&
                        rental.actual_repair_cost != null && (
                            <>
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="text-muted">
                                        Security Deposit Used:
                                    </span>
                                    <span>
                                        {formatCurrency(
                                            Math.min(
                                                rental.actual_repair_cost,
                                                (rental.deposit_paid ?? 0) -
                                                    (rental.deposit_applied_to_balance ??
                                                        0) -
                                                    (rental.cancellation_deposit_deduction ??
                                                        0)
                                            )
                                        )}
                                    </span>
                                </div>
                                {(rental.damage_balance_due ?? 0) > 0 && (
                                    <div className="d-flex justify-content-between border-top pt-1 mt-1">
                                        <span className="text-danger fw-semibold">
                                            Amount Due:
                                        </span>
                                        <strong className="text-danger">
                                            {formatCurrency(
                                                rental.damage_balance_due ?? 0
                                            )}
                                        </strong>
                                    </div>
                                )}
                            </>
                        )}
                    {rental.damage_settlement_status === 'settled' && (
                        <div className="text-success text-center mt-2 fw-semibold">
                            <FaCheck className="me-1" /> Settled
                        </div>
                    )}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

/* Damage Receipt Modal */
function DamageReceiptModal({
    show,
    onClose,
    rental,
    settlementInfo,
    formatCurrency: formatCurrencyProp,
}: {
    show: boolean;
    onClose: () => void;
    rental: Rental;
    settlementInfo: {
        actual_repair_cost: number;
        outcome: 'settled' | 'forfeited';
        balance_collected_now?: boolean;
        available_deposit: number;
    } | null;
    formatCurrency?: (n: number) => string;
}) {
    const formatCurrencyFallback = useFormatCurrency();
    const formatCurrency = formatCurrencyProp ?? formatCurrencyFallback;

    if (!settlementInfo) return null;

    const {
        actual_repair_cost,
        outcome,
        balance_collected_now,
        available_deposit,
    } = settlementInfo;
    const depositUsed =
        outcome === 'forfeited'
            ? Math.min(actual_repair_cost, available_deposit)
            : 0;
    const shortfall = Math.max(0, actual_repair_cost - available_deposit);

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Damage Settlement Receipt</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="border rounded p-3 small">
                    <div className="text-center mb-3">
                        <div className="fw-bold fs-6">Settlement Summary</div>
                        <div className="text-muted">{rental.reference}</div>
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Actual Repair Cost:</span>
                        <strong>{formatCurrency(actual_repair_cost)}</strong>
                    </div>

                    {outcome === 'forfeited' && (
                        <>
                            <div className="d-flex justify-content-between mb-1">
                                <span className="text-muted">
                                    Security Deposit Used:
                                </span>
                                <span>- {formatCurrency(depositUsed)}</span>
                            </div>
                            {shortfall > 0 && (
                                <div className="d-flex justify-content-between border-top pt-1 mt-1">
                                    <span
                                        className={
                                            balance_collected_now
                                                ? 'text-muted'
                                                : 'text-danger fw-semibold'
                                        }
                                    >
                                        {balance_collected_now
                                            ? 'Balance Collected:'
                                            : 'Balance Pending:'}
                                    </span>
                                    <strong
                                        className={
                                            balance_collected_now
                                                ? ''
                                                : 'text-danger'
                                        }
                                    >
                                        {formatCurrency(shortfall)}
                                    </strong>
                                </div>
                            )}
                        </>
                    )}

                    {outcome === 'settled' && (
                        <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted">
                                Paid by customer:
                            </span>
                            <strong>
                                {formatCurrency(actual_repair_cost)}
                            </strong>
                        </div>
                    )}

                    <hr />
                    <div className="text-center">
                        {outcome === 'settled' ||
                        (outcome === 'forfeited' &&
                            (shortfall === 0 || balance_collected_now)) ? (
                            <Badge bg="success" className="fs-6 px-3 py-2">
                                Fully Settled
                            </Badge>
                        ) : (
                            <Badge
                                bg="warning"
                                text="dark"
                                className="fs-6 px-3 py-2"
                            >
                                Deposit Used - Balance Pending
                            </Badge>
                        )}
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

/* Cancel Modal */
function CancelModal({
    show,
    onClose,
    rentalId,
    formatCurrency: formatCurrencyProp,
}: {
    show: boolean;
    onClose: () => void;
    rentalId: string;
    formatCurrency?: (n: number) => string;
}) {
    const formatCurrencyFallback = useFormatCurrency();
    const formatCurrency = formatCurrencyProp ?? formatCurrencyFallback;
    const cancelMutation = useCancelRental();
    const { data: preview, isLoading: previewLoading } = useCancelPreview(
        show ? rentalId : null
    );
    const { register, handleSubmit, reset } = useForm<CancelRentalData>({
        defaultValues: { reason: '', cancelled_by_type: 'customer' },
    });

    const onSubmit = (data: CancelRentalData) => {
        cancelMutation.mutate(
            { id: rentalId, data },
            {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            }
        );
    };

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Cancel Rental</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Modal.Body>
                    {previewLoading ? (
                        <div className="text-center py-3">
                            <Spinner animation="border" size="sm" />
                        </div>
                    ) : (
                        preview && (
                            <Alert
                                variant={
                                    preview.cancellation_amount_owed > 0
                                        ? 'danger'
                                        : preview.cancellation_fee > 0
                                          ? 'warning'
                                          : 'success'
                                }
                                className="mb-3"
                            >
                                {preview.reason === 'after_pickup' &&
                                    preview.days_used_cost > 0 && (
                                        <div className="d-flex justify-content-between">
                                            <span>Days Used Cost:</span>
                                            <strong>
                                                {formatCurrency(
                                                    preview.days_used_cost
                                                )}
                                            </strong>
                                        </div>
                                    )}
                                <div className="d-flex justify-content-between">
                                    <span>Cancellation Fee:</span>
                                    <strong>
                                        {formatCurrency(
                                            preview.cancellation_fee
                                        )}
                                    </strong>
                                </div>
                                {preview.reason === 'after_pickup' && (
                                    <div className="d-flex justify-content-between border-top mt-1 pt-1">
                                        <span>Total Deduction:</span>
                                        <strong>
                                            {formatCurrency(
                                                preview.total_deduction
                                            )}
                                        </strong>
                                    </div>
                                )}
                                {preview.cancellation_amount_owed > 0 ? (
                                    <div className="d-flex justify-content-between text-danger">
                                        <span>Amount Owed by Customer:</span>
                                        <strong>
                                            {formatCurrency(
                                                preview.cancellation_amount_owed
                                            )}
                                        </strong>
                                    </div>
                                ) : (
                                    <div className="d-flex justify-content-between">
                                        <span>Refund Amount:</span>
                                        <strong>
                                            {formatCurrency(
                                                preview.refund_amount
                                            )}
                                        </strong>
                                    </div>
                                )}
                                <small className="text-muted mt-1 d-block">
                                    {preview.reason === 'free_window' &&
                                        'Within free cancellation window - no fee applies.'}
                                    {preview.reason === 'late_cancellation' &&
                                        'Late cancellation - fee applies.'}
                                    {preview.reason === 'after_pickup' &&
                                        'Rental already picked up - after-pickup fee applies.'}
                                </small>
                            </Alert>
                        )
                    )}
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Cancelled By</Form.Label>
                                <Form.Select {...register('cancelled_by_type')}>
                                    <option value="customer">Customer</option>
                                    <option value="business">Business</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Reason</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    placeholder="Optional reason…"
                                    {...register('reason')}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="light"
                        onClick={onClose}
                        disabled={cancelMutation.isPending}
                    >
                        Back
                    </Button>
                    <Button
                        type="submit"
                        variant="danger"
                        disabled={cancelMutation.isPending}
                    >
                        {cancelMutation.isPending ? (
                            <Spinner animation="border" size="sm" />
                        ) : (
                            'Cancel Rental'
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

/* Refund Settle Modal */
interface RefundSettleForm {
    action:
        | 'approved'
        | 'waived'
        | 'deduct_deposit'
        | 'waive_debt'
        | 'mark_received';
    refund_amount: string;
    amount_received: string;
    notes: string;
}

function RefundSettleModal({
    show,
    onClose,
    rentalId,
    currentRefundAmount,
    cancellationAmountOwed,
    depositPaid,
    mutation,
    formatCurrency: formatCurrencyProp,
}: {
    show: boolean;
    onClose: () => void;
    rentalId: string;
    currentRefundAmount: number | null;
    cancellationAmountOwed: number | null;
    depositPaid: number;
    mutation: ReturnType<typeof useSettleRefund>;
    formatCurrency?: (n: number) => string;
}) {
    const formatCurrencyFallback = useFormatCurrency();
    const formatCurrency = formatCurrencyProp ?? formatCurrencyFallback;
    const isDebtMode =
        (cancellationAmountOwed ?? 0) > 0 && !currentRefundAmount;

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<RefundSettleForm>({
        defaultValues: {
            action: isDebtMode ? 'mark_received' : 'approved',
            refund_amount:
                currentRefundAmount != null ? String(currentRefundAmount) : '',
            amount_received:
                cancellationAmountOwed != null
                    ? String(cancellationAmountOwed)
                    : '',
            notes: '',
        },
    });

    useEffect(() => {
        if (!show) return;
        reset({
            action: isDebtMode ? 'mark_received' : 'approved',
            refund_amount:
                currentRefundAmount != null ? String(currentRefundAmount) : '',
            amount_received:
                cancellationAmountOwed != null
                    ? String(cancellationAmountOwed)
                    : '',
            notes: '',
        });
    }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

    const action = watch('action');

    const onSubmit = (data: RefundSettleForm) => {
        const payload: SettleRefundData = { action: data.action };
        if (data.action === 'approved') {
            payload.refund_amount = Number(data.refund_amount);
        }
        if (data.notes.trim()) {
            payload.notes = data.notes.trim();
        }
        mutation.mutate(
            { id: rentalId, data: payload },
            {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            }
        );
    };

    const deductionPreview =
        cancellationAmountOwed != null && depositPaid > 0
            ? Math.min(cancellationAmountOwed, depositPaid)
            : 0;

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    {isDebtMode ? 'Resolve Cancellation Debt' : 'Settle Refund'}
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Modal.Body>
                    {isDebtMode ? (
                        <>
                            <Alert variant="warning" className="mb-3 small">
                                Customer owes{' '}
                                <strong>
                                    {formatCurrency(
                                        cancellationAmountOwed ?? 0
                                    )}
                                </strong>{' '}
                                after cancellation.
                            </Alert>
                            <Form.Group className="mb-3">
                                <Form.Label>Action</Form.Label>
                                <Form.Select {...register('action')}>
                                    <option value="mark_received">
                                        Mark as Received
                                    </option>
                                    {depositPaid > 0 && (
                                        <option value="deduct_deposit">
                                            Resolve with Security Deposit (
                                            {formatCurrency(deductionPreview)})
                                        </option>
                                    )}
                                    <option value="waive_debt">
                                        Waive Debt
                                    </option>
                                </Form.Select>
                            </Form.Group>

                            {action === 'mark_received' && (
                                <Form.Group className="mb-3">
                                    <Form.Label>Amount Received</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        readOnly
                                        {...register('amount_received')}
                                    />
                                </Form.Group>
                            )}
                        </>
                    ) : (
                        <>
                            <Form.Group className="mb-3">
                                <Form.Label>Action</Form.Label>
                                <Form.Select {...register('action')}>
                                    <option value="approved">
                                        Approve Refund
                                    </option>
                                    <option value="waived">Waive Refund</option>
                                </Form.Select>
                            </Form.Group>

                            {action === 'approved' && (
                                <Form.Group className="mb-3">
                                    <Form.Label>Refund Amount</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        isInvalid={!!errors.refund_amount}
                                        {...register('refund_amount', {
                                            required:
                                                'Refund amount is required.',
                                            min: {
                                                value: 0,
                                                message: 'Must be 0 or more.',
                                            },
                                        })}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.refund_amount?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            )}
                        </>
                    )}

                    <Form.Group className="mb-3">
                        <Form.Label>Notes (optional)</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            placeholder="Internal note…"
                            {...register('notes')}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="light"
                        onClick={onClose}
                        disabled={mutation.isPending}
                    >
                        Back
                    </Button>
                    <Button
                        type="submit"
                        variant={
                            action === 'waived' || action === 'waive_debt'
                                ? 'secondary'
                                : action === 'deduct_deposit'
                                  ? 'warning'
                                  : action === 'mark_received'
                                    ? 'success'
                                    : 'primary'
                        }
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? (
                            <Spinner animation="border" size="sm" />
                        ) : action === 'waived' ? (
                            'Waive Refund'
                        ) : action === 'waive_debt' ? (
                            'Waive Debt'
                        ) : action === 'deduct_deposit' ? (
                            'Deduct from Deposit'
                        ) : action === 'mark_received' ? (
                            'Mark as Received'
                        ) : (
                            'Approve Refund'
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

/* Main Component */
export default function RentalDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const currency = useCurrency();
    const formatCurrency = useFormatCurrency();

    const { data: res, isLoading, isError } = useRental(id ?? '');
    const rental = res?.data ?? null;

    const titleText = rental ? `Rental ${rental.reference}` : 'Rental Detail';
    const title = useTitle(titleText);

    const { data: earlyReturnSettingsRes } = useEarlyReturnSettings();
    const earlyReturnRefundEnabled =
        earlyReturnSettingsRes?.data?.early_return_refund_enabled ?? true;

    const { data: cancellationSettingsRes } = useCancellationSettings();
    const cancellationCutoffDays =
        cancellationSettingsRes?.data?.cancellation_cutoff_days ?? 0;

    const confirmMutation = useConfirmRental();
    const collectDamageBalanceMutation = useCollectDamageBalance();
    const collectDepositMutation = useCollectDeposit();
    const refundDepositMutation = useRefundDeposit();
    const settleWithDepositMutation = useSettleWithDeposit();
    const deleteMutation = useDeleteRental();
    const settleRefundMutation = useSettleRefund();
    const { mutate: sendPaymentLink, isPending: isSendingPaymentLink } =
        useSendPaymentLink();
    const {
        mutate: sendDamagePaymentLink,
        isPending: isSendingDamagePaymentLink,
    } = useSendDamagePaymentLink();
    const {
        mutate: sendDepositPaymentLink,
        isPending: isSendingDepositPaymentLink,
    } = useSendDepositPaymentLink();
    const { mutate: requestReupload, isPending: isRequestingReupload } =
        useRequestReupload();
    const {
        mutate: sendCompleteProfileLink,
        isPending: isSendingCompleteProfileLink,
    } = useSendCompleteProfileLink();

    const [showSendPaymentLinkConfirm, setShowSendPaymentLinkConfirm] =
        useState(false);
    const [
        showSendDamagePaymentLinkConfirm,
        setShowSendDamagePaymentLinkConfirm,
    ] = useState(false);
    const [
        showSendDepositPaymentLinkConfirm,
        setShowSendDepositPaymentLinkConfirm,
    ] = useState(false);
    const [showCustomerPreview, setShowCustomerPreview] = useState(false);
    const [showPickup, setShowPickup] = useState(false);
    const [showReturn, setShowReturn] = useState(false);
    const [showSwitchVehicle, setShowSwitchVehicle] = useState(false);
    const [showExtend, setShowExtend] = useState(false);
    const [showEditRental, setShowEditRental] = useState(false);
    const [showSettle, setShowSettle] = useState(false);
    const [showDamage, setShowDamage] = useState(false);
    const [showDamageReceipt, setShowDamageReceipt] = useState<{
        actual_repair_cost: number;
        outcome: 'settled' | 'forfeited';
        balance_collected_now?: boolean;
        available_deposit: number;
    } | null>(null);
    const [showRecordRepairCost, setShowRecordRepairCost] = useState(false);
    const [showDamageInvoice, setShowDamageInvoice] = useState(false);
    const [showCancel, setShowCancel] = useState(false);
    const [showApprove, setShowApprove] = useState(false);
    const [showCollectDeposit, setShowCollectDeposit] = useState(false);
    const [showRefundDeposit, setShowRefundDeposit] = useState(false);
    const [showUseDeposit, setShowUseDeposit] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [showSettleRefund, setShowSettleRefund] = useState(false);

    const activeBranchId = useAppSelector(selectActiveBranchId);
    const { data: generalSettings } = useGeneralSettings();

    if (isLoading) {
        return <DetailPageSkeleton cards={3} />;
    }

    if (isError || !rental) {
        return (
            <Alert variant="danger">
                Rental not found or failed to load.{' '}
                <Alert.Link
                    onClick={() => navigate(ROUTES.DASHBOARD.RENTALS.ROOT)}
                >
                    Back to rentals
                </Alert.Link>
            </Alert>
        );
    }

    const statusColor =
        STATUS_COLORS[rental.status as RentalStatus] ?? 'secondary';
    const statusLabel =
        STATUS_LABELS[rental.status as RentalStatus] ?? rental.status;

    const canConfirm = rental.status === 'pending';
    const canSwitchVehicle =
        rental.status === 'pending' || rental.status === 'confirmed';
    const canExtend = ['pending', 'confirmed', 'active', 'overdue'].includes(
        rental.status
    );
    const canPickup = rental.status === 'confirmed';
    const canReturn = rental.status === 'active' || rental.status === 'overdue';
    const canApprove = rental.status === 'returned';
    const cancellationCutoffReached =
        ['active', 'overdue'].includes(rental.status) &&
        cancellationCutoffDays > 0 &&
        (() => {
            const cutoff = new Date(rental.return_date);
            cutoff.setDate(cutoff.getDate() - cancellationCutoffDays);
            cutoff.setHours(0, 0, 0, 0);
            return new Date() >= cutoff;
        })();
    const canCancel =
        !['completed', 'cancelled', 'returned'].includes(rental.status) &&
        !cancellationCutoffReached;
    const canSettle =
        !['cancelled', 'pending'].includes(rental.status) &&
        (rental.amount_due > 0 || rental.settlement_status === 'pending');
    const canSettleDamage =
        rental.has_damage &&
        rental.damage_settlement_status === 'pending' &&
        rental.status === 'returned';
    const canRecordRepairCost =
        rental.has_damage &&
        rental.damage_settlement_status === 'pending' &&
        rental.status === 'returned';
    const canCollectDamageBalance =
        rental.has_damage && (rental.damage_balance_due ?? 0) > 0;
    const canCollectDeposit =
        !rental.skip_security_deposit &&
        rental.security_deposit_status === 'pending' &&
        (rental.security_deposit_amount ?? 0) > 0 &&
        !['cancelled', 'completed'].includes(rental.status);

    const availableDeposit = Math.max(
        0,
        rental.deposit_paid -
            (rental.deposit_applied_to_balance ?? 0) -
            (rental.cancellation_deposit_deduction ?? 0) -
            (rental.damage_settlement_status === 'forfeited'
                ? (rental.actual_repair_cost ?? 0)
                : 0) -
            rental.deposit_refunded
    );

    const depositAvailableForBalance = Math.max(
        0,
        rental.deposit_paid -
            (rental.deposit_applied_to_balance ?? 0) -
            (rental.cancellation_deposit_deduction ?? 0) -
            (rental.damage_settlement_status === 'forfeited'
                ? (rental.actual_repair_cost ?? 0)
                : 0)
    );

    const canUseDeposit =
        rental.status === 'returned' &&
        rental.security_deposit_status === 'held' &&
        rental.amount_due > 0 &&
        depositAvailableForBalance > 0;

    const canRefundDeposit =
        rental.security_deposit_status === 'held' &&
        availableDeposit > 0 &&
        (rental.status === 'completed' || rental.status === 'cancelled');

    const canSendDepositLink =
        (rental.security_deposit_amount ?? 0) > 0 &&
        !rental.skip_security_deposit &&
        !rental.deposit_waived &&
        rental.security_deposit_status === 'pending' &&
        !!rental.customer?.email &&
        ['confirmed', 'active'].includes(rental.status);

    const globalSymbol = generalSettings?.data?.currency_symbol ?? 'GHS';
    const showConverted =
        !!rental.exchange_rate &&
        (!activeBranchId || activeBranchId !== rental.branch_id);

    const sym = rental.currency_symbol ?? null;
    const fmtR = (val: number): string => {
        if (showConverted && rental.exchange_rate) {
            const globalAmt = val * rental.exchange_rate;
            const primary = sym
                ? formatWithSymbol(val, sym)
                : formatCurrency(val);
            return `${primary} / ${formatWithSymbol(globalAmt, globalSymbol)}`;
        }
        return sym ? formatWithSymbol(val, sym) : formatCurrency(val);
    };
    const fmt = (val: number | null | undefined) =>
        val != null ? fmtR(val) : null;

    const pricingBaseLine = rental.applied_charges_breakdown?.find(
        l => l.type === 'base'
    );
    const pricingOriginalDays =
        rental.rental_days - (rental.extension_days ?? 0);
    const effectiveDailyRate =
        pricingBaseLine && pricingOriginalDays > 0
            ? pricingBaseLine.amount / pricingOriginalDays
            : rental.daily_rate;

    return (
        <Fragment>
            {title}

            {/* Page Header */}
            <div
                className="rental-detail-header rounded-3 mb-3 px-4 py-3 d-flex justify-content-between align-items-center flex-wrap gap-3"
                style={{
                    background: '#fff',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    border: '1px solid #e9ecef',
                }}
            >
                <div className="d-flex align-items-center gap-3 flex-wrap">
                    <div>
                        <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                            <h5
                                className="mb-0 fw-bold text-dark"
                                style={{ letterSpacing: '-0.01em' }}
                            >
                                {rental.reference}
                            </h5>
                            <Badge
                                bg={statusColor}
                                text={
                                    rental.status === 'cancelled'
                                        ? 'dark'
                                        : undefined
                                }
                                style={{ fontSize: '0.72rem' }}
                            >
                                {statusLabel}
                            </Badge>
                            {rental.is_overdue &&
                                rental.status !== 'overdue' && (
                                    <Badge
                                        bg="danger"
                                        style={{ fontSize: '0.72rem' }}
                                    >
                                        Overdue
                                    </Badge>
                                )}
                            {rental.has_damage && (
                                <Badge
                                    bg="warning"
                                    text="dark"
                                    style={{ fontSize: '0.72rem' }}
                                >
                                    Damage Noted
                                </Badge>
                            )}
                        </div>
                        <div className="text-muted small">
                            Created {formatDate(rental.created_at)}
                            {rental.customer?.name && (
                                <span> &middot; {rental.customer.name}</span>
                            )}
                            {rental.vehicle?.name && (
                                <span> &middot; {rental.vehicle.name}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="d-flex gap-2 flex-wrap align-items-center">
                    {canConfirm && (
                        <Button
                            variant="info"
                            size="sm"
                            disabled={confirmMutation.isPending}
                            onClick={() => confirmMutation.mutate(rental.id)}
                        >
                            Confirm
                        </Button>
                    )}
                    {rental.status !== 'completed' && (
                        <PermisssionGuard
                            permission={PERMISSIONS.RENTALS.EDIT}
                        >
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => setShowEditRental(true)}
                            >
                                Edit Details
                            </Button>
                        </PermisssionGuard>
                    )}
                    {canSwitchVehicle && (
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => setShowSwitchVehicle(true)}
                        >
                            Switch Vehicle
                        </Button>
                    )}
                    {canExtend && (
                        <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => setShowExtend(true)}
                        >
                            Extend Rental
                        </Button>
                    )}
                    {canPickup && (
                        <Button
                            variant="success"
                            size="sm"
                            onClick={() => setShowCustomerPreview(true)}
                        >
                            Process Pickup
                        </Button>
                    )}
                    {canReturn && (
                        <Button
                            variant="warning"
                            size="sm"
                            onClick={() => setShowReturn(true)}
                        >
                            Process Return
                        </Button>
                    )}
                    {canApprove && (
                        <Button
                            variant="success"
                            size="sm"
                            onClick={() => setShowApprove(true)}
                        >
                            Approve Return
                        </Button>
                    )}
                    {canSettle && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setShowSettle(true)}
                        >
                            Record Payment
                        </Button>
                    )}
                    {(rental.amount_due ?? rental.total_cost ?? 0) > 0 &&
                        rental.status !== 'cancelled' &&
                        rental.customer?.email && (
                            <PermisssionGuard
                                permission={
                                    PERMISSIONS.RENTALS.SEND_PAYMENT_LINK
                                }
                            >
                                <Button
                                    variant="outline-info"
                                    size="sm"
                                    disabled={isSendingPaymentLink}
                                    onClick={() =>
                                        setShowSendPaymentLinkConfirm(true)
                                    }
                                >
                                    {isSendingPaymentLink
                                        ? 'Sending...'
                                        : 'Send Payment Link'}
                                </Button>
                            </PermisssionGuard>
                        )}
                    {rental.has_damage &&
                        rental.damage_settlement_status !== 'settled' &&
                        ((rental.estimated_repair_cost ?? 0) > 0 ||
                            (rental.damage_balance_due ?? 0) > 0) &&
                        rental.customer?.email && (
                            <PermisssionGuard
                                permission={
                                    PERMISSIONS.RENTALS.SEND_PAYMENT_LINK
                                }
                            >
                                <Button
                                    variant="outline-warning"
                                    size="sm"
                                    disabled={isSendingDamagePaymentLink}
                                    onClick={() =>
                                        setShowSendDamagePaymentLinkConfirm(
                                            true
                                        )
                                    }
                                >
                                    <i className="fas fa-link me-1" />
                                    {isSendingDamagePaymentLink
                                        ? 'Sending...'
                                        : 'Send Damage Payment Link'}
                                </Button>
                            </PermisssionGuard>
                        )}
                    {(rental.refund_status === 'pending' ||
                        ((rental.refund_amount ?? 0) > 0 &&
                            !['approved', 'waived'].includes(
                                rental.refund_status ?? ''
                            ))) &&
                        rental.status !== 'cancelled' && (
                            <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => setShowSettleRefund(true)}
                            >
                                Issue Refund
                            </Button>
                        )}
                    {canUseDeposit && (
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => setShowUseDeposit(true)}
                        >
                            Use Security Deposit
                        </Button>
                    )}
                    {canCancel && (
                        <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => setShowCancel(true)}
                        >
                            Cancel
                        </Button>
                    )}
                    <Link
                        to={ROUTES.DASHBOARD.RENTALS.INVOICE(rental.id)}
                        className="btn btn-outline-info btn-sm"
                    >
                        {rental.status === 'cancelled'
                            ? (rental.cancellation_amount_owed ?? 0) > 0 &&
                              !rental.cancellation_debt_waived
                                ? 'View Cancellation Invoice'
                                : (rental.refund_amount ?? 0) > 0 &&
                                    rental.refund_status === 'approved'
                                  ? 'View Refund Receipt'
                                  : (rental.refund_amount ?? 0) > 0
                                    ? 'View Credit Note'
                                    : 'View Cancellation Notice'
                            : ['paid', 'refunded'].includes(
                                    rental.payment_status
                                )
                              ? 'View Receipt'
                              : 'View Invoice'}
                    </Link>
                    <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => setShowDelete(true)}
                    >
                        Delete
                    </Button>
                </div>
            </div>

            <Row className="g-3 align-items-start">
                {/* Left: Main Info */}
                <Col lg={8}>
                    {/* Customer & Vehicle */}
                    <Row className="g-3 mb-0">
                        <Col md={6}>
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Header
                                    className="rental-card-subheader py-2 d-flex align-items-center justify-content-between"
                                    style={{
                                        background: '#f8f9fc',
                                        borderBottom: '1px solid #eee',
                                    }}
                                >
                                    <Card.Title
                                        className="small fw-semibold mb-0 text-uppercase text-muted"
                                        style={{
                                            letterSpacing: '0.05em',
                                            fontSize: '0.7rem',
                                        }}
                                    >
                                        Customer
                                    </Card.Title>
                                    <div className="d-flex align-items-center gap-2">
                                        {rental.customer?.profile_status ===
                                            'incomplete' && (
                                            <span
                                                className="badge bg-warning text-dark"
                                                style={{ fontSize: 10 }}
                                            >
                                                Profile Incomplete
                                            </span>
                                        )}
                                        {rental.customer?.id && (
                                            <Link
                                                to={ROUTES.DASHBOARD.CUSTOMERS.VIEW(
                                                    rental.customer.id
                                                )}
                                                className="text-primary"
                                                title="View Customer"
                                                style={{
                                                    fontSize: '0.8rem',
                                                    lineHeight: 1,
                                                }}
                                            >
                                                <FiExternalLink size={13} />
                                            </Link>
                                        )}
                                    </div>
                                </Card.Header>
                                <Card.Body className="p-3">
                                    <dl className="row small gy-1 mb-0">
                                        <InfoRow
                                            label="Name"
                                            value={rental.customer?.name}
                                            highlight
                                        />
                                        <InfoRow
                                            label="Email"
                                            value={rental.customer?.email}
                                        />
                                        <InfoRow
                                            label="Phone"
                                            value={rental.customer?.phone}
                                        />
                                    </dl>
                                    {rental.customer?.id &&
                                        rental.customer.profile_status ===
                                            'incomplete' && (
                                            <div className="mt-3">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() =>
                                                        sendCompleteProfileLink(
                                                            rental.customer!.id
                                                        )
                                                    }
                                                    disabled={
                                                        isSendingCompleteProfileLink
                                                    }
                                                >
                                                    {isSendingCompleteProfileLink
                                                        ? 'Sending...'
                                                        : 'Send Profile Completion Link'}
                                                </Button>
                                            </div>
                                        )}
                                    {rental.customer?.id &&
                                        rental.customer.profile_status ===
                                            'rejected' && (
                                            <div className="mt-3">
                                                <Button
                                                    variant="outline-warning"
                                                    size="sm"
                                                    onClick={() =>
                                                        requestReupload(
                                                            rental.customer!.id
                                                        )
                                                    }
                                                    disabled={
                                                        isRequestingReupload
                                                    }
                                                >
                                                    {isRequestingReupload
                                                        ? 'Sending...'
                                                        : 'Request Doc Reupload'}
                                                </Button>
                                            </div>
                                        )}
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Header
                                    className="rental-card-subheader py-2 d-flex align-items-center justify-content-between"
                                    style={{
                                        background: '#f8f9fc',
                                        borderBottom: '1px solid #eee',
                                    }}
                                >
                                    <Card.Title
                                        className="small fw-semibold mb-0 text-uppercase text-muted"
                                        style={{
                                            letterSpacing: '0.05em',
                                            fontSize: '0.7rem',
                                        }}
                                    >
                                        Vehicle
                                    </Card.Title>
                                    {rental.vehicle?.id && (
                                        <Link
                                            to={ROUTES.DASHBOARD.VEHICLES.VIEW(
                                                rental.vehicle.id
                                            )}
                                            className="text-primary"
                                            title="View Vehicle"
                                            style={{
                                                fontSize: '0.8rem',
                                                lineHeight: 1,
                                            }}
                                        >
                                            <FiExternalLink size={13} />
                                        </Link>
                                    )}
                                </Card.Header>
                                <Card.Body className="p-3">
                                    <dl className="row small gy-1 mb-0">
                                        <InfoRow
                                            label="Vehicle"
                                            value={rental.vehicle?.name}
                                            highlight
                                        />
                                        <InfoRow
                                            label="Plate"
                                            value={
                                                rental.vehicle?.license_plate
                                            }
                                        />
                                        <InfoRow
                                            label="Daily Rate"
                                            value={fmt(effectiveDailyRate)}
                                        />
                                    </dl>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Schedule */}
                    <Card className="mt-3">
                        <Card.Header className="py-2">
                            <Card.Title className="small fw-semibold mb-0 text-uppercase text-muted">
                                Schedule
                            </Card.Title>
                        </Card.Header>
                        <Card.Body className="p-3">
                            <Row>
                                <Col md={6}>
                                    <dl className="row small gy-1 mb-0">
                                        <InfoRow
                                            label="Pickup"
                                            value={`${formatDate(rental.pickup_date)}${rental.pickup_time ? ', ' + formatTime(rental.pickup_time) : ''}`}
                                        />
                                        {rental.original_return_date && (
                                            <InfoRow
                                                label="Original Return"
                                                value={formatDate(
                                                    rental.original_return_date
                                                )}
                                            />
                                        )}
                                        <InfoRow
                                            label={
                                                rental.original_return_date
                                                    ? 'Extended To'
                                                    : 'Return'
                                            }
                                            value={`${formatDate(rental.return_date)}${rental.return_time ? ', ' + formatTime(rental.return_time) : ''}${rental.extension_days ? ` (+${rental.extension_days}d)` : ''}`}
                                        />
                                        <InfoRow
                                            label="Duration"
                                            value={`${rental.rental_days} day${rental.rental_days !== 1 ? 's' : ''}`}
                                        />
                                    </dl>
                                </Col>
                                <Col md={6}>
                                    <dl className="row small gy-1 mb-0">
                                        {rental.actual_pickup_date && (
                                            <InfoRow
                                                label="Actual Pickup"
                                                value={formatDateTime(
                                                    rental.actual_pickup_date
                                                )}
                                            />
                                        )}
                                        {rental.actual_return_date && (
                                            <InfoRow
                                                label="Actual Return"
                                                value={formatDateTime(
                                                    rental.actual_return_date
                                                )}
                                            />
                                        )}
                                        {rental.is_early_return && (
                                            <InfoRow
                                                label="Actual Days"
                                                value={
                                                    <span className="text-info">
                                                        {
                                                            rental.actual_rental_days
                                                        }
                                                        d (early)
                                                    </span>
                                                }
                                            />
                                        )}
                                        {rental.overdue_breakdown && (
                                            <InfoRow
                                                label="Overdue"
                                                value={
                                                    <span className="text-danger fw-semibold">
                                                        {rental
                                                            .overdue_breakdown
                                                            .type === 'hourly'
                                                            ? `${rental.overdue_breakdown.units} hr${rental.overdue_breakdown.units !== 1 ? 's' : ''}`
                                                            : `${rental.overdue_breakdown.units} day${rental.overdue_breakdown.units !== 1 ? 's' : ''}`}
                                                        {rental.status ===
                                                            'overdue' &&
                                                            !rental.actual_return_date && (
                                                                <span className="text-muted fw-normal ms-1">
                                                                    (running)
                                                                </span>
                                                            )}
                                                    </span>
                                                }
                                            />
                                        )}
                                    </dl>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Pricing */}
                    <Card className="mt-3">
                        <Card.Header className="py-2">
                            <Card.Title className="small fw-semibold mb-0 text-uppercase text-muted">
                                Pricing
                            </Card.Title>
                        </Card.Header>
                        <Card.Body className="p-3">
                            {rental.status === 'cancelled' ? (
                                /* Cancellation pricing breakdown */
                                <dl className="row small gy-1 mb-0">
                                    {/* Days used (after-pickup cancellation) */}
                                    {rental.days_used_cost != null &&
                                        rental.days_used_cost > 0 && (
                                            <InfoRow
                                                label="Days used cost"
                                                value={fmt(
                                                    rental.days_used_cost
                                                )}
                                            />
                                        )}
                                    {/* Add-ons */}
                                    {rental.extras_cost > 0 && (
                                        <InfoRow
                                            label="Add-ons"
                                            value={fmt(rental.extras_cost)}
                                        />
                                    )}
                                    {/* Cancellation fee */}
                                    {(rental.cancellation_fee ?? 0) > 0 && (
                                        <InfoRow
                                            label="Cancellation fee"
                                            value={fmt(rental.cancellation_fee)}
                                        />
                                    )}

                                    {/* Amount incurred subtotal */}
                                    {(() => {
                                        const incurred =
                                            (rental.days_used_cost ?? 0) +
                                            (rental.extras_cost ?? 0) +
                                            (rental.cancellation_fee ?? 0);
                                        return (
                                            <>
                                                <dt className="col-5 fw-semibold border-top pt-2 mt-1">
                                                    Amount Incurred
                                                </dt>
                                                <dd className="col-7 text-end fw-semibold border-top pt-2 mt-1 mb-0">
                                                    {fmtR(incurred)}
                                                </dd>
                                            </>
                                        );
                                    })()}

                                    {/* Original amount paid */}
                                    <InfoRow
                                        label="Original amount paid"
                                        value={fmt(rental.amount_paid)}
                                    />

                                    {/* Deposit deducted from refund */}
                                    {(rental.cancellation_deposit_deduction ??
                                        0) > 0 && (
                                        <InfoRow
                                            label="Deposit deducted"
                                            value={fmt(
                                                rental.cancellation_deposit_deduction
                                            )}
                                        />
                                    )}

                                    {/* Refund due */}
                                    {(rental.refund_amount ?? 0) > 0 && (
                                        <InfoRow
                                            label={
                                                rental.refund_status ===
                                                'approved'
                                                    ? 'Refund issued'
                                                    : 'Refund due'
                                            }
                                            value={
                                                <span className="text-success fw-semibold">
                                                    {fmtR(
                                                        rental.refund_amount ??
                                                            0
                                                    )}
                                                </span>
                                            }
                                        />
                                    )}

                                    {/* Amount owed by customer */}
                                    {(rental.cancellation_amount_owed ?? 0) >
                                        0 &&
                                        !rental.cancellation_debt_waived && (
                                            <InfoRow
                                                label="Amount owed"
                                                value={
                                                    <span className="text-danger fw-semibold">
                                                        {fmtR(
                                                            rental.cancellation_amount_owed ??
                                                                0
                                                        )}
                                                    </span>
                                                }
                                            />
                                        )}
                                    {rental.cancellation_debt_waived && (
                                        <InfoRow
                                            label="Amount owed"
                                            value={
                                                <span className="text-muted text-decoration-line-through">
                                                    {fmt(
                                                        rental.cancellation_amount_owed
                                                    )}{' '}
                                                    (waived)
                                                </span>
                                            }
                                        />
                                    )}
                                </dl>
                            ) : rental.is_early_return &&
                              rental.actual_rental_days != null ? (
                                /* Early return pricing breakdown */
                                <dl className="row small gy-1 mb-0">
                                    {(() => {
                                        const actualDays =
                                            rental.actual_rental_days!;
                                        const bookedDays = rental.rental_days;
                                        const dayRatio =
                                            bookedDays > 0
                                                ? actualDays / bookedDays
                                                : 1;
                                        const baseForActualDays =
                                            Math.round(
                                                actualDays *
                                                    effectiveDailyRate *
                                                    100
                                            ) / 100;

                                        const chargesBreakdown =
                                            rental.applied_charges_breakdown ??
                                            [];
                                        const addonLines =
                                            chargesBreakdown.filter(
                                                c =>
                                                    c.type === 'addon' ||
                                                    c.type === 'extra'
                                            );
                                        const locationLines =
                                            chargesBreakdown.filter(
                                                c => c.type === 'location'
                                            );

                                        const displayAddonLines =
                                            addonLines.map(addon => {
                                                if (addon.is_per_day) {
                                                    const unitRate = Number(
                                                        addon.unit_rate ?? 0
                                                    );
                                                    const qty = Number(
                                                        addon.quantity ?? 1
                                                    );
                                                    return {
                                                        ...addon,
                                                        amount:
                                                            Math.round(
                                                                unitRate *
                                                                    qty *
                                                                    actualDays *
                                                                    100
                                                            ) / 100,
                                                    };
                                                }
                                                return addon;
                                            });

                                        const subtotalForActualDays =
                                            Math.round(
                                                (baseForActualDays +
                                                    displayAddonLines.reduce(
                                                        (s, a) =>
                                                            s +
                                                            Number(a.amount),
                                                        0
                                                    ) +
                                                    locationLines.reduce(
                                                        (s, l) =>
                                                            s +
                                                            Number(l.amount),
                                                        0
                                                    )) *
                                                    100
                                            ) / 100;

                                        const totalDiscount =
                                            rental.total_discount_amount ?? 0;
                                        const vatAmount =
                                            rental.vat_amount ?? 0;
                                        const displayDiscount =
                                            Math.round(
                                                totalDiscount * dayRatio * 100
                                            ) / 100;
                                        const displayVat =
                                            Math.round(
                                                vatAmount * dayRatio * 100
                                            ) / 100;

                                        const earlyReturnCharge =
                                            rental.early_return_charge ?? 0;

                                        const daysUsedCostAnchor =
                                            rental.days_used_cost != null
                                                ? Number(rental.days_used_cost)
                                                : subtotalForActualDays -
                                                  displayDiscount +
                                                  displayVat;
                                        const earlyReturnTotal =
                                            Math.round(
                                                (daysUsedCostAnchor +
                                                    earlyReturnCharge) *
                                                    100
                                            ) / 100;

                                        const overdueFee =
                                            rental.overdue_fee ?? 0;
                                        const latePickupFee =
                                            rental.late_pickup_fee ?? 0;
                                        const hasPostTotalFees =
                                            overdueFee > 0 || latePickupFee > 0;
                                        const grandTotalWithFees =
                                            Math.round(
                                                (earlyReturnTotal +
                                                    overdueFee +
                                                    latePickupFee) *
                                                    100
                                            ) / 100;

                                        const amountPaidVal = Number(
                                            rental.amount_paid ?? 0
                                        );
                                        const earlyReturnBalance =
                                            Math.round(
                                                (amountPaidVal -
                                                    earlyReturnTotal) *
                                                    100
                                            ) / 100;
                                        const hasEarlyBalance =
                                            earlyReturnBalance > 0.005;

                                        return (
                                            <>
                                                {/* Base cost */}
                                                <InfoRow
                                                    label={`${actualDays}d × ${sym ?? currency} ${effectiveDailyRate.toFixed(2)} (days used${bookedDays !== actualDays ? ` - ${bookedDays}d booked` : ''})`}
                                                    value={fmt(
                                                        baseForActualDays
                                                    )}
                                                />

                                                {/* Per-day addons (prorated) and flat addons */}
                                                {displayAddonLines.map(
                                                    (addon, idx) => (
                                                        <InfoRow
                                                            key={idx}
                                                            label={`${addon.label}${addon.is_per_day ? ` (${actualDays}d)` : ''}`}
                                                            value={fmt(
                                                                Number(
                                                                    addon.amount
                                                                )
                                                            )}
                                                        />
                                                    )
                                                )}

                                                {/* Location charges */}
                                                {locationLines.map(
                                                    (loc, idx) => (
                                                        <InfoRow
                                                            key={idx}
                                                            label={loc.label}
                                                            value={fmt(
                                                                Number(
                                                                    loc.amount
                                                                )
                                                            )}
                                                        />
                                                    )
                                                )}

                                                {/* Subtotal - only when there are addons/location */}
                                                {(displayAddonLines.length >
                                                    0 ||
                                                    locationLines.length > 0 ||
                                                    displayDiscount > 0) && (
                                                    <>
                                                        <dt className="col-5 text-muted border-top pt-2 mt-1">
                                                            Subtotal
                                                        </dt>
                                                        <dd className="col-7 text-end mb-0 border-top pt-2 mt-1">
                                                            {fmt(
                                                                subtotalForActualDays
                                                            )}
                                                        </dd>
                                                    </>
                                                )}

                                                {/* Discount (prorated) */}
                                                {displayDiscount > 0 && (
                                                    <InfoRow
                                                        label="Discount"
                                                        value={
                                                            <span className="text-success">
                                                                −
                                                                {fmt(
                                                                    displayDiscount
                                                                )}
                                                            </span>
                                                        }
                                                    />
                                                )}

                                                {/* VAT (prorated) */}
                                                {displayVat > 0 && (
                                                    <InfoRow
                                                        label="VAT"
                                                        value={fmt(displayVat)}
                                                    />
                                                )}

                                                {/* Early return charge (penalty) */}
                                                {earlyReturnCharge > 0 && (
                                                    <InfoRow
                                                        label="Early return charge"
                                                        value={
                                                            <span className="text-danger">
                                                                {fmt(
                                                                    earlyReturnCharge
                                                                )}
                                                            </span>
                                                        }
                                                    />
                                                )}

                                                {/* Total */}
                                                <dt className="col-5 fw-semibold border-top pt-2 mt-1">
                                                    Total
                                                </dt>
                                                <dd className="col-7 text-end fw-semibold border-top pt-2 mt-1 mb-0">
                                                    {fmt(earlyReturnTotal)}
                                                </dd>

                                                {/* Post-total fees (uncommon for early returns) */}
                                                {overdueFee > 0 && (
                                                    <InfoRow
                                                        label={
                                                            rental.overdue_breakdown
                                                                ? rental
                                                                      .overdue_breakdown
                                                                      .type ===
                                                                  'hourly'
                                                                    ? `Overdue (${rental.overdue_breakdown.units}hr × ${sym ?? currency} ${rental.overdue_breakdown.rate.toFixed(2)}/hr)`
                                                                    : `Overdue (${rental.overdue_breakdown.units}d × ${sym ?? currency} ${rental.overdue_breakdown.rate.toFixed(2)}/d)`
                                                                : 'Overdue fee'
                                                        }
                                                        value={
                                                            <span className="text-danger">
                                                                {fmt(
                                                                    overdueFee
                                                                )}
                                                            </span>
                                                        }
                                                    />
                                                )}
                                                {latePickupFee > 0 && (
                                                    <InfoRow
                                                        label="Late Pickup Fee"
                                                        value={
                                                            <span className="text-danger">
                                                                {fmt(
                                                                    latePickupFee
                                                                )}
                                                            </span>
                                                        }
                                                    />
                                                )}
                                                {hasPostTotalFees && (
                                                    <>
                                                        <dt className="col-5 fw-semibold border-top pt-2 mt-1">
                                                            Grand Total
                                                        </dt>
                                                        <dd className="col-7 text-end fw-semibold border-top pt-2 mt-1 mb-0">
                                                            {fmt(
                                                                grandTotalWithFees
                                                            )}
                                                        </dd>
                                                    </>
                                                )}

                                                {/* Amount paid */}
                                                {amountPaidVal > 0 && (
                                                    <InfoRow
                                                        label="Amount Paid"
                                                        value={fmt(
                                                            amountPaidVal
                                                        )}
                                                    />
                                                )}

                                                {/* Early return balance: forfeited or refunded */}
                                                {hasEarlyBalance &&
                                                    !earlyReturnRefundEnabled && (
                                                        <InfoRow
                                                            label="Forfeited (non-refundable)"
                                                            value={
                                                                <span className="text-warning fw-semibold">
                                                                    {fmt(
                                                                        earlyReturnBalance
                                                                    )}
                                                                </span>
                                                            }
                                                        />
                                                    )}
                                                {hasEarlyBalance &&
                                                    earlyReturnRefundEnabled && (
                                                        <InfoRow
                                                            label={
                                                                rental.refund_status ===
                                                                'approved'
                                                                    ? 'Refund Issued'
                                                                    : 'Refund to Customer'
                                                            }
                                                            value={
                                                                <span
                                                                    className={`fw-semibold ${rental.refund_status === 'approved' ? 'text-success' : 'text-info'}`}
                                                                >
                                                                    {fmt(
                                                                        rental.refund_amount ??
                                                                            earlyReturnBalance
                                                                    )}
                                                                    {rental.refund_status ===
                                                                        'pending' && (
                                                                        <span className="text-muted fw-normal ms-1">
                                                                            (pending)
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            }
                                                        />
                                                    )}

                                                {/* Amount due - only when customer underpaid (no positive balance) */}
                                                {!hasEarlyBalance &&
                                                    rental.amount_due > 0 && (
                                                        <InfoRow
                                                            label="Amount Due"
                                                            value={
                                                                <span className="text-danger fw-semibold">
                                                                    {fmt(
                                                                        rental.amount_due
                                                                    )}
                                                                </span>
                                                            }
                                                        />
                                                    )}
                                            </>
                                        );
                                    })()}
                                </dl>
                            ) : (
                                /* Normal pricing breakdown */
                                <dl className="row small gy-1 mb-0">
                                    {(() => {
                                        return (
                                            <>
                                                <InfoRow
                                                    label={`${rental.rental_days}d × ${sym ?? currency} ${effectiveDailyRate.toFixed(2)}`}
                                                    value={fmt(
                                                        rental.base_cost
                                                    )}
                                                />
                                                {rental.extras_cost > 0 && (
                                                    <InfoRow
                                                        label="Add-ons"
                                                        value={fmt(
                                                            rental.extras_cost
                                                        )}
                                                    />
                                                )}
                                                {rental.location_charge > 0 && (
                                                    <InfoRow
                                                        label="Location"
                                                        value={fmt(
                                                            rental.location_charge
                                                        )}
                                                    />
                                                )}
                                                {(rental.extras_cost > 0 ||
                                                    rental.location_charge >
                                                        0 ||
                                                    rental.total_discount_amount >
                                                        0) && (
                                                    <>
                                                        <dt className="col-5 text-muted border-top pt-2 mt-1">
                                                            Subtotal
                                                        </dt>
                                                        <dd className="col-7 text-end mb-0 border-top pt-2 mt-1">
                                                            {fmt(
                                                                rental.subtotal
                                                            )}
                                                        </dd>
                                                    </>
                                                )}
                                                {rental.total_discount_amount >
                                                    0 && (
                                                    <InfoRow
                                                        label="Discount"
                                                        value={
                                                            <span className="text-success">
                                                                -
                                                                {fmtR(
                                                                    rental.total_discount_amount
                                                                )}
                                                            </span>
                                                        }
                                                    />
                                                )}
                                                {rental.vat_amount != null &&
                                                    rental.vat_amount > 0 && (
                                                        <InfoRow
                                                            label="VAT"
                                                            value={fmt(
                                                                rental.vat_amount
                                                            )}
                                                        />
                                                    )}

                                                {/* Total */}
                                                <dt className="col-5 fw-semibold border-top pt-2 mt-1">
                                                    Total Cost
                                                </dt>
                                                <dd className="col-7 text-end fw-semibold border-top pt-2 mt-1 mb-0">
                                                    {fmtR(rental.total_cost)}
                                                </dd>

                                                {/* Overdue + per-day add-ons (after Total Cost) */}
                                                {(() => {
                                                    const bd =
                                                        rental.overdue_breakdown;
                                                    const bakedFee =
                                                        rental.overdue_fee !=
                                                            null &&
                                                        rental.overdue_fee > 0;
                                                    const isLive =
                                                        rental.status ===
                                                            'overdue' &&
                                                        !rental.actual_return_date &&
                                                        bd != null;
                                                    if (!bakedFee && !isLive)
                                                        return null;

                                                    const vehicleCharge =
                                                        bakedFee
                                                            ? rental.overdue_fee! -
                                                              (bd?.per_day_addons_charge ??
                                                                  0)
                                                            : bd!.charge;
                                                    const addonCharge = bakedFee
                                                        ? (bd?.per_day_addons_charge ??
                                                          0)
                                                        : (bd!
                                                              .per_day_addons_charge ??
                                                          0);

                                                    const vehicleLabel = bd
                                                        ? bd.type === 'hourly'
                                                            ? `Overdue (${bd.units}hr × ${sym ?? currency} ${bd.rate.toFixed(2)}/hr)`
                                                            : `Overdue (${bd.units}d × ${sym ?? currency} ${bd.rate.toFixed(2)}/d)`
                                                        : 'Overdue Fee';

                                                    return (
                                                        <>
                                                            <InfoRow
                                                                label={
                                                                    vehicleLabel
                                                                }
                                                                value={
                                                                    <span className="text-danger">
                                                                        {isLive &&
                                                                            '~'}
                                                                        {fmt(
                                                                            vehicleCharge
                                                                        )}
                                                                    </span>
                                                                }
                                                            />
                                                            {addonCharge > 0 &&
                                                                bd && (
                                                                    <InfoRow
                                                                        label={`Overdue add-ons (${bd.units}d × ${sym ?? currency} ${bd.per_day_addons_rate.toFixed(2)}/d)`}
                                                                        value={
                                                                            <span className="text-danger">
                                                                                {isLive &&
                                                                                    '~'}
                                                                                {fmt(
                                                                                    addonCharge
                                                                                )}
                                                                            </span>
                                                                        }
                                                                    />
                                                                )}
                                                        </>
                                                    );
                                                })()}
                                                {rental.late_pickup_fee !=
                                                    null &&
                                                    rental.late_pickup_fee >
                                                        0 && (
                                                        <InfoRow
                                                            label="Late Pickup Fee"
                                                            value={fmt(
                                                                rental.late_pickup_fee
                                                            )}
                                                        />
                                                    )}

                                                <InfoRow
                                                    label="Amount Paid"
                                                    value={fmt(
                                                        rental.amount_paid
                                                    )}
                                                />
                                                {rental.amount_due > 0 && (
                                                    <InfoRow
                                                        label="Amount Due"
                                                        value={
                                                            <span className="text-danger fw-semibold">
                                                                {fmt(
                                                                    rental.amount_due
                                                                )}
                                                            </span>
                                                        }
                                                    />
                                                )}
                                                {(rental.refund_amount ?? 0) >
                                                    0 && (
                                                    <InfoRow
                                                        label={
                                                            rental.refund_status ===
                                                            'approved'
                                                                ? 'Refund Issued'
                                                                : 'Refund to Customer'
                                                        }
                                                        value={
                                                            <span
                                                                className={`fw-semibold ${rental.refund_status === 'approved' ? 'text-success' : 'text-info'}`}
                                                            >
                                                                {fmt(
                                                                    rental.refund_amount
                                                                )}
                                                                {rental.refund_status ===
                                                                    'pending' && (
                                                                    <span className="text-muted fw-normal ms-1">
                                                                        (pending)
                                                                    </span>
                                                                )}
                                                            </span>
                                                        }
                                                    />
                                                )}
                                            </>
                                        );
                                    })()}
                                </dl>
                            )}

                            {rental.status !== 'cancelled' &&
                                rental.coupon_applied && (
                                    <div className="mt-2 px-2 py-1 bg-success bg-opacity-10 rounded small text-success border border-success border-opacity-25">
                                        Coupon Applied:{' '}
                                        <strong>
                                            {rental.coupon_applied.code.toUpperCase()}
                                        </strong>
                                        {' - '}
                                        {rental.coupon_applied.name}
                                        {' ('}
                                        {rental.coupon_applied.type ===
                                        'percentage'
                                            ? `${rental.coupon_applied.value}% off`
                                            : `${fmtR(rental.coupon_applied.value)} off`}
                                        {') − '}
                                        {fmtR(rental.coupon_discount_amount)}
                                    </div>
                                )}
                        </Card.Body>
                    </Card>

                    {/* Inspection Log */}
                    {(rental.inspections?.length ?? 0) > 0 && (
                        <InspectionComparisonCard
                            inspections={rental.inspections!}
                            pickupVideos={rental.pickup_videos}
                            returnVideos={rental.return_videos}
                        />
                    )}

                    {/* Cancellation */}
                    {rental.status === 'cancelled' && (
                        <Card className="mt-3 border-danger-subtle">
                            <Card.Header className="py-2 bg-danger-subtle d-flex align-items-center justify-content-between gap-2">
                                <Card.Title className="small fw-semibold mb-0 text-uppercase text-danger-emphasis">
                                    Cancellation
                                </Card.Title>
                                <div className="d-flex gap-1">
                                    {rental.refund_status && (
                                        <Badge
                                            bg={
                                                rental.refund_status ===
                                                'approved'
                                                    ? 'success'
                                                    : rental.refund_status ===
                                                        'waived'
                                                      ? 'secondary'
                                                      : 'warning'
                                            }
                                            text={
                                                rental.refund_status ===
                                                'pending'
                                                    ? 'dark'
                                                    : undefined
                                            }
                                            className="text-capitalize"
                                        >
                                            Refund: {rental.refund_status}
                                        </Badge>
                                    )}
                                    {rental.cancellation_debt_waived && (
                                        <Badge bg="secondary">
                                            Debt Waived
                                        </Badge>
                                    )}
                                    {(rental.cancellation_amount_owed ?? 0) >
                                        0 &&
                                        !rental.cancellation_debt_waived && (
                                            <Badge bg="danger" text="dark">
                                                Debt Pending
                                            </Badge>
                                        )}
                                </div>
                            </Card.Header>
                            <Card.Body className="p-3">
                                <dl className="row small gy-1 mb-0">
                                    <InfoRow
                                        label="Cancelled By"
                                        value={rental.cancelled_by_type}
                                    />
                                    <InfoRow
                                        label="Cancelled At"
                                        value={formatDateTime(
                                            rental.cancelled_at
                                        )}
                                    />
                                    {rental.cancellation_reason && (
                                        <InfoRow
                                            label="Reason"
                                            value={rental.cancellation_reason}
                                        />
                                    )}
                                    {rental.cancellation_fee != null && (
                                        <InfoRow
                                            label="Cancellation Fee"
                                            value={fmt(rental.cancellation_fee)}
                                        />
                                    )}
                                    {rental.days_used_cost != null && (
                                        <InfoRow
                                            label="Days Used Cost"
                                            value={fmt(rental.days_used_cost)}
                                        />
                                    )}
                                    {rental.refund_amount != null && (
                                        <InfoRow
                                            label="Refund Amount"
                                            value={fmt(rental.refund_amount)}
                                        />
                                    )}
                                    {(rental.cancellation_amount_owed ?? 0) >
                                        0 && (
                                        <InfoRow
                                            label="Amount Owed"
                                            value={
                                                <span className="text-danger fw-semibold">
                                                    {fmt(
                                                        rental.cancellation_amount_owed
                                                    )}
                                                </span>
                                            }
                                        />
                                    )}
                                    {(rental.cancellation_deposit_deduction ??
                                        0) > 0 && (
                                        <InfoRow
                                            label="Deposit Deducted"
                                            value={fmt(
                                                rental.cancellation_deposit_deduction
                                            )}
                                        />
                                    )}
                                </dl>
                                {(() => {
                                    const canSettleRefund =
                                        rental.refund_status === 'pending' ||
                                        ((rental.refund_amount ?? 0) > 0 &&
                                            !['approved', 'waived'].includes(
                                                rental.refund_status ?? ''
                                            )) ||
                                        ((rental.cancellation_amount_owed ??
                                            0) > 0 &&
                                            !rental.cancellation_debt_waived);
                                    const isDebtMode =
                                        (rental.cancellation_amount_owed ?? 0) >
                                            0 &&
                                        rental.refund_status !== 'pending';

                                    return canSettleRefund ? (
                                        <div className="mt-3 d-flex justify-content-end">
                                            <Button
                                                variant={
                                                    isDebtMode
                                                        ? 'outline-warning'
                                                        : 'outline-primary'
                                                }
                                                size="sm"
                                                onClick={() =>
                                                    setShowSettleRefund(true)
                                                }
                                            >
                                                {isDebtMode
                                                    ? 'Resolve Debt'
                                                    : 'Settle Refund'}
                                            </Button>
                                        </div>
                                    ) : null;
                                })()}
                            </Card.Body>
                        </Card>
                    )}
                </Col>

                {/* Right: Sidebar */}
                <Col lg={4}>
                    <div style={{ position: 'sticky', top: '1rem' }}>
                        {/* Overview */}
                        <Card className="mb-3">
                            <Card.Header className="py-2">
                                <Card.Title className="small fw-semibold mb-0 text-uppercase text-muted">
                                    Overview
                                </Card.Title>
                            </Card.Header>
                            <Card.Body className="p-3">
                                <dl className="row small gy-1 mb-0">
                                    <InfoRow
                                        label="Source"
                                        value={rental.source}
                                    />
                                    {rental.branch && (
                                        <InfoRow
                                            label="Branch"
                                            value={rental.branch.name}
                                        />
                                    )}
                                    <InfoRow
                                        label="Payment"
                                        value={
                                            <Badge
                                                bg={
                                                    (rental.total_cost ?? 0) ===
                                                    0
                                                        ? 'success'
                                                        : 'secondary'
                                                }
                                                className="fw-normal"
                                            >
                                                {formatStatus(
                                                    (rental.total_cost ?? 0) ===
                                                        0
                                                        ? 'paid'
                                                        : rental.payment_status
                                                )}
                                            </Badge>
                                        }
                                    />
                                    {rental.settlement_status && (
                                        <InfoRow
                                            label="Settlement"
                                            value={
                                                <Badge
                                                    bg={
                                                        rental.settlement_status ===
                                                        'settled'
                                                            ? 'success'
                                                            : 'warning'
                                                    }
                                                    text={
                                                        rental.settlement_status ===
                                                        'settled'
                                                            ? undefined
                                                            : 'dark'
                                                    }
                                                    className="fw-normal"
                                                >
                                                    {rental.settlement_status}
                                                </Badge>
                                            }
                                        />
                                    )}
                                    {rental.pickup_location && (
                                        <InfoRow
                                            label="Pickup Loc."
                                            value={rental.pickup_location}
                                        />
                                    )}
                                    {rental.dropoff_location && (
                                        <InfoRow
                                            label="Dropoff Loc."
                                            value={rental.dropoff_location}
                                        />
                                    )}
                                </dl>
                            </Card.Body>
                        </Card>

                        {/* Security Deposit */}
                        {!rental.skip_security_deposit &&
                            rental.security_deposit_amount != null && (
                                <Card className="mb-3">
                                    <Card.Header className="py-2">
                                        <Card.Title className="small fw-semibold mb-0 text-uppercase text-muted">
                                            Security Deposit
                                        </Card.Title>
                                    </Card.Header>
                                    <Card.Body className="p-3">
                                        <dl className="row small gy-1 mb-0">
                                            <InfoRow
                                                label="Amount"
                                                value={fmt(
                                                    rental.security_deposit_amount
                                                )}
                                            />
                                            <InfoRow
                                                label="Status"
                                                value={
                                                    rental.security_deposit_status ? (
                                                        <Badge
                                                            bg={
                                                                rental.security_deposit_status ===
                                                                'refunded'
                                                                    ? 'success'
                                                                    : rental.security_deposit_status ===
                                                                        'forfeited'
                                                                      ? 'danger'
                                                                      : rental.security_deposit_status ===
                                                                          'held'
                                                                        ? 'info'
                                                                        : rental.security_deposit_status ===
                                                                            'pending'
                                                                          ? 'warning'
                                                                          : 'secondary'
                                                            }
                                                            className="fw-normal"
                                                        >
                                                            {
                                                                rental.security_deposit_status
                                                            }
                                                        </Badge>
                                                    ) : null
                                                }
                                            />
                                            <InfoRow
                                                label="Paid"
                                                value={fmt(rental.deposit_paid)}
                                            />
                                            {(rental.cancellation_deposit_deduction ??
                                                0) > 0 && (
                                                <InfoRow
                                                    label="Deducted (cancellation)"
                                                    value={fmt(
                                                        rental.cancellation_deposit_deduction
                                                    )}
                                                />
                                            )}
                                            {(rental.deposit_applied_to_balance ??
                                                0) > 0 && (
                                                <InfoRow
                                                    label="Applied to balance"
                                                    value={fmt(
                                                        rental.deposit_applied_to_balance
                                                    )}
                                                />
                                            )}
                                            {rental.damage_settlement_status ===
                                                'forfeited' &&
                                                (rental.actual_repair_cost ??
                                                    0) > 0 && (
                                                    <InfoRow
                                                        label="Damage forfeit"
                                                        value={fmt(
                                                            rental.actual_repair_cost
                                                        )}
                                                    />
                                                )}
                                            {rental.deposit_refunded > 0 && (
                                                <InfoRow
                                                    label="Refunded"
                                                    value={fmt(
                                                        rental.deposit_refunded
                                                    )}
                                                />
                                            )}
                                            {rental.security_deposit_status ===
                                                'held' &&
                                                availableDeposit > 0 && (
                                                    <InfoRow
                                                        label="Refundable"
                                                        value={
                                                            <span className="text-success fw-semibold">
                                                                {fmt(
                                                                    availableDeposit
                                                                )}
                                                            </span>
                                                        }
                                                    />
                                                )}
                                        </dl>
                                        {rental.security_deposit_status ===
                                            'pending' &&
                                            (rental.security_deposit_amount ??
                                                0) > 0 &&
                                            !rental.skip_security_deposit &&
                                            !rental.deposit_waived && (
                                                <Alert
                                                    variant="danger"
                                                    className="mt-3 mb-0 py-2 small"
                                                >
                                                    Security deposit of{' '}
                                                    {fmt(
                                                        rental.security_deposit_amount
                                                    )}{' '}
                                                    will be collected at pickup.
                                                </Alert>
                                            )}
                                        {(canCollectDeposit ||
                                            canRefundDeposit ||
                                            canSendDepositLink) && (
                                            <div className="mt-3 d-flex justify-content-end gap-2">
                                                {canSendDepositLink && (
                                                    <Button
                                                        variant="outline-info"
                                                        size="sm"
                                                        onClick={() =>
                                                            setShowSendDepositPaymentLinkConfirm(
                                                                true
                                                            )
                                                        }
                                                        disabled={
                                                            isSendingDepositPaymentLink
                                                        }
                                                    >
                                                        Send Deposit Link
                                                    </Button>
                                                )}
                                                {canCollectDeposit && (
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() =>
                                                            setShowCollectDeposit(
                                                                true
                                                            )
                                                        }
                                                    >
                                                        Collect Deposit
                                                    </Button>
                                                )}
                                                {canRefundDeposit && (
                                                    <Button
                                                        variant="outline-success"
                                                        size="sm"
                                                        onClick={() =>
                                                            setShowRefundDeposit(
                                                                true
                                                            )
                                                        }
                                                    >
                                                        Refund Deposit
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            )}

                        {/* Damage */}
                        {rental.has_damage && (
                            <Card className="mb-3 border-warning-subtle">
                                <Card.Header className="py-2 bg-warning-subtle d-flex justify-content-between align-items-center">
                                    <Card.Title className="small fw-semibold mb-0 text-uppercase text-warning-emphasis">
                                        Damage
                                    </Card.Title>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="p-0 text-warning-emphasis text-decoration-none small"
                                        onClick={() =>
                                            setShowDamageInvoice(true)
                                        }
                                    >
                                        View Invoice
                                    </Button>
                                </Card.Header>
                                <Card.Body className="p-3">
                                    <dl className="row small gy-1 mb-0">
                                        {rental.damage_settlement_status && (
                                            <InfoRow
                                                label="Settlement"
                                                value={
                                                    <Badge
                                                        bg={
                                                            rental.damage_settlement_status ===
                                                            'settled'
                                                                ? 'success'
                                                                : rental.damage_settlement_status ===
                                                                    'forfeited'
                                                                  ? 'secondary'
                                                                  : 'warning'
                                                        }
                                                        text={
                                                            rental.damage_settlement_status ===
                                                            'pending'
                                                                ? 'dark'
                                                                : undefined
                                                        }
                                                        className="fw-normal"
                                                    >
                                                        {rental.damage_settlement_status ===
                                                        'forfeited'
                                                            ? 'Deposit Used'
                                                            : rental.damage_settlement_status}
                                                    </Badge>
                                                }
                                            />
                                        )}
                                        {rental.estimated_repair_cost !=
                                            null && (
                                            <InfoRow
                                                label="Est. Repair"
                                                value={fmt(
                                                    rental.estimated_repair_cost
                                                )}
                                            />
                                        )}
                                        {rental.actual_repair_cost != null && (
                                            <InfoRow
                                                label="Actual Repair"
                                                value={fmt(
                                                    rental.actual_repair_cost
                                                )}
                                            />
                                        )}
                                        {rental.damage_settlement_status ===
                                            'forfeited' &&
                                            rental.actual_repair_cost !=
                                                null && (
                                                <InfoRow
                                                    label="Deposit Used"
                                                    value={fmt(
                                                        Math.min(
                                                            rental.actual_repair_cost,
                                                            availableDeposit +
                                                                (rental.damage_balance_due ??
                                                                    0)
                                                        )
                                                    )}
                                                />
                                            )}
                                        {(rental.damage_balance_due ?? 0) >
                                            0 && (
                                            <InfoRow
                                                label="Balance Due"
                                                value={
                                                    <span className="text-danger fw-semibold">
                                                        {fmt(
                                                            rental.damage_balance_due
                                                        )}
                                                    </span>
                                                }
                                            />
                                        )}
                                    </dl>
                                    {canCollectDamageBalance && (
                                        <Alert
                                            variant="warning"
                                            className="mt-2 mb-0 py-2 small"
                                        >
                                            Outstanding balance of{' '}
                                            <strong>
                                                {fmt(rental.damage_balance_due)}
                                            </strong>{' '}
                                            pending collection.
                                        </Alert>
                                    )}
                                </Card.Body>
                                {(canSettleDamage ||
                                    canRecordRepairCost ||
                                    canCollectDamageBalance) && (
                                    <PermisssionGuard
                                        permission={
                                            PERMISSIONS.RENTALS.ADD_CHARGES
                                        }
                                    >
                                        <Card.Footer className="py-2 d-flex justify-content-end gap-2">
                                            {canRecordRepairCost && (
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    onClick={() =>
                                                        setShowRecordRepairCost(
                                                            true
                                                        )
                                                    }
                                                >
                                                    Record Repair Cost
                                                </Button>
                                            )}
                                            {canCollectDamageBalance && (
                                                <Button
                                                    variant="outline-success"
                                                    size="sm"
                                                    disabled={
                                                        collectDamageBalanceMutation.isPending
                                                    }
                                                    onClick={() => {
                                                        collectDamageBalanceMutation.mutate(
                                                            rental.id
                                                        );
                                                    }}
                                                >
                                                    {collectDamageBalanceMutation.isPending ? (
                                                        <Spinner
                                                            animation="border"
                                                            size="sm"
                                                        />
                                                    ) : (
                                                        `Collect Balance (${fmt(rental.damage_balance_due)})`
                                                    )}
                                                </Button>
                                            )}
                                            {canSettleDamage && (
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() =>
                                                        setShowDamage(true)
                                                    }
                                                >
                                                    Settle Damage
                                                </Button>
                                            )}
                                        </Card.Footer>
                                    </PermisssionGuard>
                                )}
                            </Card>
                        )}

                        {/* Notes */}
                        {(rental.customer_notes || rental.admin_notes) && (
                            <Card className="mb-3">
                                <Card.Header className="py-2">
                                    <Card.Title className="small fw-semibold mb-0 text-uppercase text-muted">
                                        Notes
                                    </Card.Title>
                                </Card.Header>
                                <Card.Body className="p-3">
                                    {rental.customer_notes && (
                                        <div
                                            className={
                                                rental.admin_notes ? 'mb-2' : ''
                                            }
                                        >
                                            <p className="text-muted small mb-1">
                                                Customer
                                            </p>
                                            <p className="small mb-0">
                                                {rental.customer_notes}
                                            </p>
                                        </div>
                                    )}
                                    {rental.admin_notes && (
                                        <div>
                                            <p className="text-muted small mb-1">
                                                Admin
                                            </p>
                                            <p className="small mb-0">
                                                {rental.admin_notes}
                                            </p>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        )}
                    </div>
                </Col>
            </Row>

            {/* Transaction History */}
            <TransactionHistorySection rentalId={rental.id} />

            {/* Modals */}

            <SwitchVehicleModal
                show={showSwitchVehicle}
                onClose={() => setShowSwitchVehicle(false)}
                rental={rental}
            />

            <ExtendRentalModal
                show={showExtend}
                onClose={() => setShowExtend(false)}
                rental={rental}
            />

            <EditRentalModal
                show={showEditRental}
                onHide={() => setShowEditRental(false)}
                rental={rental}
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
                        <strong>{rental.customer?.name}</strong> at{' '}
                        <strong>{rental.customer?.email}</strong>.
                    </p>
                    <div
                        className="rounded-3 p-3 mb-2"
                        style={{
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                        }}
                    >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small">Amount Due</span>
                            <span className="fw-bold text-success">
                                {fmtR(Math.max(0, rental.amount_due ?? 0))}
                            </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted small">Reference</span>
                            <span className="fw-semibold small">
                                {rental.reference}
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
                        disabled={isSendingPaymentLink}
                        onClick={() => {
                            setShowSendPaymentLinkConfirm(false);
                            sendPaymentLink(rental.id);
                        }}
                    >
                        {isSendingPaymentLink ? 'Sending...' : 'Send Link'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Send Damage Payment Link Confirmation Modal */}
            <Modal
                show={showSendDamagePaymentLinkConfirm}
                onHide={() => setShowSendDamagePaymentLinkConfirm(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Send Damage Payment Link</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="mb-3">
                        Send a damage payment link to{' '}
                        <strong>{rental.customer?.name}</strong> at{' '}
                        <strong>{rental.customer?.email}</strong>.
                    </p>
                    <div
                        className="rounded-3 p-3 mb-2"
                        style={{
                            background: '#fff7ed',
                            border: '1px solid #fed7aa',
                        }}
                    >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small">
                                Damage / Repair Amount
                            </span>
                            <span className="fw-bold text-warning">
                                {fmtR(
                                    rental.damage_balance_due ??
                                        rental.estimated_repair_cost ??
                                        0
                                )}
                            </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted small">Reference</span>
                            <span className="fw-semibold small">
                                {rental.reference}
                            </span>
                        </div>
                    </div>
                    <p className="text-muted small mb-0">
                        The customer will receive an email with a secure link to
                        complete their damage/repair payment online.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() =>
                            setShowSendDamagePaymentLinkConfirm(false)
                        }
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="warning"
                        disabled={isSendingDamagePaymentLink}
                        onClick={() => {
                            setShowSendDamagePaymentLinkConfirm(false);
                            sendDamagePaymentLink(rental.id);
                        }}
                    >
                        {isSendingDamagePaymentLink
                            ? 'Sending...'
                            : 'Send Link'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Send Deposit Payment Link Confirmation Modal */}
            <Modal
                show={showSendDepositPaymentLinkConfirm}
                onHide={() => setShowSendDepositPaymentLinkConfirm(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Send Deposit Payment Link</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="mb-3">
                        Send a security deposit payment link to{' '}
                        <strong>{rental.customer?.name}</strong> at{' '}
                        <strong>{rental.customer?.email}</strong>.
                    </p>
                    <div
                        className="rounded-3 p-3 mb-2"
                        style={{
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                        }}
                    >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small">
                                Security Deposit
                            </span>
                            <span className="fw-bold text-primary">
                                {fmtR(rental.security_deposit_amount ?? 0)}
                            </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted small">Reference</span>
                            <span className="fw-semibold small">
                                {rental.reference}
                            </span>
                        </div>
                    </div>
                    <p className="text-muted small mb-0">
                        The customer will receive an email with a secure link to
                        pay the security deposit online.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() =>
                            setShowSendDepositPaymentLinkConfirm(false)
                        }
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="info"
                        disabled={isSendingDepositPaymentLink}
                        onClick={() => {
                            setShowSendDepositPaymentLinkConfirm(false);
                            sendDepositPaymentLink(rental.id);
                        }}
                    >
                        {isSendingDepositPaymentLink
                            ? 'Sending...'
                            : 'Send Link'}
                    </Button>
                </Modal.Footer>
            </Modal>

            <CustomerProfilePreviewModal
                show={showCustomerPreview}
                onClose={() => setShowCustomerPreview(false)}
                onContinue={() => {
                    setShowCustomerPreview(false);
                    setShowPickup(true);
                }}
                customer={rental.customer}
            />

            <PickupModal
                show={showPickup}
                onClose={() => setShowPickup(false)}
                rental={rental}
                formatCurrency={fmtR}
            />

            <ReturnModal
                show={showReturn}
                onClose={() => setShowReturn(false)}
                rental={rental}
                formatCurrency={fmtR}
            />

            <SettleModal
                show={showSettle}
                onClose={() => setShowSettle(false)}
                rentalId={rental.id}
                amountDue={rental.amount_due}
                currency={sym ?? currency}
            />

            <DamageSettleModal
                show={showDamage}
                onClose={() => setShowDamage(false)}
                rental={rental}
                availableDeposit={availableDeposit}
                onSettled={info => setShowDamageReceipt(info)}
                formatCurrency={fmtR}
            />

            <RecordRepairCostModal
                show={showRecordRepairCost}
                onClose={() => setShowRecordRepairCost(false)}
                rental={rental}
            />

            <DamageInvoiceModal
                show={showDamageInvoice}
                onClose={() => setShowDamageInvoice(false)}
                rental={rental}
                formatCurrency={fmtR}
            />

            <DamageReceiptModal
                show={showDamageReceipt !== null}
                onClose={() => setShowDamageReceipt(null)}
                rental={rental}
                settlementInfo={showDamageReceipt}
                formatCurrency={fmtR}
            />

            <CancelModal
                show={showCancel}
                onClose={() => setShowCancel(false)}
                rentalId={rental.id}
                formatCurrency={fmtR}
            />

            <ApproveReturnModal
                show={showApprove}
                onClose={() => setShowApprove(false)}
                rental={rental}
                formatCurrency={fmtR}
            />

            <ConfirmModal
                show={showCollectDeposit}
                title="Collect Security Deposit"
                message={`Collect ${fmtR(rental.security_deposit_amount ?? 0)} security deposit from the customer?`}
                onConfirm={() =>
                    collectDepositMutation.mutate(rental.id, {
                        onSuccess: () => setShowCollectDeposit(false),
                    })
                }
                onCancel={() => setShowCollectDeposit(false)}
                isPending={collectDepositMutation.isPending}
                variant="primary"
            />

            <ConfirmModal
                show={showRefundDeposit}
                title="Refund Security Deposit"
                message={`Refund ${fmtR(availableDeposit)} security deposit to the customer?`}
                onConfirm={() =>
                    refundDepositMutation.mutate(rental.id, {
                        onSuccess: () => setShowRefundDeposit(false),
                    })
                }
                onCancel={() => setShowRefundDeposit(false)}
                isPending={refundDepositMutation.isPending}
                variant="primary"
            />

            {/* Use Security Deposit to settle balance */}
            <Modal
                show={showUseDeposit}
                onHide={() => setShowUseDeposit(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Use Security Deposit</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {(() => {
                        const willApply = Math.min(
                            depositAvailableForBalance,
                            rental.amount_due
                        );
                        const remainder = rental.amount_due - willApply;
                        const depositLeft =
                            depositAvailableForBalance - willApply;
                        return (
                            <>
                                <dl className="row mb-3 small">
                                    <dt className="col-7">Available deposit</dt>
                                    <dd className="col-5 text-end">
                                        {fmt(depositAvailableForBalance)}
                                    </dd>
                                    <dt className="col-7">Amount due</dt>
                                    <dd className="col-5 text-end text-danger">
                                        {fmt(rental.amount_due)}
                                    </dd>
                                    <dt className="col-7 fw-bold">
                                        Will apply
                                    </dt>
                                    <dd className="col-5 text-end fw-bold">
                                        {fmt(willApply)}
                                    </dd>
                                </dl>
                                <p className="mb-0 small text-muted">
                                    {remainder <= 0
                                        ? `Balance fully cleared. ${depositLeft > 0 ? `Remaining deposit ${fmt(depositLeft)} will be refunded at completion.` : 'Deposit fully consumed.'}`
                                        : `Deposit fully consumed. Remaining balance ${fmt(remainder)} still owed.`}
                                </p>
                            </>
                        );
                    })()}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="light"
                        onClick={() => setShowUseDeposit(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        disabled={settleWithDepositMutation.isPending}
                        onClick={() =>
                            settleWithDepositMutation.mutate(rental.id, {
                                onSuccess: () => setShowUseDeposit(false),
                            })
                        }
                    >
                        {settleWithDepositMutation.isPending ? (
                            <Spinner animation="border" size="sm" />
                        ) : (
                            'Confirm'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            <ConfirmModal
                show={showDelete}
                title="Delete Rental"
                message={`Delete rental ${rental.reference}? This action cannot be undone.`}
                onConfirm={() =>
                    deleteMutation.mutate(rental.id, {
                        onSuccess: () =>
                            navigate(ROUTES.DASHBOARD.RENTALS.ROOT),
                    })
                }
                onCancel={() => setShowDelete(false)}
                isPending={deleteMutation.isPending}
                variant="danger"
            />

            <RefundSettleModal
                show={showSettleRefund}
                onClose={() => setShowSettleRefund(false)}
                rentalId={rental.id}
                formatCurrency={fmtR}
                currentRefundAmount={
                    rental.refund_status === 'pending'
                        ? rental.refund_amount
                        : null
                }
                cancellationAmountOwed={rental.cancellation_amount_owed}
                depositPaid={Math.max(
                    0,
                    rental.deposit_paid -
                        (rental.cancellation_deposit_deduction ?? 0)
                )}
                mutation={settleRefundMutation}
            />
        </Fragment>
    );
}
