import { useEffect, useState } from 'react';
import { Card, Form, Row, Col, Button, Alert } from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useForm } from 'react-hook-form';
import { applyServerErrors } from '@/shared/libs/utils';
import type { SmsSettingsData } from '@/shared/types';
import {
    useSmsSettings,
    useUpdateSmsSettings,
    useTestSmsConfig,
} from '@/shared/hooks/queries/useSettings';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';
import { useTitle } from '@/shared/hooks';

export default function SmsSettings() {
    const title = useTitle('SMS Settings');
    const { data: res, isLoading } = useSmsSettings();
    const updateMutation = useUpdateSmsSettings();
    const {
        register,
        handleSubmit,
        reset,
        setError,
        watch,
        formState: { errors },
    } = useForm<SmsSettingsData>({
        defaultValues: {
            enabled: false,
            test_mode: false,
            admin_only_mode: false,
            mirror_mode: false,
            notify_customers: false,
            notify_branch_managers: false,
            notify_admins: false,
            send_new_booking: false,
            send_return_reminder: false,
            send_overdue_alert: false,
            send_pickup_reminder: false,
            send_payment_confirmation: false,
            send_admin_new_booking: false,
            send_admin_rental_cancelled: false,
            send_admin_pickup_reminder: false,
            send_admin_return_reminder: false,
            send_admin_overdue_alert: false,
            send_admin_payment_confirmation: false,
            send_admin_rental_status_change: false,
            send_admin_airport_booking: false,
            send_admin_airport_booking_cancelled: false,
            send_admin_chauffeur_booking: false,
            send_admin_chauffeur_booking_cancelled: false,
            send_admin_chauffeur_pickup_reminder: false,
            send_airport_booking: false,
            send_airport_booking_cancelled: false,
            send_airport_booking_status_changed: false,
            send_chauffeur_booking: false,
            send_chauffeur_booking_cancelled: false,
            send_chauffeur_booking_status_changed: false,
            send_chauffeur_pickup_reminder: false,
            send_rental_cancelled: false,
            send_driver_document_expiry: false,
            send_rental_status_change: false,
            send_vehicle_expiry: false,
            send_quote_request: false,
            send_document_expiry_alert: false,
        },
    });

    const testModeOn = watch('test_mode');
    const adminOnlyModeOn = watch('admin_only_mode');
    const defaultProvider = watch('default_provider');

    const testSmsConfig = useTestSmsConfig();
    const [testPhone, setTestPhone] = useState('');
    const [testPhoneError, setTestPhoneError] = useState('');

    useEffect(() => {
        if (res?.data) {
            reset(res.data);
        }
    }, [res, reset]);

    const onSubmit = (data: SmsSettingsData) => {
        updateMutation.mutate(data, {
            onError: error => applyServerErrors(error, setError),
        });
    };

    const handleTestSms = () => {
        if (!testPhone.trim()) {
            setTestPhoneError('Enter a phone number to send the test to.');
            return;
        }
        setTestPhoneError('');
        testSmsConfig.mutate({ phone: testPhone });
    };

    if (isLoading) {
        return <SettingsFormSkeleton />;
    }

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>SMS Settings</h4>
                <p className="text-muted mb-0">
                    Configure SMS notifications via Arkessel, Twilio, or Nalo.
                    Choose your default provider and enter its credentials
                    below.
                </p>
            </div>

            <Form onSubmit={handleSubmit(onSubmit)}>
                {/* Master Enable */}
                <Card className="mb-3">
                    <Card.Body>
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <p className="fw-semibold mb-1">
                                    Enable SMS Notifications
                                </p>
                                <p className="text-muted small mb-0">
                                    Master switch - turn off to stop all SMS
                                    messages.
                                </p>
                            </div>
                            <Form.Check
                                type="switch"
                                id="sms-enabled-switch"
                                {...register('enabled')}
                            />
                        </div>
                    </Card.Body>
                </Card>

                {/* Provider Selection */}
                <Card className="mb-3">
                    <Card.Header>
                        <p className="fw-semibold mb-0">Provider Selection</p>
                    </Card.Header>
                    <Card.Body>
                        <p className="text-muted small mb-3">
                            Select the default SMS provider to use for sending
                            notifications. Only the selected provider's
                            credentials need to be filled in.
                        </p>
                        <div className="d-flex gap-4">
                            {(
                                [
                                    'twilio',
                                    'arkessel',
                                    'nalo',
                                    'hubtel',
                                ] as const
                            ).map(provider => (
                                <Form.Check
                                    key={provider}
                                    type="radio"
                                    id={`provider-${provider}`}
                                    value={provider}
                                    label={
                                        provider.charAt(0).toUpperCase() +
                                        provider.slice(1)
                                    }
                                    {...register('default_provider')}
                                />
                            ))}
                        </div>
                    </Card.Body>
                </Card>

                {/* Provider Credentials */}
                <Card className="mb-3">
                    <Card.Header>
                        <p className="fw-semibold mb-0">Provider Credentials</p>
                    </Card.Header>
                    <Card.Body>
                        {/* Twilio */}
                        {defaultProvider === 'twilio' && (
                            <>
                                <Alert variant="info" className="small mb-3">
                                    Get these from your{' '}
                                    <strong>Twilio Console</strong> at
                                    console.twilio.com. The Account SID and Auth
                                    Token are on the dashboard homepage.
                                </Alert>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Account SID</Form.Label>
                                            <Form.Control
                                                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                                {...register(
                                                    'twilio_account_sid'
                                                )}
                                                isInvalid={
                                                    !!errors.twilio_account_sid
                                                }
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {
                                                    errors.twilio_account_sid
                                                        ?.message
                                                }
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Auth Token</Form.Label>
                                            <Form.Control
                                                type="password"
                                                placeholder="Your Twilio Auth Token"
                                                {...register(
                                                    'twilio_auth_token'
                                                )}
                                                isInvalid={
                                                    !!errors.twilio_auth_token
                                                }
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {
                                                    errors.twilio_auth_token
                                                        ?.message
                                                }
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>
                                                From Phone Number
                                            </Form.Label>
                                            <Form.Control
                                                placeholder="+15550000001"
                                                {...register(
                                                    'twilio_from_number'
                                                )}
                                                isInvalid={
                                                    !!errors.twilio_from_number
                                                }
                                            />
                                            <Form.Text className="text-muted">
                                                E.164 format (e.g.
                                                +15550000001). Must be a
                                                Twilio-purchased number.
                                            </Form.Text>
                                            <Form.Control.Feedback type="invalid">
                                                {
                                                    errors.twilio_from_number
                                                        ?.message
                                                }
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </>
                        )}

                        {/* Arkessel */}
                        {defaultProvider === 'arkessel' && (
                            <>
                                <Alert variant="info" className="small mb-3">
                                    Get your API key and sender ID from your{' '}
                                    <strong>Arkessel dashboard</strong>. The
                                    sender ID is the name displayed to
                                    recipients.
                                </Alert>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>API Key</Form.Label>
                                            <Form.Control
                                                type="password"
                                                placeholder="Your Arkessel API key"
                                                {...register(
                                                    'arkessel_api_key'
                                                )}
                                                isInvalid={
                                                    !!errors.arkessel_api_key
                                                }
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {
                                                    errors.arkessel_api_key
                                                        ?.message
                                                }
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Sender ID</Form.Label>
                                            <Form.Control
                                                placeholder="Swiftflitz"
                                                {...register(
                                                    'arkessel_sender_id'
                                                )}
                                                isInvalid={
                                                    !!errors.arkessel_sender_id
                                                }
                                            />
                                            <Form.Text className="text-muted">
                                                Alphanumeric, max 11 characters.
                                            </Form.Text>
                                            <Form.Control.Feedback type="invalid">
                                                {
                                                    errors.arkessel_sender_id
                                                        ?.message
                                                }
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </>
                        )}

                        {/* Nalo */}
                        {defaultProvider === 'nalo' && (
                            <>
                                <Alert variant="info" className="small mb-3">
                                    Get your API key and sender ID from your{' '}
                                    <strong>Nalo Solutions dashboard</strong>.
                                    The sender ID appears as the sender name to
                                    recipients.
                                </Alert>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>API Key</Form.Label>
                                            <Form.Control
                                                type="password"
                                                placeholder="Your Nalo API key"
                                                {...register('nalo_api_key')}
                                                isInvalid={
                                                    !!errors.nalo_api_key
                                                }
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errors.nalo_api_key?.message}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Sender ID</Form.Label>
                                            <Form.Control
                                                placeholder="Swiftflitz"
                                                {...register('nalo_sender_id')}
                                                isInvalid={
                                                    !!errors.nalo_sender_id
                                                }
                                            />
                                            <Form.Text className="text-muted">
                                                Alphanumeric, max 11 characters.
                                            </Form.Text>
                                            <Form.Control.Feedback type="invalid">
                                                {errors.nalo_sender_id?.message}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </>
                        )}

                        {/* Hubtel */}
                        {defaultProvider === 'hubtel' && (
                            <>
                                <Alert variant="info" className="small mb-3">
                                    Get your Client ID and Client Secret from
                                    your{' '}
                                    <strong>Hubtel Business dashboard</strong>.
                                    The Sender ID is the name displayed to
                                    recipients.
                                </Alert>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Client ID</Form.Label>
                                            <Form.Control
                                                placeholder="Your Hubtel Client ID"
                                                {...register(
                                                    'hubtel_sms_client_id'
                                                )}
                                                isInvalid={
                                                    !!errors.hubtel_sms_client_id
                                                }
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {
                                                    errors.hubtel_sms_client_id
                                                        ?.message
                                                }
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>
                                                Client Secret
                                            </Form.Label>
                                            <Form.Control
                                                type="password"
                                                placeholder="Your Hubtel Client Secret"
                                                {...register(
                                                    'hubtel_sms_client_secret'
                                                )}
                                                isInvalid={
                                                    !!errors.hubtel_sms_client_secret
                                                }
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {
                                                    errors
                                                        .hubtel_sms_client_secret
                                                        ?.message
                                                }
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Sender ID</Form.Label>
                                            <Form.Control
                                                placeholder="Swiftflitz"
                                                {...register(
                                                    'hubtel_sms_sender_id'
                                                )}
                                                isInvalid={
                                                    !!errors.hubtel_sms_sender_id
                                                }
                                            />
                                            <Form.Text className="text-muted">
                                                Alphanumeric, max 11 characters.
                                            </Form.Text>
                                            <Form.Control.Feedback type="invalid">
                                                {
                                                    errors.hubtel_sms_sender_id
                                                        ?.message
                                                }
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </>
                        )}

                        {!defaultProvider && (
                            <p className="text-muted small mb-0">
                                Select a provider above to see its credential
                                fields.
                            </p>
                        )}
                    </Card.Body>
                </Card>

                {/* Delivery Mode */}
                <Card className="mb-3">
                    <Card.Header>
                        <p className="fw-semibold mb-0">Delivery Mode</p>
                    </Card.Header>
                    <Card.Body>
                        <div className="d-flex flex-column gap-4">
                            {/* Notify Customers */}
                            <div>
                                <Form.Check
                                    type="switch"
                                    id="sms-notify-customers-switch"
                                    label={
                                        <span>
                                            <strong>
                                                Send notifications to customers
                                            </strong>
                                            <p className="text-muted small mb-0 mt-1">
                                                When off, no SMS messages are
                                                sent to customer phone numbers.
                                            </p>
                                        </span>
                                    }
                                    {...register('notify_customers')}
                                />
                            </div>

                            <hr className="my-0" />

                            {/* Notify Branch Managers */}
                            <div>
                                <Form.Check
                                    type="switch"
                                    id="sms-notify-branch-managers-switch"
                                    label={
                                        <span>
                                            <strong>
                                                Notify Branch Managers
                                            </strong>
                                            <p className="text-muted small mb-0 mt-1">
                                                Sends operational alerts to each
                                                branch manager's own profile
                                                phone number for events in their
                                                branch.
                                            </p>
                                        </span>
                                    }
                                    {...register('notify_branch_managers')}
                                />
                            </div>

                            <hr className="my-0" />

                            {/* Notify Admins */}
                            <div>
                                <Form.Check
                                    type="switch"
                                    id="sms-notify-admins-switch"
                                    className="align-items-start"
                                    label={
                                        <span>
                                            <strong>
                                                Send notifications to admins
                                            </strong>
                                            <p className="text-muted small mb-0 mt-1">
                                                Sends operational alerts (new
                                                bookings, overdue rentals,
                                                cancellations, etc.) to the
                                                configured admin phone number.
                                                Independent of customer and
                                                branch manager notifications.
                                            </p>
                                        </span>
                                    }
                                    {...register('notify_admins')}
                                />
                                {watch('notify_admins') && (
                                    <div className="mt-2 ms-4">
                                        <Form.Group>
                                            <Form.Label>
                                                Admin Phone Number
                                            </Form.Label>
                                            <Form.Control
                                                placeholder="+233200000002"
                                                {...register(
                                                    'admin_phone_number'
                                                )}
                                                isInvalid={
                                                    !!errors.admin_phone_number
                                                }
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {
                                                    errors.admin_phone_number
                                                        ?.message
                                                }
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </div>
                                )}
                            </div>

                            <hr className="my-0" />

                            {/* Test Mode */}
                            <div>
                                <Form.Check
                                    type="switch"
                                    id="sms-test-mode-switch"
                                    className="align-items-start"
                                    label={
                                        <span>
                                            <strong>Test mode</strong>
                                            <p className="text-muted small mb-0 mt-1">
                                                Redirects all customer and
                                                branch manager messages to the
                                                test number below. Admin alerts
                                                are unaffected and still reach
                                                the admin phone. Use during
                                                development to avoid messaging
                                                real users.
                                            </p>
                                        </span>
                                    }
                                    {...register('test_mode')}
                                />
                                {testModeOn && (
                                    <div className="mt-2 ms-4">
                                        <Form.Group>
                                            <Form.Label>
                                                Test Phone Number
                                            </Form.Label>
                                            <Form.Control
                                                placeholder="+233200000001"
                                                {...register(
                                                    'test_phone_number'
                                                )}
                                                isInvalid={
                                                    !!errors.test_phone_number
                                                }
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {
                                                    errors.test_phone_number
                                                        ?.message
                                                }
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </div>
                                )}
                            </div>

                            <hr className="my-0" />

                            {/* Admin Only Mode */}
                            <div>
                                <Form.Check
                                    type="switch"
                                    id="sms-admin-only-mode-switch"
                                    className="align-items-start"
                                    label={
                                        <span>
                                            <strong>Admin-only mode</strong>
                                            <p className="text-muted small mb-0 mt-1">
                                                Redirects all customer and
                                                branch manager messages to the
                                                monitoring number. Customer gets
                                                nothing unless mirror mode is
                                                also on. Useful for staging or
                                                UAT.
                                            </p>
                                        </span>
                                    }
                                    {...register('admin_only_mode')}
                                />
                                {adminOnlyModeOn && (
                                    <div className="mt-2 ms-4 d-flex flex-column gap-2">
                                        <Form.Group>
                                            <Form.Label>
                                                Monitoring Phone Number
                                            </Form.Label>
                                            <Form.Control
                                                placeholder="+233200000003"
                                                {...register(
                                                    'admin_only_phone_number'
                                                )}
                                                isInvalid={
                                                    !!errors.admin_only_phone_number
                                                }
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {
                                                    errors
                                                        .admin_only_phone_number
                                                        ?.message
                                                }
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                        <Form.Check
                                            type="switch"
                                            id="sms-mirror-mode-switch"
                                            className="align-items-start"
                                            label={
                                                <span>
                                                    <strong>Mirror mode</strong>
                                                    <p className="text-muted small mb-0 mt-1">
                                                        Also sends to the
                                                        customer so both the
                                                        customer and monitoring
                                                        number receive a copy.
                                                    </p>
                                                </span>
                                            }
                                            {...register('mirror_mode')}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                {/* Notification Triggers */}
                <Card className="mb-3">
                    <Card.Header>
                        <p className="fw-semibold mb-0">
                            Notification Triggers
                        </p>
                    </Card.Header>
                    <Card.Body>
                        <p className="text-muted small mb-3">
                            These are overridden by the system-level SMS toggles
                            in the Notification Settings page.
                        </p>
                        <Row className="g-2">
                            {(
                                [
                                    {
                                        label: 'New booking confirmation',
                                        field: 'send_new_booking',
                                    },
                                    {
                                        label: 'Return reminder',
                                        field: 'send_return_reminder',
                                    },
                                    {
                                        label: 'Overdue alert',
                                        field: 'send_overdue_alert',
                                    },
                                    {
                                        label: 'Pickup reminder',
                                        field: 'send_pickup_reminder',
                                    },
                                    {
                                        label: 'Payment confirmation',
                                        field: 'send_payment_confirmation',
                                    },
                                    {
                                        label: 'Airport booking confirmation',
                                        field: 'send_airport_booking',
                                    },
                                    {
                                        label: 'Airport booking cancelled',
                                        field: 'send_airport_booking_cancelled',
                                    },
                                    {
                                        label: 'Airport booking status changed',
                                        field: 'send_airport_booking_status_changed',
                                    },
                                    {
                                        label: 'Chauffeur booking confirmation',
                                        field: 'send_chauffeur_booking',
                                    },
                                    {
                                        label: 'Chauffeur booking cancelled',
                                        field: 'send_chauffeur_booking_cancelled',
                                    },
                                    {
                                        label: 'Chauffeur booking status changed',
                                        field: 'send_chauffeur_booking_status_changed',
                                    },
                                    {
                                        label: 'Chauffeur pickup reminder',
                                        field: 'send_chauffeur_pickup_reminder',
                                    },
                                    {
                                        label: 'Rental cancelled',
                                        field: 'send_rental_cancelled',
                                    },
                                    {
                                        label: 'Rental status change',
                                        field: 'send_rental_status_change',
                                    },
                                    {
                                        label: 'Driver document expiry',
                                        field: 'send_driver_document_expiry',
                                    },
                                    {
                                        label: 'Vehicle document expiry',
                                        field: 'send_vehicle_expiry',
                                    },
                                    {
                                        label: 'Quote request received',
                                        field: 'send_quote_request',
                                    },
                                    {
                                        label: 'Document expiry alert',
                                        field: 'send_document_expiry_alert',
                                    },
                                ] as {
                                    label: string;
                                    field: keyof SmsSettingsData;
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

                {/* Admin Notification Toggles */}
                {watch('notify_admins') && (
                    <Card className="mb-3">
                        <Card.Header>
                            <p className="fw-semibold mb-0">
                                Admin Notification Toggles
                            </p>
                        </Card.Header>
                        <Card.Body>
                            <p className="text-muted small mb-3">
                                Control which operational events trigger an SMS
                                alert to the admin phone. Active when{' '}
                                <strong>Send notifications to admins</strong> is
                                enabled.
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
                                        field: keyof SmsSettingsData;
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
                )}

                {/* Send Test SMS */}
                <Card className="mb-3">
                    <Card.Header>
                        <p className="fw-semibold mb-0">Send Test SMS</p>
                    </Card.Header>
                    <Card.Body>
                        <p className="text-muted small mb-3">
                            Send a test message to verify your{' '}
                            <strong>
                                {defaultProvider
                                    ? defaultProvider.charAt(0).toUpperCase() +
                                      defaultProvider.slice(1)
                                    : 'selected'}
                            </strong>{' '}
                            provider credentials are working correctly. The SMS
                            is sent directly via the active provider, ignoring
                            delivery mode settings.
                        </p>
                        <Row className="g-3">
                            <Col md={5}>
                                <Form.Group>
                                    <Form.Label>Test Phone Number</Form.Label>
                                    <Form.Control
                                        placeholder="0551234567 or +233551234567"
                                        value={testPhone}
                                        onChange={e => {
                                            setTestPhone(e.target.value);
                                            if (testPhoneError) {
                                                setTestPhoneError('');
                                            }
                                        }}
                                        isInvalid={!!testPhoneError}
                                    />
                                    {testPhoneError ? (
                                        <Form.Control.Feedback type="invalid">
                                            {testPhoneError}
                                        </Form.Control.Feedback>
                                    ) : (
                                        <Form.Text className="text-muted">
                                            Local (0551234567) or international
                                            (+233551234567)
                                        </Form.Text>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md="auto">
                                <Form.Label className="d-block invisible">
                                    &nbsp;
                                </Form.Label>
                                <PermisssionGuard
                                    permission={PERMISSIONS.SETTINGS.EDIT_SMS}
                                >
                                    <Button
                                        variant="outline-primary"
                                        disabled={
                                            testSmsConfig.isPending ||
                                            !defaultProvider
                                        }
                                        onClick={handleTestSms}
                                    >
                                        {testSmsConfig.isPending
                                            ? 'Sending...'
                                            : 'Send Test SMS'}
                                    </Button>
                                </PermisssionGuard>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <div className="d-flex justify-content-end">
                    <PermisssionGuard
                        permission={PERMISSIONS.SETTINGS.EDIT_SMS}
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
