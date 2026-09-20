import { useEffect } from 'react';
import { Card, Form, Row, Col, Button, Alert } from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useForm, Controller } from 'react-hook-form';
import { applyServerErrors } from '@/shared/libs/utils';
import type { RentalSettingsData } from '@/shared/types';
import {
    useRentalSettings,
    useUpdateRentalSettings,
} from '@/shared/hooks/queries/useSettings';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';
import { useTitle } from '@/shared/hooks';
import HourSelect from '@/admin/components/HourSelect';

export default function RentalSettings() {
    const title = useTitle('Rental Settings');
    const { data: res, isLoading } = useRentalSettings();
    const updateMutation = useUpdateRentalSettings();
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setError,
        control,
        formState: { errors },
    } = useForm<RentalSettingsData>();

    const requiresConfirmation = watch('booking_requires_confirmation');
    const vatEnabled = watch('vat_enabled');

    useEffect(() => {
        if (res?.data) reset(res.data);
    }, [res?.data, reset]);

    const onSubmit = (data: RentalSettingsData) => {
        updateMutation.mutate(data, {
            onError: error => applyServerErrors(error, setError),
        });
    };

    if (isLoading) {
        return <SettingsFormSkeleton />;
    }

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>Rental Settings</h4>
                <p className="text-muted mb-0">
                    Configure booking policies, rental durations, and tax
                    settings.
                </p>
            </div>

            <Form onSubmit={handleSubmit(onSubmit)}>
                {/* Card 1 - Booking Settings */}
                <Card className="mb-4">
                    <Card.Header>
                        <Card.Title>Booking Settings</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <Row className="g-3">
                            <Col
                                md={12}
                                className="d-flex flex-column gap-3 mb-2"
                            >
                                <div>
                                    <Form.Check
                                        type="switch"
                                        id="allow_online_booking"
                                        label="Allow Online Payment"
                                        isInvalid={
                                            !!errors.allow_online_booking
                                        }
                                        {...register('allow_online_booking')}
                                    />
                                    <Form.Text muted>
                                        Enables customers to pay online via the
                                        payment gateway when completing a
                                        booking.
                                    </Form.Text>
                                </div>
                                <div>
                                    <Form.Check
                                        type="switch"
                                        id="allow_public_booking"
                                        label="Allow Public Booking (website)"
                                        isInvalid={
                                            !!errors.allow_public_booking
                                        }
                                        {...register('allow_public_booking')}
                                    />
                                    <Form.Text muted>
                                        Allows customers to submit booking
                                        requests from the public website without
                                        signing in.
                                    </Form.Text>
                                </div>
                                <div>
                                    <Form.Check
                                        type="switch"
                                        id="booking_requires_confirmation"
                                        label="Require Manager Confirmation"
                                        isInvalid={
                                            !!errors.booking_requires_confirmation
                                        }
                                        {...register(
                                            'booking_requires_confirmation'
                                        )}
                                    />
                                    <Form.Text muted>
                                        New bookings stay in
                                        &ldquo;Pending&rdquo; until a manager
                                        explicitly confirms them.
                                    </Form.Text>
                                </div>
                                {!requiresConfirmation && (
                                    <div>
                                        <Form.Check
                                            type="switch"
                                            id="auto_confirm_bookings"
                                            label="Auto-Confirm Bookings"
                                            isInvalid={
                                                !!errors.auto_confirm_bookings
                                            }
                                            {...register(
                                                'auto_confirm_bookings'
                                            )}
                                        />
                                        <Form.Text muted>
                                            Automatically moves new bookings to
                                            &ldquo;Confirmed&rdquo; status
                                            without manual review.
                                        </Form.Text>
                                    </div>
                                )}
                                <div>
                                    <Form.Check
                                        type="switch"
                                        id="require_license_verification"
                                        label="Require License Verification"
                                        isInvalid={
                                            !!errors.require_license_verification
                                        }
                                        {...register(
                                            'require_license_verification'
                                        )}
                                    />
                                    <Form.Text muted>
                                        Blocks checkout until the
                                        customer&apos;s driving licence has been
                                        verified by staff.
                                    </Form.Text>
                                </div>
                                <div>
                                    <Form.Check
                                        type="switch"
                                        id="documents_required"
                                        label="Require Documents on Booking Form"
                                        isInvalid={!!errors.documents_required}
                                        {...register('documents_required')}
                                    />
                                    <Form.Text muted>
                                        When enabled, customers must upload
                                        their driver&apos;s license and ID
                                        document when submitting a booking
                                        request.
                                    </Form.Text>
                                </div>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>
                                        Booking Grace Period (hours)
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        min={0}
                                        isInvalid={
                                            !!errors.booking_grace_period_hours
                                        }
                                        {...register(
                                            'booking_grace_period_hours',
                                            {
                                                valueAsNumber: true,
                                            }
                                        )}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {
                                            errors.booking_grace_period_hours
                                                ?.message
                                        }
                                    </Form.Control.Feedback>
                                    <Form.Text muted>
                                        How long after the scheduled pickup time
                                        a late customer is still served before
                                        the booking is marked as no-show.
                                    </Form.Text>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>
                                        Minimum Advance Notice (days)
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        min={0}
                                        isInvalid={
                                            !!errors.booking_advance_days
                                        }
                                        {...register('booking_advance_days', {
                                            valueAsNumber: true,
                                        })}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.booking_advance_days?.message}
                                    </Form.Control.Feedback>
                                    <Form.Text muted>
                                        Customers must book at least this many
                                        days ahead of the pickup date.
                                    </Form.Text>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Minimum Rental Days</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min={1}
                                        isInvalid={!!errors.min_rental_days}
                                        {...register('min_rental_days', {
                                            valueAsNumber: true,
                                        })}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.min_rental_days?.message}
                                    </Form.Control.Feedback>
                                    <Form.Text muted>
                                        Shortest rental duration a customer can
                                        book.
                                    </Form.Text>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Maximum Rental Days</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min={1}
                                        isInvalid={!!errors.max_rental_days}
                                        {...register('max_rental_days', {
                                            valueAsNumber: true,
                                        })}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.max_rental_days?.message}
                                    </Form.Control.Feedback>
                                    <Form.Text muted>
                                        Longest rental duration a customer can
                                        book in a single reservation.
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Card 2 - Pickup / Drop-off Hours */}
                <Card className="mb-4">
                    <Card.Header>
                        <Card.Title>Pickup / Drop-off Hours</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>
                                        Pickup Window - From
                                    </Form.Label>
                                    <Controller
                                        name="pickup_window_start"
                                        control={control}
                                        render={({ field }) => (
                                            <HourSelect
                                                value={field.value ?? ''}
                                                onChange={field.onChange}
                                                isInvalid={
                                                    !!errors.pickup_window_start
                                                }
                                            />
                                        )}
                                    />
                                    <Form.Text muted>
                                        Earliest hour a car can be picked up or
                                        dropped off.
                                    </Form.Text>
                                    {errors.pickup_window_start && (
                                        <Form.Control.Feedback
                                            type="invalid"
                                            className="d-block"
                                        >
                                            {errors.pickup_window_start.message}
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>
                                        Pickup Window - Until
                                    </Form.Label>
                                    <Controller
                                        name="pickup_window_end"
                                        control={control}
                                        render={({ field }) => (
                                            <HourSelect
                                                value={field.value ?? ''}
                                                onChange={field.onChange}
                                                isInvalid={
                                                    !!errors.pickup_window_end
                                                }
                                            />
                                        )}
                                    />
                                    <Form.Text muted>
                                        Latest hour a car can be picked up or
                                        dropped off.
                                    </Form.Text>
                                    {errors.pickup_window_end && (
                                        <Form.Control.Feedback
                                            type="invalid"
                                            className="d-block"
                                        >
                                            {errors.pickup_window_end.message}
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>
                                        Return Time Threshold (hours)
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        min={1}
                                        max={23}
                                        placeholder="e.g. 2"
                                        isInvalid={
                                            !!errors.return_time_threshold
                                        }
                                        {...register('return_time_threshold', {
                                            setValueAs: v =>
                                                v === '' || v === null
                                                    ? null
                                                    : Number(v),
                                        })}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.return_time_threshold?.message}
                                    </Form.Control.Feedback>
                                    <Form.Text muted>
                                        Return time is capped this many hours
                                        before the pickup time. Leave blank to
                                        disable.
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Card 3 - VAT / Tax */}
                <Card className="mb-4">
                    <Card.Header>
                        <Card.Title>VAT / Tax</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Check
                                    type="switch"
                                    id="vat_enabled"
                                    label="Apply VAT to Rentals"
                                    isInvalid={!!errors.vat_enabled}
                                    {...register('vat_enabled')}
                                />
                                <Form.Text muted>
                                    When enabled, VAT is added to every rental
                                    invoice at the rate below.
                                </Form.Text>
                            </Col>

                            {vatEnabled && (
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>VAT Rate (%)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            max={100}
                                            isInvalid={!!errors.vat_rate}
                                            {...register('vat_rate', {
                                                valueAsNumber: true,
                                            })}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.vat_rate?.message}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            )}

                            <Col md={12}>
                                <Alert variant="info" className="mb-0 py-2">
                                    VAT is calculated on the total rental cost
                                    and shown as a separate line item on
                                    invoices.
                                </Alert>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Card 4 - Coupon Code Prefix */}
                <Card className="mb-4">
                    <Card.Header>
                        <Card.Title>Coupon Codes</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Coupon Code Prefix</Form.Label>
                                    <Form.Control
                                        maxLength={3}
                                        placeholder="SF"
                                        isInvalid={!!errors.coupon_code_prefix}
                                        {...register('coupon_code_prefix', {
                                            onChange: e => {
                                                e.target.value =
                                                    e.target.value.toUpperCase();
                                            },
                                        })}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.coupon_code_prefix?.message}
                                    </Form.Control.Feedback>
                                    <Form.Text muted>
                                        Up to 3 letters prepended to all coupon
                                        codes (e.g. <strong>SF</strong>WELCOME).
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <div className="d-flex justify-content-end">
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
                                : 'Save Settings'}
                        </Button>
                    </PermisssionGuard>
                </div>
            </Form>
        </div>
    );
}
