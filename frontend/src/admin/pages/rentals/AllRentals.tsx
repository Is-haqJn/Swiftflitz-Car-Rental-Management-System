import {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
    type ReactNode,
} from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useTusMultiUpload } from '@/shared/hooks/useTusMultiUpload';
import {
    Alert,
    Form,
    Row,
    Col,
    InputGroup,
    Badge,
    Dropdown,
    Modal,
    Button,
    Spinner,
} from 'react-bootstrap';
import type {
    Rental,
    RentalFilters,
    RentalStatus,
    ProcessPickupData,
    ProcessReturnData,
    CancelRentalData,
} from '@/shared/types/rental.types';
import { rentalService } from '@/services/rentalService';
import {
    useRentals,
    useDeleteRental,
    useConfirmRental,
    useCancelPreview,
    useCancelRental,
    useProcessPickup,
    useProcessReturn,
    rentalKeys,
} from '@/shared/hooks/queries/useRentals';
import { useActiveBranches } from '@/shared/hooks/queries/useBranches';
import { useBulkDelete } from '@/shared/hooks/queries/useBulkDelete';
import { selectAuthUser } from '@/store/slices/authSlice';
import { selectActiveBranchId } from '@/store/slices/activeBranchSlice';
import { useTitle } from '@/shared/hooks';
import { SVGICON } from '@adminConstants/theme';
import { PERMISSIONS } from '@/shared/config/permissions';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import DataTable, { type Column } from '@adminComponents/DataTable';
import FilterBox from '@adminComponents/ui/FilterBox';
import {
    useCancellationSettings,
    useFormatCurrency,
    useEarlyReturnSettings,
    useGeneralSettings,
} from '@/shared/hooks/queries/useSettings';
import { formatWithSymbol } from '@/shared/libs/currency';
import { ROUTES } from '@/shared/routes';
import OverdueBadge from './OverdueBadge';
import CustomerProfilePreviewModal from './CustomerProfilePreviewModal';
import VerifyCustomerModal from '../customers/VerifyCustomerModal';
import { FaCheck, FaXmark } from 'react-icons/fa6';

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

interface AllRentalsProps {
    initialFilters?: RentalFilters;
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
    formatCurrency: formatCurrencyProp,
}: {
    show: boolean;
    rental: Rental;
    onClose: () => void;
    formatCurrency?: (n: number) => string;
}) {
    const formatCurrencyFallback = useFormatCurrency();
    const formatCurrency = formatCurrencyProp ?? formatCurrencyFallback;
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
                                    id="ar_early_option_shift"
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
                                    id="ar_early_option_keep"
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
                                id="ar_pickup_damage_noted"
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
                                                id={`ar_pickup_damage_type_${dt}`}
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
                                                    id={`ar_pickup_severity_${s}`}
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
                                                id="ar_collect_deposit"
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
    formatCurrency: formatCurrencyProp,
}: {
    show: boolean;
    rental: Rental;
    onClose: () => void;
    formatCurrency?: (n: number) => string;
}) {
    const formatCurrencyFallback = useFormatCurrency();
    const formatCurrency = formatCurrencyProp ?? formatCurrencyFallback;
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
                                id="ar_return_damage_noted"
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
                                                id={`ar_damage_type_${dt}`}
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
                                                    id={`ar_severity_${s}`}
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
                                                id="ar_waive_early_return_charge"
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

/* Cancel Modal (with preview) */
function CancelRentalModal({
    rental,
    onHide,
}: {
    rental: Rental;
    onHide: () => void;
}) {
    const formatCurrency = useFormatCurrency();
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
                                        {formatCurrency(
                                            preview.cancellation_fee
                                        )}
                                    </strong>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span>Refund Amount:</span>
                                    <strong>
                                        {formatCurrency(preview.refund_amount)}
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

/* Main Component */
export default function AllRentals({ initialFilters }: AllRentalsProps) {
    const formatCurrency = useFormatCurrency();
    const { data: generalSettings } = useGeneralSettings();
    const globalSymbol = generalSettings?.data?.currency_symbol ?? 'GHS';
    const fmtForRental =
        (rental: Rental) =>
        (n: number): string => {
            const showDual =
                !!rental.exchange_rate &&
                rental.exchange_rate !== 1 &&
                (!activeBranchId || activeBranchId !== rental.branch_id);
            if (showDual && rental.exchange_rate && rental.currency_symbol) {
                return `${formatWithSymbol(n, rental.currency_symbol)} / ${formatWithSymbol(n * rental.exchange_rate, globalSymbol)}`;
            }
            return rental.currency_symbol
                ? formatWithSymbol(n, rental.currency_symbol)
                : formatCurrency(n);
        };
    const navigate = useNavigate();
    const title = useTitle('All Rentals');
    const authUser = useSelector(selectAuthUser);
    const activeBranchId = useSelector(selectActiveBranchId);
    const { data: cancellationSettingsRes } = useCancellationSettings();
    const cancellationCutoffDays =
        cancellationSettingsRes?.data?.cancellation_cutoff_days ?? 0;

    const hasGlobalBranchAccess = !(authUser?.branches?.length ?? 0);

    const { data: branchesResponse } = useActiveBranches();
    // After BranchRepository scoping: admins get all branches, managers get only theirs
    const allBranches = branchesResponse?.data ?? [];

    const [filters, setFilters] = useState<RentalFilters>({
        page: 1,
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
    const [search, setSearch] = useState('');
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
    const { bulkDelete, isBulkDeleting } = useBulkDelete({
        deleteFn: id => rentalService.delete(id),
        invalidateKeys: [rentalKeys.lists()],
        entityName: 'rental',
        onSuccess: () => setSelectedIds([]),
    });

    const rentals = useMemo<Rental[]>(() => response?.data ?? [], [response]);
    const meta = response?.meta ?? null;

    /* Handlers */
    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }));
    }, []);

    const handleSearch = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            setFilters(prev => ({
                ...prev,
                'filter[search]': search || undefined,
                page: 1,
            }));
        },
        [search]
    );

    const handleClearFilters = useCallback(() => {
        setSearch('');
        setFilters({ page: 1, per_page: 15, ...initialFilters });
    }, [initialFilters]);

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

    /* Columns */
    const columns: Column<Rental>[] = [
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
                    <div className="text-muted">{rental.rental_days}d</div>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: rental =>
                rental.status === 'overdue' ? (
                    <OverdueBadge rental={rental} />
                ) : (
                    <Badge
                        bg={
                            STATUS_COLORS[rental.status as RentalStatus] ??
                            'secondary'
                        }
                        text={
                            rental.status === 'cancelled' ? 'dark' : undefined
                        }
                    >
                        {STATUS_LABELS[rental.status as RentalStatus] ??
                            rental.status}
                    </Badge>
                ),
        },
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
            key: 'total',
            label: 'Total',
            render: rental => {
                const isCancelled = rental.status === 'cancelled';
                const refundAmount = Number(rental.refund_amount ?? 0);
                const amountOwed = Number(rental.cancellation_amount_owed ?? 0);
                const showConverted =
                    !!rental.exchange_rate &&
                    rental.exchange_rate !== 1 &&
                    (!activeBranchId || activeBranchId !== rental.branch_id);
                const fmt = (n: number) => {
                    if (
                        showConverted &&
                        rental.exchange_rate &&
                        rental.currency_symbol
                    ) {
                        const globalAmt = n * rental.exchange_rate;
                        return `${formatWithSymbol(n, rental.currency_symbol)} / ${formatWithSymbol(globalAmt, globalSymbol)}`;
                    }
                    return rental.currency_symbol
                        ? formatWithSymbol(n, rental.currency_symbol)
                        : formatCurrency(n);
                };
                return (
                    <div className="small">
                        <div className="fw-semibold">
                            {fmt(rental.total_cost)}
                        </div>
                        {isCancelled ? (
                            <>
                                {refundAmount > 0 && (
                                    <div className="text-success">
                                        Refund: {fmt(refundAmount)}
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
                                            Due: {fmt(amountOwed)}
                                        </div>
                                    )}
                            </>
                        ) : (
                            rental.amount_due > 0 && (
                                <div className="text-danger">
                                    Due: {fmt(rental.amount_due)}
                                </div>
                            )
                        )}
                    </div>
                );
            },
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
                        <svg
                            width="20px"
                            height="20px"
                            viewBox="0 0 24 24"
                            version="1.1"
                        >
                            <g
                                stroke="none"
                                strokeWidth="1"
                                fill="none"
                                fillRule="evenodd"
                            >
                                <rect x="0" y="0" width="24" height="24" />
                                <circle fill="#000000" cx="5" cy="12" r="2" />
                                <circle fill="#000000" cx="12" cy="12" r="2" />
                                <circle fill="#000000" cx="19" cy="12" r="2" />
                            </g>
                        </svg>
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
                            View
                        </Dropdown.Item>

                        <Dropdown.Divider />

                        {rental.status === 'pending' && (
                            <PermisssionGuard
                                permission={PERMISSIONS.RENTALS.UPDATE_STATUS}
                            >
                                <Dropdown.Item
                                    className="text-info"
                                    onClick={() =>
                                        confirmMutation.mutate(rental.id)
                                    }
                                    disabled={confirmMutation.isPending}
                                >
                                    Confirm Rental
                                </Dropdown.Item>
                            </PermisssionGuard>
                        )}

                        {rental.status === 'confirmed' && (
                            <PermisssionGuard
                                permission={PERMISSIONS.RENTALS.PROCESS_PICKUP}
                            >
                                <Dropdown.Item
                                    className="text-success"
                                    onClick={() => setPreviewTarget(rental)}
                                >
                                    Process Pickup
                                </Dropdown.Item>
                            </PermisssionGuard>
                        )}

                        {['active', 'overdue'].includes(rental.status) && (
                            <PermisssionGuard
                                permission={PERMISSIONS.RENTALS.MARK_RETURNED}
                            >
                                <Dropdown.Item
                                    className="text-warning"
                                    onClick={() => setReturnTarget(rental)}
                                >
                                    Process Return
                                </Dropdown.Item>
                            </PermisssionGuard>
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

                        {!['completed', 'cancelled', 'returned'].includes(
                            rental.status
                        ) &&
                            !(
                                ['active', 'overdue'].includes(rental.status) &&
                                cancellationCutoffDays > 0 &&
                                (() => {
                                    const cutoff = new Date(rental.return_date);
                                    cutoff.setDate(
                                        cutoff.getDate() -
                                            cancellationCutoffDays
                                    );
                                    cutoff.setHours(0, 0, 0, 0);
                                    return new Date() >= cutoff;
                                })()
                            ) && (
                                <PermisssionGuard
                                    permission={
                                        PERMISSIONS.RENTALS.UPDATE_STATUS
                                    }
                                >
                                    <>
                                        <Dropdown.Divider />
                                        <Dropdown.Item
                                            className="text-danger"
                                            onClick={() =>
                                                setCancelTarget(rental)
                                            }
                                        >
                                            Cancel Rental
                                        </Dropdown.Item>
                                    </>
                                </PermisssionGuard>
                            )}

                        <PermisssionGuard
                            permission={PERMISSIONS.RENTALS.DELETE}
                        >
                            <>
                                <Dropdown.Divider />
                                <Dropdown.Item
                                    className="text-danger"
                                    onClick={() => setDeleteTarget(rental)}
                                >
                                    Delete
                                </Dropdown.Item>
                            </>
                        </PermisssionGuard>
                    </Dropdown.Menu>
                </Dropdown>
            ),
        },
    ];

    /* Header Actions */
    const headerActions: ReactNode = (
        <PermisssionGuard permission={PERMISSIONS.RENTALS.CREATE}>
            <div className="d-flex gap-2">
                <button
                    type="button"
                    onClick={() => navigate(ROUTES.DASHBOARD.RENTALS.CREATE)}
                    className="btn btn-outline-secondary btn-sm"
                >
                    Existing Customer
                </button>
                <button
                    type="button"
                    onClick={() =>
                        navigate(ROUTES.DASHBOARD.RENTALS.NEW_BOOKING)
                    }
                    className="btn btn-primary btn-sm"
                >
                    {SVGICON.plus} New Booking
                </button>
            </div>
        </PermisssionGuard>
    );

    /* Render */
    return (
        <>
            {title}

            <FilterBox title="Filter Rentals">
                <Form onSubmit={handleSearch}>
                    <Row className="g-3 align-items-end">
                        <Col md={3}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Search
                            </Form.Label>
                            <InputGroup>
                                <Form.Control
                                    placeholder="Reference, customer, vehicle…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    Search
                                </button>
                            </InputGroup>
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Status
                            </Form.Label>
                            <Form.Select
                                className="tw:h-[2.9rem]"
                                value={filters['filter[status]'] ?? ''}
                                onChange={e =>
                                    setFilters(prev => ({
                                        ...prev,
                                        'filter[status]':
                                            e.target.value || undefined,
                                        page: 1,
                                    }))
                                }
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="active">Active</option>
                                <option value="overdue">Overdue</option>
                                <option value="returned">Returned</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Source
                            </Form.Label>
                            <Form.Select
                                className="tw:h-[2.9rem]"
                                value={filters['filter[source]'] ?? ''}
                                onChange={e =>
                                    setFilters(prev => ({
                                        ...prev,
                                        'filter[source]':
                                            e.target.value || undefined,
                                        page: 1,
                                    }))
                                }
                            >
                                <option value="">All Sources</option>
                                <option value="website">Website</option>
                                <option value="phone">Phone</option>
                                <option value="walk_in">Walk-in</option>
                                <option value="referral">Referral</option>
                                <option value="quote_request">Quote</option>
                            </Form.Select>
                        </Col>
                        {(hasGlobalBranchAccess
                            ? allBranches.length > 0
                            : allBranches.length > 1) && (
                            <Col md={2}>
                                <Form.Label className="small fw-semibold text-muted mb-1">
                                    Branch
                                </Form.Label>
                                <Form.Select
                                    className="tw:h-[2.9rem]"
                                    value={filters['filter[branch_id]'] ?? ''}
                                    onChange={e =>
                                        setFilters(prev => ({
                                            ...prev,
                                            'filter[branch_id]':
                                                e.target.value || undefined,
                                            page: 1,
                                        }))
                                    }
                                >
                                    <option value="">
                                        {hasGlobalBranchAccess
                                            ? 'All Branches'
                                            : 'All My Branches'}
                                    </option>
                                    {allBranches.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Col>
                        )}
                        <Col md={1}>
                            <Form.Label className="small fw-semibold text-muted mb-1">
                                Per Page
                            </Form.Label>
                            <Form.Select
                                className="tw:h-[2.9rem]"
                                value={filters.per_page ?? 15}
                                onChange={e =>
                                    setFilters(prev => ({
                                        ...prev,
                                        per_page: Number(e.target.value),
                                        page: 1,
                                    }))
                                }
                            >
                                <option value={10}>10</option>
                                <option value={15}>15</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </Form.Select>
                        </Col>
                        <Col md={1}>
                            <button
                                type="button"
                                className="btn btn-outline-secondary w-100"
                                onClick={handleClearFilters}
                            >
                                Clear
                            </button>
                        </Col>
                    </Row>
                </Form>
            </FilterBox>

            <DataTable
                title="All Rentals"
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
                emptyTitle="No rentals found"
                emptyMessage="Create your first rental to get started."
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
                formatCurrency={
                    pickupTarget ? fmtForRental(pickupTarget) : undefined
                }
            />
            <ReturnModal
                show={!!returnTarget}
                rental={returnTarget ?? ({} as Rental)}
                onClose={() => setReturnTarget(null)}
                formatCurrency={
                    returnTarget ? fmtForRental(returnTarget) : undefined
                }
            />
            {cancelTarget && (
                <CancelRentalModal
                    rental={cancelTarget}
                    onHide={() => setCancelTarget(null)}
                />
            )}
        </>
    );
}
