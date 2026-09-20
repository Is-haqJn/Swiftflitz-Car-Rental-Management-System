import { useEffect, useState } from 'react';
import { Card, Form, Row, Col, Button } from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useForm } from 'react-hook-form';
import { applyServerErrors } from '@/shared/libs/utils';
import type { EmailSettingsData } from '@/shared/types';
import {
    useEmailSettings,
    useUpdateEmailSettings,
    useTestEmailConfig,
    isMasked,
} from '@/shared/hooks/queries/useSettings';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';
import { useTitle } from '@/shared/hooks';

export default function EmailSettings() {
    const title = useTitle('Email Settings');
    const { data: res, isLoading } = useEmailSettings();
    const updateMutation = useUpdateEmailSettings();
    const testMutation = useTestEmailConfig();
    const [testEmail, setTestEmail] = useState('');
    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<EmailSettingsData>({
        defaultValues: {
            notify_customers: true,
            notify_branch_managers: true,
            notify_admins: true,
            send_admin_new_booking: true,
            send_admin_rental_cancelled: true,
            send_admin_pickup_reminder: true,
            send_admin_return_reminder: true,
            send_admin_overdue_alert: true,
            send_admin_payment_confirmation: true,
            send_admin_rental_status_change: true,
            send_admin_airport_booking: true,
            send_admin_airport_booking_cancelled: true,
            send_admin_chauffeur_booking: true,
            send_admin_chauffeur_booking_cancelled: true,
            send_admin_chauffeur_pickup_reminder: true,
        },
    });

    useEffect(() => {
        if (res?.data) reset(res.data);
    }, [res, reset]);

    const onSubmit = (data: EmailSettingsData) => {
        const payload = { ...data };
        if (isMasked(payload.password)) {
            delete payload.password;
        }
        updateMutation.mutate(payload, {
            onError: error => applyServerErrors(error, setError),
        });
    };

    if (isLoading) {
        return <SettingsFormSkeleton cards={2} />;
    }

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>Email Settings</h4>
                <p className="text-muted mb-0">
                    Configure SMTP mail server credentials.
                </p>
            </div>

            <Form onSubmit={handleSubmit(onSubmit)}>
                {/* SMTP Configuration */}
                <Card className="mb-3">
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Mail Driver</Form.Label>
                                    <Form.Select
                                        className="tw:h-[2.9rem]"
                                        {...register('mailer')}
                                        isInvalid={!!errors.mailer}
                                    >
                                        <option value="smtp">SMTP</option>
                                        <option value="log">Log (Dev)</option>
                                        <option value="mailgun">Mailgun</option>
                                        <option value="ses">Amazon SES</option>
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.mailer?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Mail Host</Form.Label>
                                    <Form.Control
                                        {...register('host')}
                                        placeholder="smtp.mailprovider.com"
                                        isInvalid={!!errors.host}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.host?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Port</Form.Label>
                                    <Form.Control
                                        type="number"
                                        {...register('port', {
                                            valueAsNumber: true,
                                        })}
                                        placeholder="587"
                                        isInvalid={!!errors.port}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.port?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Encryption</Form.Label>
                                    <Form.Select
                                        className="tw:h-[2.9rem]"
                                        {...register('encryption')}
                                        isInvalid={!!errors.encryption}
                                    >
                                        <option value="tls">TLS</option>
                                        <option value="ssl">SSL</option>
                                        <option value="">None</option>
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.encryption?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Username</Form.Label>
                                    <Form.Control
                                        {...register('username')}
                                        isInvalid={!!errors.username}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.username?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        {...register('password')}
                                        isInvalid={!!errors.password}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.password?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>From Address</Form.Label>
                                    <Form.Control
                                        type="email"
                                        {...register('from_address')}
                                        isInvalid={!!errors.from_address}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.from_address?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>From Name</Form.Label>
                                    <Form.Control
                                        {...register('from_name')}
                                        isInvalid={!!errors.from_name}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.from_name?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Recipient Groups */}
                <Card className="mb-3">
                    <Card.Header>
                        <p className="fw-semibold mb-0">Recipient Groups</p>
                    </Card.Header>
                    <Card.Body>
                        <p className="text-muted small mb-3">
                            Control which recipient groups receive email
                            notifications.
                        </p>
                        <div className="d-flex flex-column gap-4">
                            <div>
                                <Form.Check
                                    type="switch"
                                    id="email-notify-customers-switch"
                                    label={
                                        <span>
                                            <strong>Notify Customers</strong>
                                            <p className="text-muted small mb-0 mt-1">
                                                Send email notifications to
                                                customers.
                                            </p>
                                        </span>
                                    }
                                    {...register('notify_customers')}
                                />
                            </div>

                            <hr className="my-0" />

                            <div>
                                <Form.Check
                                    type="switch"
                                    id="email-notify-branch-managers-switch"
                                    label={
                                        <span>
                                            <strong>
                                                Notify Branch Managers
                                            </strong>
                                            <p className="text-muted small mb-0 mt-1">
                                                Send to staff assigned to a
                                                branch.
                                            </p>
                                        </span>
                                    }
                                    {...register('notify_branch_managers')}
                                />
                            </div>

                            <hr className="my-0" />

                            <div>
                                <Form.Check
                                    type="switch"
                                    id="email-notify-admins-switch"
                                    label={
                                        <span>
                                            <strong>Notify Admins</strong>
                                            <p className="text-muted small mb-0 mt-1">
                                                Send to global admins and super
                                                admins.
                                            </p>
                                        </span>
                                    }
                                    {...register('notify_admins')}
                                />
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                {/* Admin Notification Triggers */}
                <Card className="mb-3">
                    <Card.Header>
                        <p className="fw-semibold mb-0">
                            Admin Notification Triggers
                        </p>
                    </Card.Header>
                    <Card.Body>
                        <p className="text-muted small mb-3">
                            Control which operational events trigger an email
                            alert to admins and branch managers.
                        </p>
                        <Row className="g-2">
                            {(
                                [
                                    {
                                        label: 'New booking alert',
                                        field: 'send_admin_new_booking',
                                    },
                                    {
                                        label: 'Rental cancelled',
                                        field: 'send_admin_rental_cancelled',
                                    },
                                    {
                                        label: 'Pickup reminder',
                                        field: 'send_admin_pickup_reminder',
                                    },
                                    {
                                        label: 'Return reminder',
                                        field: 'send_admin_return_reminder',
                                    },
                                    {
                                        label: 'Overdue alert',
                                        field: 'send_admin_overdue_alert',
                                    },
                                    {
                                        label: 'Payment confirmed',
                                        field: 'send_admin_payment_confirmation',
                                    },
                                    {
                                        label: 'Rental status change',
                                        field: 'send_admin_rental_status_change',
                                    },
                                    {
                                        label: 'Airport booking',
                                        field: 'send_admin_airport_booking',
                                    },
                                    {
                                        label: 'Airport booking cancelled',
                                        field: 'send_admin_airport_booking_cancelled',
                                    },
                                    {
                                        label: 'Chauffeur booking',
                                        field: 'send_admin_chauffeur_booking',
                                    },
                                    {
                                        label: 'Chauffeur booking cancelled',
                                        field: 'send_admin_chauffeur_booking_cancelled',
                                    },
                                    {
                                        label: 'Chauffeur pickup reminder',
                                        field: 'send_admin_chauffeur_pickup_reminder',
                                    },
                                ] as {
                                    label: string;
                                    field: keyof EmailSettingsData;
                                }[]
                            ).map(({ label, field }) => (
                                <Col key={field} xs={12} sm={6} lg={4}>
                                    <Form.Check
                                        type="switch"
                                        id={field}
                                        label={label}
                                        {...register(field)}
                                    />
                                </Col>
                            ))}
                        </Row>
                    </Card.Body>
                </Card>

                <div className="d-flex justify-content-end mb-4">
                    <PermisssionGuard
                        permission={PERMISSIONS.SETTINGS.EDIT_EMAIL}
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

            <PermisssionGuard permission={PERMISSIONS.SETTINGS.EDIT_EMAIL}>
                <Card>
                    <Card.Header>
                        <Card.Title as="h6" className="mb-0">
                            Test Connection
                        </Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <p className="text-muted small mb-3">
                            Send a test email to verify your SMTP configuration
                            is working correctly.
                        </p>
                        <Row className="g-2 align-items-end">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Send test to</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="you@example.com"
                                        value={testEmail}
                                        onChange={e =>
                                            setTestEmail(e.target.value)
                                        }
                                    />
                                </Form.Group>
                            </Col>
                            <Col md="auto">
                                <Button
                                    variant="outline-secondary"
                                    disabled={
                                        !testEmail || testMutation.isPending
                                    }
                                    onClick={() =>
                                        testMutation.mutate(testEmail)
                                    }
                                >
                                    {testMutation.isPending
                                        ? 'Sending...'
                                        : 'Test'}
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            </PermisssionGuard>
        </div>
    );
}
