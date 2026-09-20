import { useEffect } from 'react';
import { Card, Form, Row, Col, Button } from 'react-bootstrap';
import { SkeletonFormRows } from '@/shared/components/ui/Skeleton';
import { useForm } from 'react-hook-form';
import { applyServerErrors } from '@/shared/libs/utils';
import type {
    PricingSettingsData,
    CancellationSettingsData,
    OverdueSettingsData,
    EarlyReturnSettingsData,
} from '@/shared/types';
import {
    usePricingSettings,
    useUpdatePricingSettings,
    useCancellationSettings,
    useUpdateCancellationSettings,
    useOverdueSettings,
    useUpdateOverdueSettings,
    useEarlyReturnSettings,
    useUpdateEarlyReturnSettings,
} from '@/shared/hooks/queries/useSettings';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';
import { useTitle } from '@/shared/hooks';

/* Card 1: Payment Settings */
function PaymentSettingsCard() {
    const { data: res, isLoading } = usePricingSettings();
    const updateMutation = useUpdatePricingSettings();
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setError,
        formState: { errors },
    } = useForm<PricingSettingsData>();

    const onlineDepositEnabled = watch('online_deposit_enabled');

    useEffect(() => {
        if (res?.data) reset(res.data);
    }, [res?.data, reset]);

    const onSubmit = (data: PricingSettingsData) => {
        const payload: PricingSettingsData = {
            payment_strict_mode: data.payment_strict_mode,
            online_deposit_enabled: data.online_deposit_enabled,
            online_deposit_percentage: data.online_deposit_percentage,
            balance_due_window_hours: data.balance_due_window_hours,
        };
        updateMutation.mutate(payload, {
            onError: error => applyServerErrors(error, setError),
        });
    };

    if (isLoading) {
        return <SkeletonFormRows rows={4} />;
    }

    return (
        <Card className="mb-4">
            <Card.Header>
                <Card.Title>Payment Settings</Card.Title>
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row className="g-3">
                        <Col md={12} className="d-flex flex-column gap-2 mb-2">
                            <div>
                                <Form.Check
                                    type="switch"
                                    id="payment_strict_mode"
                                    label="Strict Payment Mode"
                                    isInvalid={!!errors.payment_strict_mode}
                                    {...register('payment_strict_mode')}
                                />
                                <Form.Text className="text-muted">
                                    Payment must be completed before pickup is
                                    allowed.
                                </Form.Text>
                            </div>
                            <div>
                                <Form.Check
                                    type="switch"
                                    id="online_deposit_enabled"
                                    label="Allow Online Partial Deposit"
                                    isInvalid={!!errors.online_deposit_enabled}
                                    {...register('online_deposit_enabled')}
                                />
                                <Form.Text className="text-muted">
                                    Customers can pay a percentage upfront when
                                    booking online; the balance is due before
                                    pickup.
                                </Form.Text>
                            </div>
                        </Col>

                        {onlineDepositEnabled && (
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Online Deposit (%)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        max={100}
                                        isInvalid={
                                            !!errors.online_deposit_percentage
                                        }
                                        {...register(
                                            'online_deposit_percentage',
                                            {
                                                valueAsNumber: true,
                                            }
                                        )}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {
                                            errors.online_deposit_percentage
                                                ?.message
                                        }
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        )}

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    Balance Due Window (hours before pickup)
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    min={0}
                                    isInvalid={
                                        !!errors.balance_due_window_hours
                                    }
                                    {...register('balance_due_window_hours', {
                                        valueAsNumber: true,
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.balance_due_window_hours?.message}
                                </Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                    How many hours before pickup the remaining
                                    balance becomes due. Set to 0 to require
                                    payment immediately.
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end mt-3">
                        <PermisssionGuard
                            permission={PERMISSIONS.SETTINGS.EDIT_PRICING}
                        >
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending
                                    ? 'Saving...'
                                    : 'Save'}
                            </Button>
                        </PermisssionGuard>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
}

/* Card 2: Cancellation & No-Show */
function CancellationSettingsCard() {
    const { data: res, isLoading } = useCancellationSettings();
    const updateMutation = useUpdateCancellationSettings();
    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<CancellationSettingsData>();

    useEffect(() => {
        if (res?.data) reset(res.data);
    }, [res?.data, reset]);

    const onSubmit = (data: CancellationSettingsData) => {
        updateMutation.mutate(data, {
            onError: error => applyServerErrors(error, setError),
        });
    };

    if (isLoading) {
        return <SkeletonFormRows rows={4} />;
    }

    return (
        <Card className="mb-4">
            <Card.Header>
                <Card.Title>Cancellation &amp; No-Show</Card.Title>
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    Free Cancellation Window (hours before
                                    pickup)
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    min={0}
                                    isInvalid={
                                        !!errors.free_cancellation_window_hours
                                    }
                                    {...register(
                                        'free_cancellation_window_hours',
                                        {
                                            valueAsNumber: true,
                                        }
                                    )}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {
                                        errors.free_cancellation_window_hours
                                            ?.message
                                    }
                                </Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                    Cancellations more than X hours before
                                    pickup are free. Within this window, the
                                    before-pickup fee applies.
                                </Form.Text>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    No-Show Grace Period (hours)
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    min={0}
                                    isInvalid={
                                        !!errors.no_show_grace_period_hours
                                    }
                                    {...register('no_show_grace_period_hours', {
                                        valueAsNumber: true,
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.no_show_grace_period_hours?.message}
                                </Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                    If a customer arrives late within this
                                    window, the return time is unchanged - they
                                    lose those hours. After this window the
                                    booking is marked as a no-show.
                                </Form.Text>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    Before Pickup Cancellation Fee
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    isInvalid={
                                        !!errors.before_pickup_cancellation_fee
                                    }
                                    {...register(
                                        'before_pickup_cancellation_fee',
                                        {
                                            valueAsNumber: true,
                                        }
                                    )}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {
                                        errors.before_pickup_cancellation_fee
                                            ?.message
                                    }
                                </Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                    Fee charged when cancelling within the
                                    free-cancellation window.
                                </Form.Text>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    Free Modification Window (hours before
                                    pickup)
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    min={0}
                                    isInvalid={
                                        !!errors.modification_free_window_hours
                                    }
                                    {...register(
                                        'modification_free_window_hours',
                                        {
                                            valueAsNumber: true,
                                        }
                                    )}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {
                                        errors.modification_free_window_hours
                                            ?.message
                                    }
                                </Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                    Booking modifications are free when made
                                    more than X hours before pickup.
                                </Form.Text>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    Modification Fee (after free window)
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    isInvalid={!!errors.modification_fee}
                                    {...register('modification_fee', {
                                        valueAsNumber: true,
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.modification_fee?.message}
                                </Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                    Flat fee charged when a booking is modified
                                    within the free-modification window.
                                </Form.Text>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    Post-Pickup Cancellation Fee
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    isInvalid={
                                        !!errors.after_pickup_cancellation_fee
                                    }
                                    {...register(
                                        'after_pickup_cancellation_fee',
                                        {
                                            valueAsNumber: true,
                                        }
                                    )}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {
                                        errors.after_pickup_cancellation_fee
                                            ?.message
                                    }
                                </Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                    Fee charged when a rental is cancelled after
                                    the vehicle has already been picked up.
                                </Form.Text>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    Cancellation Cutoff (days before return)
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    min={0}
                                    isInvalid={
                                        !!errors.cancellation_cutoff_days
                                    }
                                    {...register('cancellation_cutoff_days', {
                                        valueAsNumber: true,
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.cancellation_cutoff_days?.message}
                                </Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                    Active/overdue rentals cannot be cancelled
                                    within this many days of the return date.
                                    Set to 0 to always allow cancellation.
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end mt-3">
                        <PermisssionGuard
                            permission={PERMISSIONS.SETTINGS.EDIT_RENTAL}
                        >
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending
                                    ? 'Saving...'
                                    : 'Save'}
                            </Button>
                        </PermisssionGuard>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
}

/* Card 3: Overdue */
function OverdueSettingsCard() {
    const { data: res, isLoading } = useOverdueSettings();
    const updateMutation = useUpdateOverdueSettings();
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setError,
        formState: { errors },
    } = useForm<OverdueSettingsData>();

    const overdueStartType = watch('overdue_start_type');

    useEffect(() => {
        if (res?.data) reset(res.data);
    }, [res?.data, reset]);

    const onSubmit = (data: OverdueSettingsData) => {
        updateMutation.mutate(data, {
            onError: error => applyServerErrors(error, setError),
        });
    };

    if (isLoading) {
        return <SkeletonFormRows rows={4} />;
    }

    return (
        <Card className="mb-4">
            <Card.Header>
                <Card.Title>Overdue</Card.Title>
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Overdue Starts</Form.Label>
                                <Form.Select
                                    isInvalid={!!errors.overdue_start_type}
                                    {...register('overdue_start_type')}
                                >
                                    <option value="exact">
                                        Exact return time
                                    </option>
                                    <option value="grace_period">
                                        After grace period
                                    </option>
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.overdue_start_type?.message}
                                </Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                    When to start accumulating overdue charges
                                    after the scheduled return time.
                                </Form.Text>
                            </Form.Group>
                        </Col>

                        {overdueStartType === 'grace_period' && (
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>
                                        Grace Period (minutes)
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        min={0}
                                        isInvalid={
                                            !!errors.grace_period_minutes
                                        }
                                        {...register('grace_period_minutes', {
                                            valueAsNumber: true,
                                        })}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.grace_period_minutes?.message}
                                    </Form.Control.Feedback>
                                    <Form.Text className="text-muted">
                                        Minutes of buffer after the return time
                                        before overdue charges begin.
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        )}

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    Global Overdue Hourly Rate
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    isInvalid={!!errors.overdue_hourly_rate}
                                    {...register('overdue_hourly_rate', {
                                        valueAsNumber: true,
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.overdue_hourly_rate?.message}
                                </Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                    Vehicle and category rates take priority.
                                </Form.Text>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    Return Alert Buffer (hours)
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    min={0}
                                    isInvalid={!!errors.prep_buffer_hours}
                                    {...register('prep_buffer_hours', {
                                        valueAsNumber: true,
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.prep_buffer_hours?.message}
                                </Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                    Send a return reminder to staff this many
                                    hours before the scheduled return time.
                                </Form.Text>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    Full-Day Threshold (hours)
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    min={1}
                                    isInvalid={!!errors.overdue_threshold_hours}
                                    {...register('overdue_threshold_hours', {
                                        valueAsNumber: true,
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.overdue_threshold_hours?.message}
                                </Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                    Once overdue exceeds this, hourly charges
                                    are replaced with a single full-day charge.
                                </Form.Text>
                            </Form.Group>
                        </Col>

                        <Col md={12} className="d-flex flex-column gap-2">
                            <div>
                                <Form.Check
                                    type="switch"
                                    id="allow_overdue_waive"
                                    label="Allow Overdue Fee Waiving"
                                    isInvalid={!!errors.allow_overdue_waive}
                                    {...register('allow_overdue_waive')}
                                />
                                <Form.Text className="text-muted">
                                    Turning this off disables all waiving
                                    capabilities system-wide, overriding
                                    individual role permissions.
                                </Form.Text>
                            </div>
                            <div>
                                <Form.Check
                                    type="switch"
                                    id="full_day_late_return_waiver"
                                    label="Auto-Waive Full-Day Late Return Fee"
                                    isInvalid={
                                        !!errors.full_day_late_return_waiver
                                    }
                                    {...register('full_day_late_return_waiver')}
                                />
                                <Form.Text className="text-muted">
                                    Automatically forgive the full-day penalty
                                    when a customer returns the vehicle slightly
                                    past the threshold.
                                </Form.Text>
                            </div>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end mt-3">
                        <PermisssionGuard
                            permission={PERMISSIONS.SETTINGS.EDIT_RENTAL}
                        >
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending
                                    ? 'Saving...'
                                    : 'Save'}
                            </Button>
                        </PermisssionGuard>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
}

/* Card 4: Security Deposit */
function SecurityDepositCard() {
    const { data: res, isLoading } = usePricingSettings();
    const updateMutation = useUpdatePricingSettings();
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setError,
        formState: { errors },
    } = useForm<PricingSettingsData>();

    const chargeDeposit = watch('charge_deposit');

    useEffect(() => {
        if (res?.data) reset(res.data);
    }, [res?.data, reset]);

    const onSubmit = (data: PricingSettingsData) => {
        const payload: PricingSettingsData = {
            charge_deposit: data.charge_deposit,
            deposit_percentage: data.deposit_percentage,
            global_security_deposit: data.global_security_deposit,
            deposit_enforcement_mode: data.deposit_enforcement_mode,
            allow_deposit_waive: data.allow_deposit_waive,
            global_young_driver_age_threshold:
                data.global_young_driver_age_threshold != null &&
                String(data.global_young_driver_age_threshold) !== ''
                    ? Number(data.global_young_driver_age_threshold)
                    : null,
            global_young_driver_deposit:
                data.global_young_driver_deposit != null &&
                String(data.global_young_driver_deposit) !== ''
                    ? Number(data.global_young_driver_deposit)
                    : null,
        };
        updateMutation.mutate(payload, {
            onError: error => applyServerErrors(error, setError),
        });
    };

    if (isLoading) {
        return <SkeletonFormRows rows={4} />;
    }

    return (
        <Card className="mb-4">
            <Card.Header>
                <Card.Title>Security Deposit</Card.Title>
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row className="g-3">
                        <Col md={12} className="mb-2">
                            <Form.Check
                                type="switch"
                                id="charge_deposit"
                                label="Charge Security Deposit"
                                isInvalid={!!errors.charge_deposit}
                                {...register('charge_deposit')}
                            />
                            <Form.Text className="text-muted">
                                Collect a refundable deposit from customers at
                                the time of pickup.
                            </Form.Text>
                        </Col>

                        {chargeDeposit && (
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Deposit % of Total</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        max={100}
                                        isInvalid={!!errors.deposit_percentage}
                                        {...register('deposit_percentage', {
                                            valueAsNumber: true,
                                        })}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.deposit_percentage?.message}
                                    </Form.Control.Feedback>
                                    <Form.Text className="text-muted">
                                        Percentage of the total rental cost
                                        collected as a security deposit.
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        )}

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    Global Fixed Deposit Amount (fallback)
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    isInvalid={!!errors.global_security_deposit}
                                    {...register('global_security_deposit', {
                                        valueAsNumber: true,
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.global_security_deposit?.message}
                                </Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                    Used when no percentage-based deposit
                                    applies. Acts as the minimum deposit floor.
                                </Form.Text>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    Global Young Driver Age Threshold
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    step="1"
                                    min={16}
                                    max={99}
                                    placeholder="e.g. 25"
                                    isInvalid={
                                        !!errors.global_young_driver_age_threshold
                                    }
                                    {...register(
                                        'global_young_driver_age_threshold',
                                        {
                                            setValueAs: v =>
                                                v === '' ? null : Number(v),
                                        }
                                    )}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {
                                        errors.global_young_driver_age_threshold
                                            ?.message
                                    }
                                </Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                    Applies to all vehicles with no vehicle- or
                                    category-level young driver setting.
                                </Form.Text>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    Global Young Driver Deposit
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    placeholder="e.g. 500.00"
                                    isInvalid={
                                        !!errors.global_young_driver_deposit
                                    }
                                    {...register(
                                        'global_young_driver_deposit',
                                        {
                                            setValueAs: v =>
                                                v === '' ? null : Number(v),
                                        }
                                    )}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {
                                        errors.global_young_driver_deposit
                                            ?.message
                                    }
                                </Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                    Applies to all vehicles with no vehicle- or
                                    category-level young driver setting.
                                </Form.Text>
                            </Form.Group>
                        </Col>

                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>
                                    Deposit Enforcement Mode
                                </Form.Label>
                                <div className="d-flex gap-4">
                                    <Form.Check
                                        type="radio"
                                        label="Flexible"
                                        value="flexible"
                                        id="deposit-flexible"
                                        isInvalid={
                                            !!errors.deposit_enforcement_mode
                                        }
                                        {...register(
                                            'deposit_enforcement_mode'
                                        )}
                                    />
                                    <Form.Check
                                        type="radio"
                                        label="Strict (must collect before pickup)"
                                        value="strict"
                                        id="deposit-strict"
                                        isInvalid={
                                            !!errors.deposit_enforcement_mode
                                        }
                                        {...register(
                                            'deposit_enforcement_mode'
                                        )}
                                    />
                                </div>
                                <Form.Text className="text-muted">
                                    Strict mode blocks pickup until the deposit
                                    is recorded. Flexible mode allows staff to
                                    proceed without collecting it.
                                </Form.Text>
                            </Form.Group>
                        </Col>

                        <Col md={12}>
                            <Form.Check
                                type="switch"
                                id="allow_deposit_waive"
                                label="Allow Authorised Roles to Waive Deposit"
                                isInvalid={!!errors.allow_deposit_waive}
                                {...register('allow_deposit_waive')}
                            />
                            <Form.Text className="text-muted">
                                Managers and admins can waive the deposit
                                requirement for individual rentals.
                            </Form.Text>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end mt-3">
                        <PermisssionGuard
                            permission={PERMISSIONS.SETTINGS.EDIT_PRICING}
                        >
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending
                                    ? 'Saving...'
                                    : 'Save'}
                            </Button>
                        </PermisssionGuard>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
}

/* Card 5: Vehicle Switch Fee */
function VehicleSwitchFeeCard() {
    const { data: res, isLoading } = usePricingSettings();
    const updateMutation = useUpdatePricingSettings();
    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<PricingSettingsData>();

    useEffect(() => {
        if (res?.data) reset(res.data);
    }, [res?.data, reset]);

    const onSubmit = (data: PricingSettingsData) => {
        const payload: PricingSettingsData = {
            vehicle_switch_fee:
                data.vehicle_switch_fee != null &&
                String(data.vehicle_switch_fee) !== ''
                    ? Number(data.vehicle_switch_fee)
                    : null,
        };
        updateMutation.mutate(payload, {
            onError: error => applyServerErrors(error, setError),
        });
    };

    if (isLoading) {
        return <SkeletonFormRows rows={4} />;
    }

    return (
        <Card className="mb-4">
            <Card.Header>
                <Card.Title>Vehicle Switch Fee</Card.Title>
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row className="g-3">
                        <Col md={6} className="mb-3">
                            <Form.Group>
                                <Form.Label>Switch Fee Amount</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    placeholder="Leave blank to disable"
                                    isInvalid={!!errors.vehicle_switch_fee}
                                    {...register('vehicle_switch_fee', {
                                        valueAsNumber: false,
                                    })}
                                />
                                <Form.Text className="text-muted">
                                    Flat fee charged each time a vehicle is
                                    switched before pickup. Leave blank to
                                    disable.
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    {errors.vehicle_switch_fee?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end mt-3">
                        <PermisssionGuard
                            permission={PERMISSIONS.SETTINGS.EDIT_PRICING}
                        >
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending
                                    ? 'Saving...'
                                    : 'Save'}
                            </Button>
                        </PermisssionGuard>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
}

/* Card 6: Early Return */
function EarlyReturnSettingsCard() {
    const { data: res, isLoading } = useEarlyReturnSettings();
    const updateMutation = useUpdateEarlyReturnSettings();
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setError,
        formState: { errors },
    } = useForm<EarlyReturnSettingsData>();

    const chargeEnabled = watch('early_return_charge_enabled');
    const chargeType = watch('early_return_charge_type');
    const refundEnabled = watch('early_return_refund_enabled');

    useEffect(() => {
        if (res?.data) reset(res.data);
    }, [res?.data, reset]);

    const onSubmit = (data: EarlyReturnSettingsData) => {
        updateMutation.mutate(data, {
            onError: error => applyServerErrors(error, setError),
        });
    };

    if (isLoading) {
        return <SkeletonFormRows rows={4} />;
    }

    return (
        <Card className="mb-4">
            <Card.Header>
                <Card.Title>Early Return</Card.Title>
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row className="g-3">
                        <Col md={12} className="mb-1">
                            <Form.Text className="text-muted">
                                Applies when a customer returns the vehicle
                                before the scheduled return date.
                            </Form.Text>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    Early Return Threshold (days)
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    min={0}
                                    isInvalid={
                                        !!errors.early_return_threshold_days
                                    }
                                    {...register(
                                        'early_return_threshold_days',
                                        {
                                            valueAsNumber: true,
                                        }
                                    )}
                                />
                                <Form.Text className="text-muted">
                                    Returns with fewer days remaining than this
                                    are treated as forfeit - no charge, no
                                    refund.
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    {
                                        errors.early_return_threshold_days
                                            ?.message
                                    }
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        <Col md={12} className="d-flex flex-column gap-2">
                            <Form.Check
                                type="switch"
                                label="Apply Early Return Charge"
                                id="early_return_charge_enabled"
                                isInvalid={!!errors.early_return_charge_enabled}
                                {...register('early_return_charge_enabled')}
                            />
                        </Col>

                        {chargeEnabled && (
                            <>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Charge Type</Form.Label>
                                        <Form.Select
                                            isInvalid={
                                                !!errors.early_return_charge_type
                                            }
                                            {...register(
                                                'early_return_charge_type'
                                            )}
                                        >
                                            <option value="flat">
                                                Flat rate (global)
                                            </option>
                                            <option value="category">
                                                Per vehicle category
                                            </option>
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            {
                                                errors.early_return_charge_type
                                                    ?.message
                                            }
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>

                                {chargeType === 'flat' && (
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>
                                                Flat Early Return Charge
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                min={0}
                                                isInvalid={
                                                    !!errors.early_return_flat_rate
                                                }
                                                {...register(
                                                    'early_return_flat_rate',
                                                    {
                                                        valueAsNumber: true,
                                                    }
                                                )}
                                            />
                                            <Form.Text className="text-muted">
                                                Used when charge type is set to
                                                flat rate.
                                            </Form.Text>
                                            <Form.Control.Feedback type="invalid">
                                                {
                                                    errors
                                                        .early_return_flat_rate
                                                        ?.message
                                                }
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                )}

                                {chargeType === 'category' && (
                                    <Col md={12}>
                                        <Form.Text className="text-muted">
                                            Per-category early return charges
                                            are configured on each vehicle
                                            category.
                                        </Form.Text>
                                    </Col>
                                )}
                            </>
                        )}

                        <Col md={12} className="d-flex flex-column gap-2 pt-2">
                            <Form.Check
                                type="switch"
                                label="Allow Refund for Unused Days"
                                id="early_return_refund_enabled"
                                isInvalid={!!errors.early_return_refund_enabled}
                                {...register('early_return_refund_enabled')}
                            />
                            {!refundEnabled && (
                                <Form.Text className="text-warning fw-semibold">
                                    When off, any unused days are forfeited on
                                    early return - no refund is given. This will
                                    be displayed clearly on invoices and at
                                    pickup.
                                </Form.Text>
                            )}
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end mt-3">
                        <PermisssionGuard
                            permission={PERMISSIONS.SETTINGS.EDIT_RENTAL}
                        >
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending
                                    ? 'Saving...'
                                    : 'Save'}
                            </Button>
                        </PermisssionGuard>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
}

/* Page */
export default function PricingSettings() {
    const title = useTitle('Pricing Settings');

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>Pricing Settings</h4>
                <p className="text-muted mb-0">
                    Configure payment policies, cancellation rules, overdue
                    charges, and security deposits.
                </p>
            </div>

            <PaymentSettingsCard />
            <CancellationSettingsCard />
            <OverdueSettingsCard />
            <SecurityDepositCard />
            <VehicleSwitchFeeCard />
            <EarlyReturnSettingsCard />
        </div>
    );
}
