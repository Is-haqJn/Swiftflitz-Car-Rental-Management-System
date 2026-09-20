import { useEffect, useState } from 'react';
import {
    Card,
    Form,
    Row,
    Col,
    Button,
    Alert,
    InputGroup,
} from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useForm } from 'react-hook-form';
import { applyServerErrors } from '@/shared/libs/utils';
import type { WhatsAppSettingsData } from '@/shared/types';
import {
    useWhatsAppSettings,
    useUpdateWhatsAppSettings,
    useTestWhatsAppConfig,
} from '@/shared/hooks/queries/useSettings';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';
import { useTitle } from '@/shared/hooks';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export default function WhatsAppSettings() {
    const title = useTitle('WhatsApp Settings');
    const { data: res, isLoading } = useWhatsAppSettings();
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const updateMutation = useUpdateWhatsAppSettings();
    const testWhatsAppConfig = useTestWhatsAppConfig();
    const [testPhone, setTestPhone] = useState('');
    const [testPhoneError, setTestPhoneError] = useState('');
    const {
        register,
        handleSubmit,
        reset,
        setError,
        watch,
        formState: { errors },
    } = useForm<WhatsAppSettingsData>({
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

    const enabled = watch('enabled');
    const testModeOn = watch('test_mode');
    const adminOnlyModeOn = watch('admin_only_mode');

    const copyUrl = (url: string) => {
        navigator.clipboard.writeText(url).then(() => {
            setCopiedUrl(url);
            setTimeout(() => setCopiedUrl(null), 2000);
        });
    };

    useEffect(() => {
        if (res?.data) {
            reset(res.data);
        }
    }, [res, reset]);

    const onSubmit = (data: WhatsAppSettingsData) => {
        updateMutation.mutate(data, {
            onError: error => applyServerErrors(error, setError),
        });
    };

    const handleTestWhatsApp = () => {
        if (!testPhone.trim()) {
            setTestPhoneError('Enter a phone number to send the test to.');
            return;
        }
        setTestPhoneError('');
        testWhatsAppConfig.mutate({ phone: testPhone });
    };

    if (isLoading) {
        return <SettingsFormSkeleton />;
    }

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>WhatsApp Settings</h4>
                <p className="text-muted mb-0">
                    Configure Meta WhatsApp Cloud API integration for customer
                    and admin notifications.
                </p>
            </div>

            <Form onSubmit={handleSubmit(onSubmit)}>
                {/* Master Enable */}
                <Card className="mb-3">
                    <Card.Body>
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <p className="fw-semibold mb-1">
                                    Enable WhatsApp Notifications
                                </p>
                                <p className="text-muted small mb-0">
                                    Master switch - turn off to stop all
                                    WhatsApp messages.
                                </p>
                            </div>
                            <Form.Check
                                type="switch"
                                id="enabled-switch"
                                {...register('enabled')}
                            />
                        </div>
                    </Card.Body>
                </Card>

                {/* API Credentials */}
                <Card className="mb-3">
                    <Card.Header>
                        <p className="fw-semibold mb-0">API Credentials</p>
                    </Card.Header>
                    <Card.Body>
                        <Alert variant="info" className="small mb-3">
                            Get these values from your{' '}
                            <strong>Meta Developer Console</strong> under your
                            WhatsApp Business App. The access token is your
                            System User Access Token.
                        </Alert>
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Access Token</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="EAAxxxxxx..."
                                        {...register('access_token')}
                                        isInvalid={!!errors.access_token}
                                    />
                                    <Form.Text className="text-muted">
                                        System User Access Token from Meta
                                        Business Manager.
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.access_token?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Phone Number ID</Form.Label>
                                    <Form.Control
                                        placeholder="123456789..."
                                        {...register('phone_number_id')}
                                        isInvalid={!!errors.phone_number_id}
                                    />
                                    <Form.Text className="text-muted">
                                        From Meta &gt; WhatsApp &gt; API Setup.
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.phone_number_id?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>
                                        Business Account ID (WABA ID)
                                    </Form.Label>
                                    <Form.Control
                                        placeholder="987654321..."
                                        {...register('business_account_id')}
                                        isInvalid={!!errors.business_account_id}
                                    />
                                    <Form.Text className="text-muted">
                                        Your WhatsApp Business Account ID.
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.business_account_id?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>App Secret</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="App secret from Meta App Dashboard"
                                        {...register('app_secret')}
                                        isInvalid={!!errors.app_secret}
                                    />
                                    <Form.Text className="text-muted">
                                        From Meta App &gt; Settings &gt; Basic.
                                        Used to verify incoming webhook
                                        signatures (HMAC-SHA256).
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.app_secret?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>
                                        Webhook Verify Token
                                    </Form.Label>
                                    <Form.Control
                                        placeholder="your-verify-token"
                                        {...register('webhook_verify_token')}
                                        isInvalid={
                                            !!errors.webhook_verify_token
                                        }
                                    />
                                    <Form.Text className="text-muted">
                                        A token you choose. Set this same value
                                        in Meta &gt; WhatsApp &gt; Configuration
                                        &gt; Webhooks.
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.webhook_verify_token?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Webhook URLs - only shown when WhatsApp is enabled */}
                {enabled && (
                    <Card className="mb-3">
                        <Card.Header>
                            <p className="fw-semibold mb-0">Webhook URLs</p>
                        </Card.Header>
                        <Card.Body>
                            <Alert variant="warning" className="small mb-3">
                                Register these URLs in your{' '}
                                <strong>Meta Developer Console</strong> under
                                WhatsApp &gt; Configuration &gt; Webhooks. Use
                                the POST URL for the webhook callback, and enter
                                your <strong>Webhook Verify Token</strong> (set
                                above in API Credentials) in Meta's verify token
                                field.
                            </Alert>
                            {[
                                {
                                    label: 'Webhook Verification (GET)',
                                    url: `${API_BASE_URL}/webhooks/whatsapp`,
                                    description:
                                        'Meta sends a GET request to this URL to verify your webhook.',
                                },
                                {
                                    label: 'Incoming Messages (POST)',
                                    url: `${API_BASE_URL}/webhooks/whatsapp`,
                                    description:
                                        'Meta sends incoming message events to this URL.',
                                },
                            ].map(({ label, url, description }) => (
                                <div key={label} className="mb-3">
                                    <Form.Label className="small fw-semibold mb-1">
                                        {label}
                                    </Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            readOnly
                                            value={url}
                                            className="font-monospace small"
                                        />
                                        <Button
                                            variant="outline-secondary"
                                            onClick={() => copyUrl(url)}
                                        >
                                            {copiedUrl === url
                                                ? 'Copied!'
                                                : 'Copy'}
                                        </Button>
                                    </InputGroup>
                                    <Form.Text className="text-muted">
                                        {description}
                                    </Form.Text>
                                </div>
                            ))}
                        </Card.Body>
                    </Card>
                )}

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
                                    id="notify-customers-switch"
                                    label={
                                        <span>
                                            <strong>
                                                Send notifications to customers
                                            </strong>
                                            <p className="text-muted small mb-0 mt-1">
                                                When off, no WhatsApp messages
                                                are sent to customer phone
                                                numbers.
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
                                    id="notify-branch-managers-switch"
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
                                    id="notify-admins-switch"
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
                                    id="test-mode-switch"
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
                                    id="admin-only-mode-switch"
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
                                            id="mirror-mode-switch"
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
                            These are overridden by the system-level WhatsApp
                            toggles in the Notification Settings page.
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
                                    field: keyof WhatsAppSettingsData;
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
                                Control which operational events trigger a
                                WhatsApp alert to the admin phone. Active when{' '}
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
                                        field: keyof WhatsAppSettingsData;
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

                {/* Send Test WhatsApp */}
                <Card className="mb-3">
                    <Card.Header>
                        <p className="fw-semibold mb-0">
                            Send Test WhatsApp Message
                        </p>
                    </Card.Header>
                    <Card.Body>
                        <p className="text-muted small mb-3">
                            Send a test message to verify your WhatsApp
                            credentials are working correctly. The message is
                            sent directly via the Meta Cloud API, ignoring
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
                                    permission={
                                        PERMISSIONS.SETTINGS.EDIT_WHATSAPP
                                    }
                                >
                                    <Button
                                        variant="outline-primary"
                                        disabled={testWhatsAppConfig.isPending}
                                        onClick={handleTestWhatsApp}
                                    >
                                        {testWhatsAppConfig.isPending
                                            ? 'Sending...'
                                            : 'Send Test Message'}
                                    </Button>
                                </PermisssionGuard>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <div className="d-flex justify-content-end">
                    <PermisssionGuard
                        permission={PERMISSIONS.SETTINGS.EDIT_WHATSAPP}
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
