import {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
    type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectActiveBranchId } from '@/store/slices/activeBranchSlice';
import { useForm, Controller } from 'react-hook-form';
import { useTusMultiUpload } from '@/shared/hooks/useTusMultiUpload';
import {
    Alert,
    Badge,
    Button,
    Col,
    Dropdown,
    Form,
    Modal,
    Row,
    Spinner,
} from 'react-bootstrap';
import type {
    CancelRentalData,
    ProcessPickupData,
    ProcessReturnData,
    Rental,
    RentalFilters,
    RentalStatus,
} from '@/shared/types/rental.types';
import { rentalService } from '@/services/rentalService';
import {
    rentalKeys,
    useApproveReturn,
    useCancelPreview,
    useCancelRental,
    useConfirmRental,
    useDeleteRental,
    useProcessPickup,
    useProcessReturn,
    useRentals,
} from '@/shared/hooks/queries/useRentals';
import { useBulkDelete } from '@/shared/hooks/queries/useBulkDelete';
import {
    useFormatCurrency,
    useEarlyReturnSettings,
    useGeneralSettings,
} from '@/shared/hooks/queries/useSettings';
import { SVGICON } from '@adminConstants/theme';
import { ROUTES } from '@/shared/routes';
import OverdueBadge from './OverdueBadge';
import CustomerProfilePreviewModal from './CustomerProfilePreviewModal';
import VerifyCustomerModal from '../customers/VerifyCustomerModal';
import DataTable, { type Column } from '@adminComponents/DataTable';
import { FaCheck, FaXmark } from 'react-icons/fa6';
import { formatWithSymbol } from '@/shared/libs/currency';

/* Helpers */
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

const PAYMENT_STATUS_COLORS: Record<string, string> = {
    pending: 'secondary',
    partially_paid: 'warning',
    paid: 'success',
    refunded: 'info',
    overdue: 'danger',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
    pending: 'Pending',
    partially_paid: 'Partial',
    paid: 'Paid',
    refunded: 'Refunded',
    overdue: 'Overdue',
};

const svg3Dots = (
    <svg width="20px" height="20px" viewBox="0 0 24 24" version="1.1">
        <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
            <rect x="0" y="0" width="24" height="24" />
            <circle fill="#000000" cx="5" cy="12" r="2" />
            <circle fill="#000000" cx="12" cy="12" r="2" />
            <circle fill="#000000" cx="19" cy="12" r="2" />
        </g>
    </svg>
);

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
}: {
    tus: ReturnType<typeof useTusMultiUpload>;
    onFilesSelected: (files: File[]) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previews, setPreviews] = useState<{ id: string; url: string }[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files ?? []);
        if (!selected.length) return;
        const newPreviews = selected.map(f => ({
            id: Math.random().toString(36).slice(2),
            url: URL.createObjectURL(f),
        }));
        setPreviews(prev => [...prev, ...newPreviews]);
        onFilesSelected(selected);
        tus.addFiles(selected);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemove = (fileId: string, previewUrl: string) => {
        URL.revokeObjectURL(previewUrl);
        setPreviews(prev => prev.filter(p => p.id !== fileId));
        tus.removeFile(fileId);
    };

    useEffect(() => {
        return () => {
            previews.forEach(p => URL.revokeObjectURL(p.url));
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div>
            <Form.Label>Photos</Form.Label>
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
                                style={{ maxWidth: 200 }}
                            >
                                {f.file.name}
                            </span>
                            {f.status === 'uploading' && (
                                <div
                                    className="progress flex-grow-1"
                                    style={{ height: 6 }}
                                >
                                    <div
                                        className="progress-bar"
                                        style={{ width: `${f.percent}%` }}
                                    />
                                </div>
                            )}
                            {f.status === 'success' && (
                                <span className="text-success">
                                    <FaCheck />
                                </span>
                            )}
                            {f.status === 'error' && (
                                <span className="text-danger">
                                    <FaXmark /> {f.error}
                                </span>
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
                    Add Photos
                </Button>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
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
    rental,
    onClose,
}: {
    show: boolean;
    rental: Rental;
    onClose: () => void;
}) {
    const formatCurrency = useFormatCurrency();
    const fmtR = (n: number) =>
        rental.currency_symbol
            ? formatWithSymbol(n, rental.currency_symbol)
            : formatCurrency(n);
    const pickupMutation = useProcessPickup();
    const tus = useTusMultiUpload({
        endpoint: '/api/v1/uploads/tus',
        entityType: 'rental_inspection_image',
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

    const scheduledPickup = new Date(rental.pickup_date);
    scheduledPickup.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const earlyPickupDays = Math.round(
        (scheduledPickup.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isEarlyPickup = earlyPickupDays > 0;
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
        tus.clearAll();
    }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!pendingSubmitRef.current) return;
        if (tus.isUploading || tus.hasPending) return;
        const data = pendingSubmitRef.current;
        pendingSubmitRef.current = null;
        doPickupSubmit(data);
    }, [tus.isUploading, tus.hasPending]); // eslint-disable-line react-hooks/exhaustive-deps

    const doPickupSubmit = (data: PickupForm) => {
        const tokens = tus.getUploadTokens();
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
                    reset();
                    onClose();
                },
            }
        );
    };

    const onSubmit = (data: PickupForm) => {
        if (tus.isUploading) return;
        if (tus.hasPending) {
            pendingSubmitRef.current = data;
            tus.startAll();
            return;
        }
        doPickupSubmit(data);
    };

    return (
        <Modal show={show} onHide={onClose} centered size="lg">
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
                                    {new Date(
                                        rental.pickup_date
                                    ).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </strong>
                                &nbsp;·&nbsp; Original return:{' '}
                                <strong>
                                    {new Date(
                                        rental.return_date
                                    ).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </strong>
                            </div>
                            <div className="d-flex flex-column gap-2">
                                <Form.Check
                                    type="radio"
                                    id="frt_early_option_shift"
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
                                    id="frt_early_option_keep"
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
                                                {fmtR(approxExtraTotal)} extra
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
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <InspectionPhotoUpload
                                tus={tus}
                                onFilesSelected={() => {}}
                            />
                        </Col>
                        <Col md={12}>
                            <Form.Check
                                type="switch"
                                id="frt_pickup_damage_noted"
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
                                                id={`frt_pickup_damage_type_${dt}`}
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
                                                    id={`frt_pickup_severity_${s}`}
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
                                                    {fmtR(rental.amount_due)}
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
                                                id="frt_collect_deposit"
                                                label={`Deposit collected (${fmtR(rental.security_deposit_amount ?? 0)})`}
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
                        disabled={pickupMutation.isPending || tus.isUploading}
                    >
                        {pickupMutation.isPending ? (
                            <Spinner animation="border" size="sm" />
                        ) : tus.isUploading ? (
                            'Uploading photos…'
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
    rental,
    onClose,
}: {
    show: boolean;
    rental: Rental;
    onClose: () => void;
}) {
    const formatCurrency = useFormatCurrency();
    const fmtR = (n: number) =>
        rental.currency_symbol
            ? formatWithSymbol(n, rental.currency_symbol)
            : formatCurrency(n);
    const returnMutation = useProcessReturn();
    const { data: earlyReturnSettingsRes } = useEarlyReturnSettings();
    const earlyReturnSettings = earlyReturnSettingsRes?.data;
    const tus = useTusMultiUpload({
        endpoint: '/api/v1/uploads/tus',
        entityType: 'rental_inspection_image',
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
        tus.clearAll();
    }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

    const damageNoted = watch('damage_noted');
    const waiveEarlyReturnCharge = watch('waive_early_return_charge');

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

    useEffect(() => {
        if (!pendingReturnSubmitRef.current) return;
        if (tus.isUploading || tus.hasPending) return;
        const data = pendingReturnSubmitRef.current;
        pendingReturnSubmitRef.current = null;
        doReturnSubmit(data);
    }, [tus.isUploading, tus.hasPending]); // eslint-disable-line react-hooks/exhaustive-deps

    const doReturnSubmit = (data: ReturnForm) => {
        const tokens = tus.getUploadTokens();
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
                    reset();
                    onClose();
                },
            }
        );
    };

    const onSubmit = (data: ReturnForm) => {
        if (tus.isUploading) return;
        if (tus.hasPending) {
            pendingReturnSubmitRef.current = data;
            tus.startAll();
            return;
        }
        doReturnSubmit(data);
    };

    return (
        <Modal show={show} onHide={onClose} centered size="lg">
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
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <InspectionPhotoUpload
                                tus={tus}
                                onFilesSelected={() => {}}
                            />
                        </Col>
                        <Col md={12}>
                            <Form.Check
                                type="switch"
                                id="frt_return_damage_noted"
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
                                                id={`frt_damage_type_${dt}`}
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
                                                    id={`frt_severity_${s}`}
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
                                    {new Date(
                                        rental.return_date
                                    ).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                    ).
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
                                                id="frt_waive_early_return_charge"
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
                                                {fmtR(rental.amount_due)}
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
                        disabled={returnMutation.isPending || tus.isUploading}
                    >
                        {returnMutation.isPending ? (
                            <Spinner animation="border" size="sm" />
                        ) : tus.isUploading ? (
                            'Uploading photos…'
                        ) : (
                            'Process Return'
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

/* Cancel Modal */
function CancelModal({
    rental,
    onHide,
}: {
    rental: Rental;
    onHide: () => void;
}) {
    const formatCurrency = useFormatCurrency();
    const fmtR = (n: number) =>
        rental.currency_symbol
            ? formatWithSymbol(n, rental.currency_symbol)
            : formatCurrency(n);
    const { mutate, isPending } = useCancelRental();
    const { data: preview, isLoading: previewLoading } = useCancelPreview(
        rental.id
    );
    const { register, handleSubmit, reset } = useForm<CancelRentalData>({
        defaultValues: { reason: '', cancelled_by_type: 'customer' },
    });

    const onSubmit = (data: CancelRentalData) => {
        mutate(
            { id: rental.id, data },
            {
                onSuccess: () => {
                    reset();
                    onHide();
                },
            }
        );
    };

    return (
        <Modal show onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Cancel Rental - {rental.reference}</Modal.Title>
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
                                    preview.cancellation_fee > 0
                                        ? 'warning'
                                        : 'success'
                                }
                                className="mb-3"
                            >
                                <div className="d-flex justify-content-between">
                                    <span>Cancellation Fee:</span>
                                    <strong>
                                        {fmtR(preview.cancellation_fee)}
                                    </strong>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span>Refund Amount:</span>
                                    <strong>
                                        {fmtR(preview.refund_amount)}
                                    </strong>
                                </div>
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
                        onClick={onHide}
                        disabled={isPending}
                    >
                        Back
                    </Button>
                    <Button type="submit" variant="danger" disabled={isPending}>
                        {isPending ? (
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

/* Column builder */
function buildColumns(
    formatCurrency: (n: number | null | undefined) => string,
    navigate: ReturnType<typeof useNavigate>,
    confirmMutation: { isPending: boolean; mutate: (id: string) => void },
    approveReturnMutation: {
        isPending: boolean;
        mutate: (args: { id: string }) => void;
    },
    setPreviewTarget: (r: Rental) => void,
    setReturnTarget: (r: Rental) => void,
    setDeleteTarget: (r: Rental) => void,
    setCancelTarget: (r: Rental) => void,
    setVerifyCustomerTarget: (c: Rental['customer']) => void,
    showActualReturn: boolean,
    showOverdueColumns: boolean,
    showCancellationColumns: boolean,
    globalSymbol: string
): Column<Rental>[] {
    const overdueColumns: Column<Rental>[] = showOverdueColumns
        ? [
              {
                  key: 'days_overdue',
                  label: 'Overdue Duration',
                  render: rental => {
                      const bd = rental.overdue_breakdown;
                      if (!bd) return <span className="text-muted">-</span>;
                      const label =
                          bd.type === 'hourly'
                              ? `${bd.units} hr${bd.units !== 1 ? 's' : ''}`
                              : `${bd.units} day${bd.units !== 1 ? 's' : ''}`;
                      return <Badge bg="danger">{label}</Badge>;
                  },
              },
              {
                  key: 'overdue_charge',
                  label: 'Overdue Charge',
                  render: rental => {
                      const bd = rental.overdue_breakdown;
                      if (!bd) return <span className="text-muted">-</span>;
                      const sym = rental.currency_symbol ?? undefined;
                      const showConverted = !!(
                          sym &&
                          rental.exchange_rate &&
                          rental.exchange_rate !== 1
                      );
                      const fmtR = (n: number) => {
                          if (showConverted) {
                              return `${formatWithSymbol(n, sym!)} / ${formatWithSymbol(n * rental.exchange_rate!, globalSymbol)}`;
                          }
                          return sym
                              ? formatWithSymbol(n, sym)
                              : formatCurrency(n ?? 0);
                      };
                      const isLive =
                          rental.status === 'overdue' &&
                          rental.overdue_fee == null;
                      const rateLabel =
                          bd.type === 'hourly'
                              ? `${bd.units}hr × ${fmtR(bd.rate)}/hr`
                              : `${bd.units}d × ${fmtR(bd.rate)}/d`;
                      return (
                          <div>
                              <strong className="text-danger">
                                  {isLive && '~'}
                                  {fmtR(bd.charge)}
                              </strong>
                              <div
                                  className="text-muted"
                                  style={{ fontSize: '0.75rem' }}
                              >
                                  {rateLabel}
                              </div>
                          </div>
                      );
                  },
              },
          ]
        : [];

    const cancellationColumns: Column<Rental>[] = showCancellationColumns
        ? [
              {
                  key: 'cancellation_reason',
                  label: 'Reason',
                  render: rental =>
                      rental.cancellation_reason ? (
                          <span
                              className="text-muted"
                              title={rental.cancellation_reason}
                              style={{
                                  maxWidth: 220,
                                  display: 'block',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  cursor: 'help',
                              }}
                          >
                              {rental.cancellation_reason}
                          </span>
                      ) : (
                          <span className="text-muted">-</span>
                      ),
              },
              {
                  key: 'refund_amount',
                  label: 'Refund',
                  render: rental => {
                      const sym = rental.currency_symbol ?? undefined;
                      const showConverted = !!(
                          sym &&
                          rental.exchange_rate &&
                          rental.exchange_rate !== 1
                      );
                      const fmtR = (n: number) => {
                          if (showConverted) {
                              return `${formatWithSymbol(n, sym!)} / ${formatWithSymbol(n * rental.exchange_rate!, globalSymbol)}`;
                          }
                          return sym
                              ? formatWithSymbol(n, sym)
                              : formatCurrency(n ?? 0);
                      };
                      const refund = Number(rental.refund_amount ?? 0);
                      return refund > 0 ? (
                          <div>
                              <strong className="text-success">
                                  {fmtR(refund)}
                              </strong>
                              <div>
                                  <small className="text-muted">
                                      of {fmtR(rental.total_cost)}
                                  </small>
                              </div>
                          </div>
                      ) : (
                          <span className="text-muted small">No refund</span>
                      );
                  },
              },
          ]
        : [];

    return [
        {
            key: 'reference',
            label: 'Reference',
            render: rental => (
                <div>
                    <span
                        className="fw-semibold text-primary"
                        style={{ cursor: 'pointer' }}
                        onClick={() =>
                            navigate(ROUTES.DASHBOARD.RENTALS.VIEW(rental.id))
                        }
                    >
                        {rental.reference}
                    </span>
                    <div className="text-muted small">{rental.source}</div>
                </div>
            ),
        },
        {
            key: 'vehicle',
            label: 'Vehicle',
            render: rental =>
                rental.vehicle ? (
                    <div>
                        <div className="fw-semibold">{rental.vehicle.name}</div>
                        <div className="text-muted small">
                            {rental.vehicle.license_plate}
                        </div>
                    </div>
                ) : (
                    <span className="text-muted">-</span>
                ),
        },
        {
            key: 'customer',
            label: 'Customer',
            render: rental =>
                rental.customer ? (
                    <div>
                        <div className="fw-semibold">
                            {rental.customer.name}
                        </div>
                        <div className="text-muted small">
                            {rental.customer.phone}
                        </div>
                        {rental.customer.profile_status === 'incomplete' && (
                            <Badge
                                bg="warning"
                                text="dark"
                                className="small mt-1"
                            >
                                Profile Incomplete
                            </Badge>
                        )}
                    </div>
                ) : (
                    <span className="text-muted">-</span>
                ),
        },
        {
            key: 'dates',
            label: 'Period',
            render: rental => (
                <div className="small">
                    <div>
                        {new Date(
                            rental.pickup_date + 'T00:00:00'
                        ).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </div>
                    <div className="text-muted">
                        →{' '}
                        {new Date(
                            rental.return_date + 'T00:00:00'
                        ).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </div>
                    {showActualReturn && rental.actual_return_date && (
                        <div className="text-info fw-semibold">
                            Returned:{' '}
                            {new Date(
                                rental.actual_return_date +
                                    (rental.actual_return_date.length === 10
                                        ? 'T00:00:00'
                                        : '')
                            ).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                            })}
                        </div>
                    )}
                    <div className="text-muted">{rental.rental_days}d</div>
                </div>
            ),
        },
        {
            key: 'total',
            label: 'Total',
            render: rental => {
                const isCancelled = rental.status === 'cancelled';
                const refundAmount = Number(rental.refund_amount ?? 0);
                const amountOwed = Number(rental.cancellation_amount_owed ?? 0);
                const sym = rental.currency_symbol ?? undefined;
                const showConverted = !!(
                    sym &&
                    rental.exchange_rate &&
                    rental.exchange_rate !== 1
                );
                const fmtR = (n: number) => {
                    if (showConverted) {
                        return `${formatWithSymbol(n, sym!)} / ${formatWithSymbol(n * rental.exchange_rate!, globalSymbol)}`;
                    }
                    return sym
                        ? formatWithSymbol(n, sym)
                        : formatCurrency(n ?? 0);
                };
                return (
                    <div className="small">
                        <div className="fw-semibold">
                            {fmtR(rental.total_cost)}
                        </div>
                        {isCancelled ? (
                            <>
                                {refundAmount > 0 && (
                                    <div className="text-success">
                                        Refund: {fmtR(refundAmount)}
                                        {rental.refund_status ===
                                            'approved' && (
                                            <span
                                                className="ms-1 badge bg-success fw-normal"
                                                style={{ fontSize: '0.65rem' }}
                                            >
                                                Refunded
                                            </span>
                                        )}
                                    </div>
                                )}
                                {amountOwed > 0 &&
                                    !rental.cancellation_debt_waived && (
                                        <div className="text-danger">
                                            Due: {fmtR(amountOwed)}
                                        </div>
                                    )}
                            </>
                        ) : (
                            rental.amount_due > 0 && (
                                <div className="text-danger">
                                    Due: {fmtR(rental.amount_due)}
                                </div>
                            )
                        )}
                    </div>
                );
            },
        },
        ...overdueColumns,
        ...cancellationColumns,
        ...(!showCancellationColumns
            ? [
                  {
                      key: 'status',
                      label: 'Status',
                      render: (rental: Rental) =>
                          rental.status === 'overdue' ? (
                              <OverdueBadge rental={rental} />
                          ) : (
                              <Badge
                                  bg={
                                      STATUS_COLORS[
                                          rental.status as RentalStatus
                                      ] ?? 'secondary'
                                  }
                                  text={
                                      rental.status === 'cancelled'
                                          ? 'dark'
                                          : undefined
                                  }
                              >
                                  {STATUS_LABELS[
                                      rental.status as RentalStatus
                                  ] ?? rental.status}
                              </Badge>
                          ),
                  },
              ]
            : []),
        {
            key: 'payment_status',
            label: 'Payment',
            render: rental => (
                <Badge
                    bg={
                        PAYMENT_STATUS_COLORS[rental.payment_status] ??
                        'secondary'
                    }
                    text={
                        rental.payment_status === 'partially_paid'
                            ? 'dark'
                            : undefined
                    }
                    className="fw-normal"
                >
                    {PAYMENT_STATUS_LABELS[rental.payment_status] ??
                        rental.payment_status}
                </Badge>
            ),
        },
        {
            key: 'actions',
            label: 'Action',
            className: 'text-end',
            render: rental => (
                <Dropdown align="end">
                    <Dropdown.Toggle
                        variant=""
                        className="btn-link i-false p-0"
                    >
                        {svg3Dots}
                    </Dropdown.Toggle>
                    <Dropdown.Menu
                        popperConfig={{ strategy: 'fixed' }}
                        renderOnMount
                    >
                        <Dropdown.Item
                            onClick={() =>
                                navigate(
                                    ROUTES.DASHBOARD.RENTALS.VIEW(rental.id)
                                )
                            }
                        >
                            {SVGICON.eye} View
                        </Dropdown.Item>

                        <Dropdown.Divider />

                        {rental.status === 'pending' && (
                            <Dropdown.Item
                                className="text-info"
                                onClick={() =>
                                    confirmMutation.mutate(rental.id)
                                }
                                disabled={confirmMutation.isPending}
                            >
                                Confirm Rental
                            </Dropdown.Item>
                        )}

                        {rental.status === 'confirmed' && (
                            <Dropdown.Item
                                className="text-success"
                                onClick={() => setPreviewTarget(rental)}
                            >
                                Process Pickup
                            </Dropdown.Item>
                        )}

                        {['active', 'overdue'].includes(rental.status) && (
                            <Dropdown.Item
                                className="text-warning"
                                onClick={() => setReturnTarget(rental)}
                            >
                                Process Return
                            </Dropdown.Item>
                        )}

                        {rental.status === 'returned' && (
                            <Dropdown.Item
                                className="text-primary"
                                onClick={() =>
                                    approveReturnMutation.mutate({
                                        id: rental.id,
                                    })
                                }
                                disabled={approveReturnMutation.isPending}
                            >
                                Approve &amp; Complete
                            </Dropdown.Item>
                        )}

                        {rental.customer?.profile_status === 'incomplete' && (
                            <>
                                <Dropdown.Divider />
                                <Dropdown.Item
                                    className="text-info"
                                    onClick={() =>
                                        setVerifyCustomerTarget(rental.customer)
                                    }
                                >
                                    Verify Customer
                                </Dropdown.Item>
                            </>
                        )}

                        {!['completed', 'cancelled'].includes(
                            rental.status
                        ) && (
                            <>
                                <Dropdown.Divider />
                                <Dropdown.Item
                                    className="text-danger"
                                    onClick={() => setCancelTarget(rental)}
                                >
                                    Cancel Rental
                                </Dropdown.Item>
                            </>
                        )}

                        <Dropdown.Divider />
                        <Dropdown.Item
                            className="text-danger"
                            onClick={() => setDeleteTarget(rental)}
                        >
                            {SVGICON.trash} Delete
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            ),
        },
    ];
}

/* Shared base component */
function RentalFilteredTable({
    initialFilters,
    title,
    emptyTitle,
    emptyMessage,
    showActualReturn = false,
    showOverdueColumns = false,
    showCancellationColumns = false,
    onAdd,
}: {
    initialFilters: RentalFilters;
    title: string;
    emptyTitle: string;
    emptyMessage: string;
    showActualReturn?: boolean;
    showOverdueColumns?: boolean;
    showCancellationColumns?: boolean;
    onAdd?: () => void;
}) {
    const formatCurrency = useFormatCurrency();
    const { data: generalSettings } = useGeneralSettings();
    const globalSymbol = generalSettings?.data?.currency_symbol ?? '₵';
    const navigate = useNavigate();
    const activeBranchId = useSelector(selectActiveBranchId);

    const [filters, setFilters] = useState<RentalFilters>({
        per_page: 15,
        sort: '-created_at',
        ...(activeBranchId ? { 'filter[branch_id]': activeBranchId } : {}),
        ...initialFilters,
    });

    useEffect(() => {
        setFilters(prev => ({
            ...prev,
            'filter[branch_id]': activeBranchId ?? undefined,
            page: 1,
        }));
    }, [activeBranchId]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<Rental | null>(null);
    const [previewTarget, setPreviewTarget] = useState<Rental | null>(null);
    const [pickupTarget, setPickupTarget] = useState<Rental | null>(null);
    const [returnTarget, setReturnTarget] = useState<Rental | null>(null);
    const [cancelTarget, setCancelTarget] = useState<Rental | null>(null);
    const [verifyCustomerTarget, setVerifyCustomerTarget] = useState<
        Rental['customer'] | null
    >(null);

    const { data: response, isLoading, isError } = useRentals(filters);
    const deleteMutation = useDeleteRental();
    const confirmMutation = useConfirmRental();
    const approveReturnMutation = useApproveReturn();
    const { bulkDelete, isBulkDeleting } = useBulkDelete({
        deleteFn: id => rentalService.delete(id),
        invalidateKeys: [rentalKeys.lists()],
        entityName: 'rental',
        onSuccess: () => setSelectedIds([]),
    });

    const rentals = useMemo<Rental[]>(() => response?.data ?? [], [response]);
    const meta = response?.meta ?? null;

    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }));
    }, []);

    const toggleSelectAll = useCallback(() => {
        setSelectedIds(prev =>
            prev.length === rentals.length ? [] : rentals.map(r => r.id)
        );
    }, [rentals]);

    const toggleOne = useCallback((id: string | number) => {
        setSelectedIds(prev =>
            prev.includes(String(id))
                ? prev.filter(x => x !== String(id))
                : [...prev, String(id)]
        );
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (!deleteTarget) return;
        deleteMutation.mutate(deleteTarget.id, {
            onSettled: () => setDeleteTarget(null),
        });
    }, [deleteTarget, deleteMutation]);

    const columns = buildColumns(
        formatCurrency,
        navigate,
        confirmMutation,
        approveReturnMutation,
        setPreviewTarget,
        setReturnTarget,
        setDeleteTarget,
        setCancelTarget,
        setVerifyCustomerTarget,
        showActualReturn,
        showOverdueColumns,
        showCancellationColumns,
        globalSymbol
    );

    const headerActions: ReactNode = onAdd ? (
        <button
            type="button"
            onClick={onAdd}
            className="btn btn-primary btn-sm"
        >
            {SVGICON.plus} New Rental
        </button>
    ) : null;

    return (
        <>
            <DataTable
                title={title}
                data={rentals}
                columns={columns}
                meta={meta}
                isLoading={isLoading}
                isError={isError}
                selectedIds={selectedIds}
                onSelectAll={toggleSelectAll}
                onSelectOne={toggleOne}
                onBulkDelete={() => bulkDelete(selectedIds)}
                isBulkDeleting={isBulkDeleting}
                deleteTarget={deleteTarget}
                deleteTargetName={deleteTarget?.reference}
                onDeleteRequest={setDeleteTarget}
                onDeleteConfirm={handleDeleteConfirm}
                onDeleteCancel={() => setDeleteTarget(null)}
                isDeleting={deleteMutation.isPending}
                onPageChange={handlePageChange}
                headerActions={headerActions}
                emptyTitle={emptyTitle}
                emptyMessage={emptyMessage}
            />

            <CustomerProfilePreviewModal
                show={!!previewTarget}
                customer={previewTarget?.customer ?? null}
                onClose={() => setPreviewTarget(null)}
                onContinue={() => {
                    setPickupTarget(previewTarget);
                    setPreviewTarget(null);
                }}
            />
            {verifyCustomerTarget && (
                <VerifyCustomerModal
                    show={!!verifyCustomerTarget}
                    customer={verifyCustomerTarget}
                    onClose={() => setVerifyCustomerTarget(null)}
                />
            )}
            <PickupModal
                show={!!pickupTarget}
                rental={pickupTarget ?? ({} as Rental)}
                onClose={() => setPickupTarget(null)}
            />
            <ReturnModal
                show={!!returnTarget}
                rental={returnTarget ?? ({} as Rental)}
                onClose={() => setReturnTarget(null)}
            />
            {cancelTarget && (
                <CancelModal
                    rental={cancelTarget}
                    onHide={() => setCancelTarget(null)}
                />
            )}
        </>
    );
}

/* Named Exports */
export function PendingRentals({ onAdd }: { onAdd?: () => void }) {
    return (
        <RentalFilteredTable
            initialFilters={{ 'filter[status]': 'pending' }}
            title="Pending Rentals"
            emptyTitle="No pending rentals"
            emptyMessage="No rentals are awaiting confirmation."
            onAdd={onAdd}
        />
    );
}

export function ConfirmedRentals({ onAdd }: { onAdd?: () => void }) {
    return (
        <RentalFilteredTable
            initialFilters={{ 'filter[status]': 'confirmed' }}
            title="Confirmed Rentals"
            emptyTitle="No confirmed rentals"
            emptyMessage="No rentals are currently confirmed and awaiting pickup."
            onAdd={onAdd}
        />
    );
}

export function ActiveRentals({ onAdd }: { onAdd?: () => void }) {
    return (
        <RentalFilteredTable
            initialFilters={{ 'filter[status]': 'active' }}
            title="Active Rentals"
            emptyTitle="No active rentals"
            emptyMessage="No vehicles are currently out on rental."
            onAdd={onAdd}
        />
    );
}

export function OverdueRentals() {
    return (
        <RentalFilteredTable
            initialFilters={{ 'filter[status]': 'overdue' }}
            title="Overdue Rentals"
            emptyTitle="No overdue rentals"
            emptyMessage="Great - no rentals are currently overdue."
            showOverdueColumns
        />
    );
}

export function ReturnedRentals() {
    return (
        <RentalFilteredTable
            initialFilters={{ 'filter[status]': 'returned' }}
            title="Returned - Pending Approval"
            emptyTitle="No rentals pending approval"
            emptyMessage="All returned vehicles have been reviewed and approved."
            showActualReturn
        />
    );
}

export function CompletedRentals() {
    return (
        <RentalFilteredTable
            initialFilters={{ 'filter[status]': 'completed' }}
            title="Completed Rentals"
            emptyTitle="No completed rentals"
            emptyMessage="No rentals have been completed yet."
            showActualReturn
        />
    );
}

export function CancelledRentals() {
    return (
        <RentalFilteredTable
            initialFilters={{ 'filter[status]': 'cancelled' }}
            title="Cancelled Rentals"
            emptyTitle="No cancelled rentals"
            emptyMessage="No rentals have been cancelled."
            showCancellationColumns
        />
    );
}
