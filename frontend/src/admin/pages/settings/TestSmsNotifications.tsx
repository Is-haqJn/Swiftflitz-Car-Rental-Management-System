import { useState } from 'react';
import { Card, Form, Button, Row, Col, Badge, Alert } from 'react-bootstrap';
import {
    useTestSmsConfig,
    useSmsSettings,
} from '@/shared/hooks/queries/useSettings';
import { useTitle } from '@/shared/hooks';

interface MessageType {
    key: string;
    label: string;
    description: string;
    badge: string;
    badgeVariant: string;
}

const MESSAGE_TYPES: MessageType[] = [
    {
        key: 'connection_test',
        label: 'Connection Test',
        description:
            'Sends a generic test SMS to verify your SMS provider credentials and sender ID are set up correctly.',
        badge: 'System',
        badgeVariant: 'secondary',
    },
    {
        key: 'new_booking',
        label: 'New Booking',
        description:
            'SMS sent to customer when a new rental booking is created.',
        badge: 'Customer',
        badgeVariant: 'primary',
    },
    {
        key: 'rental_cancelled',
        label: 'Rental Cancelled',
        description:
            'SMS sent to customer when their rental booking is cancelled.',
        badge: 'Customer',
        badgeVariant: 'primary',
    },
    {
        key: 'pickup_reminder',
        label: 'Pickup Reminder',
        description:
            'Daily reminder sent to customers with a pickup scheduled for tomorrow.',
        badge: 'Customer',
        badgeVariant: 'primary',
    },
    {
        key: 'return_reminder',
        label: 'Return Reminder',
        description:
            'Daily reminder sent to customers whose vehicle is due for return tomorrow.',
        badge: 'Customer',
        badgeVariant: 'primary',
    },
    {
        key: 'overdue_alert',
        label: 'Overdue Alert',
        description:
            'SMS sent to customers whose rental is overdue for return.',
        badge: 'Customer',
        badgeVariant: 'danger',
    },
    {
        key: 'payment_confirmation',
        label: 'Payment Confirmation',
        description: 'SMS sent to customer when a payment is confirmed.',
        badge: 'Customer',
        badgeVariant: 'success',
    },
    {
        key: 'rental_status_change',
        label: 'Rental Status Change',
        description:
            'SMS sent to customer when rental status is updated (e.g. confirmed, active).',
        badge: 'Customer',
        badgeVariant: 'primary',
    },
    {
        key: 'admin_new_booking',
        label: 'Admin - New Booking',
        description:
            'SMS alert sent to admin/managers when a new booking is created.',
        badge: 'Admin',
        badgeVariant: 'warning',
    },
    {
        key: 'airport_booking',
        label: 'Airport Transfer Booking',
        description: 'SMS sent when a new airport transfer booking is created.',
        badge: 'Airport',
        badgeVariant: 'info',
    },
    {
        key: 'airport_booking_cancelled',
        label: 'Airport Transfer Cancelled',
        description: 'SMS sent when an airport transfer booking is cancelled.',
        badge: 'Airport',
        badgeVariant: 'info',
    },
    {
        key: 'airport_booking_status_changed',
        label: 'Airport Transfer Status',
        description:
            'SMS sent when an airport transfer booking status changes.',
        badge: 'Airport',
        badgeVariant: 'info',
    },
    {
        key: 'chauffeur_booking',
        label: 'Chauffeur Booking',
        description: 'SMS sent when a new chauffeur rental booking is created.',
        badge: 'Chauffeur',
        badgeVariant: 'dark',
    },
    {
        key: 'chauffeur_booking_cancelled',
        label: 'Chauffeur Booking Cancelled',
        description: 'SMS sent when a chauffeur rental booking is cancelled.',
        badge: 'Chauffeur',
        badgeVariant: 'dark',
    },
    {
        key: 'chauffeur_booking_status_changed',
        label: 'Chauffeur Status Change',
        description: 'SMS sent when a chauffeur rental booking status changes.',
        badge: 'Chauffeur',
        badgeVariant: 'dark',
    },
    {
        key: 'chauffeur_pickup_reminder',
        label: 'Chauffeur Pickup Reminder',
        description:
            'Daily reminder for chauffeur pickups scheduled for tomorrow.',
        badge: 'Chauffeur',
        badgeVariant: 'dark',
    },
    {
        key: 'driver_document_expiry',
        label: 'Driver Document Expiry',
        description:
            'Alert sent when a driver license or ID document is expiring within 30 days.',
        badge: 'System',
        badgeVariant: 'secondary',
    },
    {
        key: 'vehicle_expiry',
        label: 'Vehicle Document Expiry',
        description:
            'Alert sent when a vehicle document (roadworthy, insurance) is expiring within 30 days.',
        badge: 'System',
        badgeVariant: 'secondary',
    },
];

const PROVIDER_LABELS: Record<string, string> = {
    arkessel: 'Arkessel',
    twilio: 'Twilio',
    nalo: 'Nalo Solutions',
    hubtel: 'Hubtel SMSC',
};

export default function TestSmsNotifications() {
    const title = useTitle('Test SMS');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const testSms = useTestSmsConfig();
    const { data: smsSettingsRes } = useSmsSettings();

    const currentProvider = smsSettingsRes?.data?.default_provider;
    const providerLabel = currentProvider
        ? (PROVIDER_LABELS[currentProvider] ?? currentProvider)
        : 'your configured provider';

    const validatePhone = (phone: string): boolean => {
        return /^\+?[1-9]\d{7,14}$/.test(phone.replace(/\s/g, ''));
    };

    const handleSend = (type: string) => {
        if (!recipientPhone.trim()) {
            setPhoneError('Please enter a recipient phone number.');
            return;
        }

        if (!validatePhone(recipientPhone)) {
            setPhoneError(
                'Please enter a valid phone number with country code (e.g. +233201234567).'
            );
            return;
        }

        setPhoneError('');
        testSms.mutate({ phone: recipientPhone.trim(), type });
    };

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>Test SMS Notifications</h4>
                <p className="text-muted mb-0">
                    Send test SMS messages to verify your SMS provider and
                    notification templates are working correctly.
                </p>
            </div>

            <Alert variant="info" className="mb-4">
                <strong>Note:</strong> Test SMS messages will be sent using your
                current default provider: <strong>{providerLabel}</strong>. Make
                sure your provider credentials are configured in{' '}
                <strong>Settings &gt; SMS</strong> before testing.
            </Alert>

            <Card className="mb-4">
                <Card.Header>
                    <Card.Title>Recipient Phone Number</Card.Title>
                </Card.Header>
                <Card.Body>
                    <Row className="align-items-start g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    Send test SMS to this number
                                </Form.Label>
                                <Form.Control
                                    type="tel"
                                    placeholder="e.g. +233201234567"
                                    value={recipientPhone}
                                    onChange={e => {
                                        setRecipientPhone(e.target.value);
                                        if (phoneError) {
                                            setPhoneError('');
                                        }
                                    }}
                                    isInvalid={!!phoneError}
                                />
                                {phoneError && (
                                    <Form.Control.Feedback type="invalid">
                                        {phoneError}
                                    </Form.Control.Feedback>
                                )}
                                <Form.Text className="text-muted">
                                    Include the country code (e.g.
                                    +233201234567).
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Row className="g-3">
                {MESSAGE_TYPES.map(msgType => (
                    <Col md={6} key={msgType.key}>
                        <Card className="h-100">
                            <Card.Body className="d-flex flex-column">
                                <div className="d-flex align-items-start justify-content-between mb-2">
                                    <Card.Title className="mb-0 fs-6 fw-semibold">
                                        {msgType.label}
                                    </Card.Title>
                                    <Badge
                                        bg={msgType.badgeVariant}
                                        className="ms-2 flex-shrink-0"
                                    >
                                        {msgType.badge}
                                    </Badge>
                                </div>
                                <p className="text-muted small flex-grow-1">
                                    {msgType.description}
                                </p>
                                <div className="mt-3">
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => handleSend(msgType.key)}
                                        disabled={testSms.isPending}
                                    >
                                        {testSms.isPending
                                            ? 'Sending...'
                                            : 'Send Test SMS'}
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
}
