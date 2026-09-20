import { useEffect } from 'react';
import { Card, Form, Row, Col, Button } from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useForm } from 'react-hook-form';
import { applyServerErrors } from '@/shared/libs/utils';
import type { AirportCancellationSettingsData } from '@/shared/types';
import {
    useAirportCancellationSettings,
    useUpdateAirportCancellationSettings,
} from '@/shared/hooks/queries/useAirportCancellationSettings';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';
import { useTitle } from '@/shared/hooks';

export default function AirportCancellationSettings() {
    useTitle('Airport Cancellation Settings');

    const { data: res, isLoading } = useAirportCancellationSettings();
    const updateMutation = useUpdateAirportCancellationSettings();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setError,
        formState: { errors },
    } = useForm<AirportCancellationSettingsData>();

    const feeType = watch('cancellation_fee_type');

    useEffect(() => {
        if (res?.data) reset(res.data);
    }, [res?.data, reset]);

    const onSubmit = (data: AirportCancellationSettingsData) => {
        updateMutation.mutate(data, {
            onError: error => applyServerErrors(error, setError),
        });
    };

    if (isLoading) {
        return <SettingsFormSkeleton />;
    }

    return (
        <div className="pb-4">
            <h4 className="mb-4">Airport Cancellation Settings</h4>

            <Card>
                <Card.Header>
                    <Card.Title>Cancellation Policy</Card.Title>
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <Row className="g-3">
                            <Col md={4} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        Free Cancellation Window (hours)
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        min={0}
                                        {...register(
                                            'free_cancellation_hours',
                                            { valueAsNumber: true }
                                        )}
                                        isInvalid={
                                            !!errors.free_cancellation_hours
                                        }
                                    />
                                    <Form.Text className="text-muted">
                                        Cancellations made this many hours
                                        before the booking are free.
                                    </Form.Text>
                                    {errors.free_cancellation_hours && (
                                        <Form.Control.Feedback type="invalid">
                                            {
                                                errors.free_cancellation_hours
                                                    .message
                                            }
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col md={4} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Fee Type</Form.Label>
                                    <Form.Select
                                        {...register('cancellation_fee_type')}
                                        isInvalid={
                                            !!errors.cancellation_fee_type
                                        }
                                    >
                                        <option value="flat">
                                            Flat Amount
                                        </option>
                                        <option value="percentage">
                                            Percentage
                                        </option>
                                    </Form.Select>
                                    {errors.cancellation_fee_type && (
                                        <Form.Control.Feedback type="invalid">
                                            {
                                                errors.cancellation_fee_type
                                                    .message
                                            }
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col md={4} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        {feeType === 'percentage'
                                            ? 'Fee (%)'
                                            : 'Fee Amount'}
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        {...register(
                                            'cancellation_fee_amount',
                                            { valueAsNumber: true }
                                        )}
                                        isInvalid={
                                            !!errors.cancellation_fee_amount
                                        }
                                    />
                                    {feeType === 'percentage' && (
                                        <Form.Text className="text-muted">
                                            Percentage of the booking total
                                            (e.g. 10 = 10%).
                                        </Form.Text>
                                    )}
                                    {errors.cancellation_fee_amount && (
                                        <Form.Control.Feedback type="invalid">
                                            {
                                                errors.cancellation_fee_amount
                                                    .message
                                            }
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col xs={12}>
                                <div className="d-flex justify-content-end gap-2">
                                    <PermisssionGuard
                                        permission={
                                            PERMISSIONS.AIRPORT_TRANSFER
                                                .MANAGE_PACKAGES
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
