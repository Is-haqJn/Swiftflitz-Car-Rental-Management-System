import { useEffect } from 'react';
import { Card, Form, Row, Col, Button } from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useForm, Controller } from 'react-hook-form';
import { applyServerErrors } from '@/shared/libs/utils';
import {
    useChauffeurSettings,
    useUpdateChauffeurSettings,
} from '@/shared/hooks/queries/useChauffeurSettings';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';
import { useTitle } from '@/shared/hooks';
import { useGeneralSettings } from '@/shared/hooks/queries/useSettings';
import HourSelect from '@/admin/components/HourSelect';
import type { ChauffeurSettings as ChauffeurSettingsType } from '@/shared/types/chauffeur-settings.types';

export default function ChauffeurSettings() {
    useTitle('Chauffeur Settings');
    const { data: generalSettings } = useGeneralSettings();
    const globalSymbol = generalSettings?.data?.currency_symbol ?? '₵';

    const { data: res, isLoading } = useChauffeurSettings();
    const updateMutation = useUpdateChauffeurSettings();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        control,
        formState: { errors },
    } = useForm<ChauffeurSettingsType>();

    useEffect(() => {
        if (res?.data) {
            reset(res.data);
        }
    }, [res?.data, reset]);

    const onSubmit = (data: ChauffeurSettingsType) => {
        updateMutation.mutate(data, {
            onError: error => applyServerErrors(error, setError),
        });
    };

    if (isLoading) {
        return <SettingsFormSkeleton />;
    }

    return (
        <div className="pb-4">
            <h4 className="mb-4">Chauffeur Rental Settings</h4>

            <Card>
                <Card.Header>
                    <Card.Title>Pricing & Policy</Card.Title>
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <Row className="g-3">
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>
                                        Grace Period (minutes)
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        min={0}
                                        {...register('grace_period_minutes', {
                                            valueAsNumber: true,
                                        })}
                                        isInvalid={
                                            !!errors.grace_period_minutes
                                        }
                                    />
                                    <Form.Text className="text-muted">
                                        Minutes past return time before overtime
                                        kicks in.
                                    </Form.Text>
                                    {errors.grace_period_minutes && (
                                        <Form.Control.Feedback type="invalid">
                                            {
                                                errors.grace_period_minutes
                                                    .message
                                            }
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>
                                        Overtime Charge / Hour ({globalSymbol})
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        {...register(
                                            'overtime_charge_per_hour',
                                            { valueAsNumber: true }
                                        )}
                                        isInvalid={
                                            !!errors.overtime_charge_per_hour
                                        }
                                    />
                                    <Form.Text className="text-muted">
                                        Charged per hour (rounded up) after
                                        grace period.
                                    </Form.Text>
                                    {errors.overtime_charge_per_hour && (
                                        <Form.Control.Feedback type="invalid">
                                            {
                                                errors.overtime_charge_per_hour
                                                    .message
                                            }
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>
                                        Cancellation Flat Fee ({globalSymbol})
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        {...register('cancellation_flat_fee', {
                                            valueAsNumber: true,
                                        })}
                                        isInvalid={
                                            !!errors.cancellation_flat_fee
                                        }
                                    />
                                    <Form.Text className="text-muted">
                                        Fixed fee applied when a booking is
                                        cancelled.
                                    </Form.Text>
                                    {errors.cancellation_flat_fee && (
                                        <Form.Control.Feedback type="invalid">
                                            {
                                                errors.cancellation_flat_fee
                                                    .message
                                            }
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>
                                        No-Show Fee ({globalSymbol})
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        {...register('no_show_fee', {
                                            valueAsNumber: true,
                                        })}
                                        isInvalid={!!errors.no_show_fee}
                                    />
                                    <Form.Text className="text-muted">
                                        Fee charged when customer does not show
                                        up.
                                    </Form.Text>
                                    {errors.no_show_fee && (
                                        <Form.Control.Feedback type="invalid">
                                            {errors.no_show_fee.message}
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>
                                        Standard Return Time
                                    </Form.Label>
                                    <Controller
                                        name="standard_return_time"
                                        control={control}
                                        render={({ field }) => (
                                            <HourSelect
                                                value={field.value ?? ''}
                                                onChange={field.onChange}
                                                isInvalid={
                                                    !!errors.standard_return_time
                                                }
                                            />
                                        )}
                                    />
                                    <Form.Text className="text-muted">
                                        Overtime starts when actual return
                                        exceeds this time.
                                    </Form.Text>
                                    {errors.standard_return_time && (
                                        <Form.Control.Feedback
                                            type="invalid"
                                            className="d-block"
                                        >
                                            {
                                                errors.standard_return_time
                                                    .message
                                            }
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>
                                        Booking Window - From
                                    </Form.Label>
                                    <Controller
                                        name="booking_window_start"
                                        control={control}
                                        render={({ field }) => (
                                            <HourSelect
                                                value={field.value ?? ''}
                                                onChange={field.onChange}
                                                isInvalid={
                                                    !!errors.booking_window_start
                                                }
                                            />
                                        )}
                                    />
                                    <Form.Text className="text-muted">
                                        Earliest hour a pickup can be scheduled.
                                    </Form.Text>
                                    {errors.booking_window_start && (
                                        <Form.Control.Feedback
                                            type="invalid"
                                            className="d-block"
                                        >
                                            {
                                                errors.booking_window_start
                                                    .message
                                            }
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>
                                        Booking Window - Until
                                    </Form.Label>
                                    <Controller
                                        name="booking_window_end"
                                        control={control}
                                        render={({ field }) => (
                                            <HourSelect
                                                value={field.value ?? ''}
                                                onChange={field.onChange}
                                                isInvalid={
                                                    !!errors.booking_window_end
                                                }
                                            />
                                        )}
                                    />
                                    <Form.Text className="text-muted">
                                        Latest hour a pickup can be scheduled.
                                    </Form.Text>
                                    {errors.booking_window_end && (
                                        <Form.Control.Feedback
                                            type="invalid"
                                            className="d-block"
                                        >
                                            {errors.booking_window_end.message}
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col xs={12}>
                                <div className="d-flex justify-content-end">
                                    <PermisssionGuard
                                        permission={
                                            PERMISSIONS.CHAUFFEUR_RENTAL
                                                .MANAGE_SETTINGS
                                        }
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
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
}
