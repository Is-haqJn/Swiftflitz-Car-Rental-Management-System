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
import type { PaymentSettingsData } from '@/shared/types';
import {
    usePaymentSettings,
    useUpdatePaymentSettings,
} from '@/shared/hooks/queries/useSettings';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';
import { useTitle } from '@/shared/hooks';

const MASKED = '••••••••';
const BASE_URL = import.meta.env.VITE_BASE_URL ?? '';

function isMasked(value?: string): boolean {
    return value === MASKED;
}

export default function PaymentSettings() {
    const title = useTitle('Payment Settings');
    const { data: res, isLoading } = usePaymentSettings();
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

    const copyUrl = (url: string) => {
        navigator.clipboard.writeText(url).then(() => {
            setCopiedUrl(url);
            setTimeout(() => setCopiedUrl(null), 2000);
        });
    };
    const updateMutation = useUpdatePaymentSettings();
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setError,
        formState: { errors },
    } = useForm<PaymentSettingsData>();

    useEffect(() => {
        if (res?.data) reset(res.data);
    }, [res, reset]);

    const provider = watch('payment_provider');
    const enablePaystack = watch('enable_paystack');
    const enableStripe = watch('enable_stripe');
    const enableHubtel = watch('enable_hubtel');

    const onSubmit = (data: PaymentSettingsData) => {
        // Strip masked placeholder values - don't overwrite existing secrets
        const payload: PaymentSettingsData = { ...data };
        if (isMasked(payload.paystack_secret_key))
            delete payload.paystack_secret_key;
        if (isMasked(payload.stripe_secret_key))
            delete payload.stripe_secret_key;
        if (isMasked(payload.hubtel_client_secret))
            delete payload.hubtel_client_secret;
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
                <h4>Payment Settings</h4>
                <p className="text-muted mb-0">
                    Configure payment gateway integrations.
                </p>
            </div>

            <Form onSubmit={handleSubmit(onSubmit)}>
                {/* General */}
                <Card className="mb-3">
                    <Card.Header>
                        <Card.Title>General</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Payment Currency</Form.Label>
                                    <Form.Control
                                        {...register('payment_currency')}
                                        placeholder="e.g. GHS, USD"
                                        isInvalid={!!errors.payment_currency}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.payment_currency?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Default Provider</Form.Label>
                                    <Form.Select
                                        className="tw:h-[2.9rem]"
                                        {...register('payment_provider')}
                                        isInvalid={!!errors.payment_provider}
                                    >
                                        <option value="paystack">
                                            Paystack
                                        </option>
                                        <option value="stripe">Stripe</option>
                                        <option value="hubtel">Hubtel</option>
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.payment_provider?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Check
                                    type="switch"
                                    id="enable_online_payments"
                                    label="Enable Online Payments"
                                    {...register('enable_online_payments')}
                                />
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Paystack */}
                <Card className="mb-3">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <Card.Title className="mb-0">Paystack</Card.Title>
                        <Form.Check
                            type="switch"
                            id="enable_paystack"
                            label="Enable"
                            {...register('enable_paystack')}
                        />
                    </Card.Header>
                    {(provider === 'paystack' || !provider) && (
                        <Card.Body>
                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Public Key</Form.Label>
                                        <Form.Control
                                            {...register('paystack_public_key')}
                                            placeholder="pk_live_..."
                                            isInvalid={
                                                !!errors.paystack_public_key
                                            }
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {
                                                errors.paystack_public_key
                                                    ?.message
                                            }
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Secret Key</Form.Label>
                                        <Form.Control
                                            type="password"
                                            {...register('paystack_secret_key')}
                                            placeholder="sk_live_... (leave blank to keep existing)"
                                            isInvalid={
                                                !!errors.paystack_secret_key
                                            }
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {
                                                errors.paystack_secret_key
                                                    ?.message
                                            }
                                        </Form.Control.Feedback>
                                        <Form.Text className="text-muted">
                                            Leave blank to keep the current
                                            secret key.
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                                <Col md={12}>
                                    <Form.Group>
                                        <Form.Label>
                                            Logo URL{' '}
                                            <span className="text-muted fw-normal">
                                                (optional)
                                            </span>
                                        </Form.Label>
                                        <Form.Control
                                            {...register('paystack_logo_url')}
                                            placeholder="https://... (leave blank to use default logo)"
                                            isInvalid={
                                                !!errors.paystack_logo_url
                                            }
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.paystack_logo_url?.message}
                                        </Form.Control.Feedback>
                                        <Form.Text className="text-muted">
                                            Custom logo shown on the payment
                                            page. Leave blank to use the
                                            default.
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Card.Body>
                    )}
                </Card>

                {/* Stripe */}
                <Card className="mb-3">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <Card.Title className="mb-0">Stripe</Card.Title>
                        <Form.Check
                            type="switch"
                            id="enable_stripe"
                            label="Enable"
                            {...register('enable_stripe')}
                        />
                    </Card.Header>
                    {provider === 'stripe' && (
                        <Card.Body>
                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Public Key</Form.Label>
                                        <Form.Control
                                            {...register('stripe_public_key')}
                                            placeholder="pk_live_..."
                                            isInvalid={
                                                !!errors.stripe_public_key
                                            }
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.stripe_public_key?.message}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Secret Key</Form.Label>
                                        <Form.Control
                                            type="password"
                                            {...register('stripe_secret_key')}
                                            placeholder="sk_live_... (leave blank to keep existing)"
                                            isInvalid={
                                                !!errors.stripe_secret_key
                                            }
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.stripe_secret_key?.message}
                                        </Form.Control.Feedback>
                                        <Form.Text className="text-muted">
                                            Leave blank to keep the current
                                            secret key.
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                                <Col md={12}>
                                    <Form.Group>
                                        <Form.Label>
                                            Logo URL{' '}
                                            <span className="text-muted fw-normal">
                                                (optional)
                                            </span>
                                        </Form.Label>
                                        <Form.Control
                                            {...register('stripe_logo_url')}
                                            placeholder="https://... (leave blank to use default logo)"
                                            isInvalid={!!errors.stripe_logo_url}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.stripe_logo_url?.message}
                                        </Form.Control.Feedback>
                                        <Form.Text className="text-muted">
                                            Custom logo shown on the payment
                                            page. Leave blank to use the
                                            default.
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Card.Body>
                    )}
                </Card>

                {/* Hubtel */}
                <Card className="mb-3">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <Card.Title className="mb-0">Hubtel</Card.Title>
                        <Form.Check
                            type="switch"
                            id="enable_hubtel"
                            label="Enable"
                            {...register('enable_hubtel')}
                        />
                    </Card.Header>
                    {provider === 'hubtel' && (
                        <Card.Body>
                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Client ID</Form.Label>
                                        <Form.Control
                                            {...register('hubtel_client_id')}
                                            placeholder="Hubtel Client ID"
                                            isInvalid={
                                                !!errors.hubtel_client_id
                                            }
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.hubtel_client_id?.message}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Client Secret</Form.Label>
                                        <Form.Control
                                            type="password"
                                            {...register(
                                                'hubtel_client_secret'
                                            )}
                                            placeholder="(leave blank to keep existing)"
                                            isInvalid={
                                                !!errors.hubtel_client_secret
                                            }
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {
                                                errors.hubtel_client_secret
                                                    ?.message
                                            }
                                        </Form.Control.Feedback>
                                        <Form.Text className="text-muted">
                                            Leave blank to keep the current
                                            client secret.
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>
                                            Merchant Account Number{' '}
                                            <span className="text-muted fw-normal">
                                                (POS Sales ID)
                                            </span>
                                        </Form.Label>
                                        <Form.Control
                                            {...register(
                                                'hubtel_merchant_account_number'
                                            )}
                                            placeholder="e.g. 11684"
                                            isInvalid={
                                                !!errors.hubtel_merchant_account_number
                                            }
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {
                                                errors
                                                    .hubtel_merchant_account_number
                                                    ?.message
                                            }
                                        </Form.Control.Feedback>
                                        <Form.Text className="text-muted">
                                            Required for transaction status
                                            checks. Find yours in the Hubtel
                                            dashboard.
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>
                                            Logo URL{' '}
                                            <span className="text-muted fw-normal">
                                                (optional)
                                            </span>
                                        </Form.Label>
                                        <Form.Control
                                            {...register('hubtel_logo_url')}
                                            placeholder="https://... (leave blank to use default logo)"
                                            isInvalid={!!errors.hubtel_logo_url}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.hubtel_logo_url?.message}
                                        </Form.Control.Feedback>
                                        <Form.Text className="text-muted">
                                            Custom logo shown on the payment
                                            page. Leave blank to use the
                                            default.
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Card.Body>
                    )}
                </Card>

                {/* Webhook URLs - only shown for enabled providers */}
                {(enablePaystack || enableStripe || enableHubtel) && (
                    <Card className="mb-3">
                        <Card.Header>
                            <Card.Title className="mb-0">
                                Webhook URLs
                            </Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <Alert variant="warning" className="small mb-3">
                                Register the webhook URL for each enabled
                                provider in their dashboard so payment events
                                are received correctly.
                            </Alert>
                            {[
                                {
                                    label: 'Paystack Webhook (POST)',
                                    url: `${BASE_URL}/api/v1/payments/webhook/paystack`,
                                    show: enablePaystack,
                                },
                                {
                                    label: 'Stripe Webhook (POST)',
                                    url: `${BASE_URL}/api/v1/payments/webhook/stripe`,
                                    show: enableStripe,
                                },
                                {
                                    label: 'Hubtel Webhook (POST)',
                                    url: `${BASE_URL}/api/v1/payments/webhook/hubtel`,
                                    show: enableHubtel,
                                },
                            ]
                                .filter(({ show }) => show)
                                .map(({ label, url }) => (
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
                                    </div>
                                ))}
                        </Card.Body>
                    </Card>
                )}

                <div className="d-flex justify-content-end">
                    <PermisssionGuard
                        permission={PERMISSIONS.SETTINGS.EDIT_PAYMENT}
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
