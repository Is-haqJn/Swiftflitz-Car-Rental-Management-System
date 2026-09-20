import { useState } from 'react';
import { Card, Form, Button, Row, Col, Badge, Alert } from 'react-bootstrap';
import { useTestWhatsAppConfig } from '@/shared/hooks/queries/useSettings';
import { useTitle } from '@/shared/hooks';

interface TemplateType {
    key: string;
    label: string;
    description: string;
    badge: string;
    badgeVariant: string;
}

const TEMPLATE_TYPES: TemplateType[] = [
    {
        key: 'hello_world',
        label: 'Hello World (Connection Test)',
        description:
            'The Meta-approved hello_world template. Use this to verify your WhatsApp Business API credentials and phone number ID are configured correctly.',
        badge: 'System',
        badgeVariant: 'secondary',
    },
    {
        key: 'new_booking',
        label: 'New Booking',
        description:
            'Template sent to customer when a new rental booking is created. Uses sample booking data.',
        badge: 'Customer',
        badgeVariant: 'primary',
    },
    {
        key: 'rental_cancelled',
        label: 'Rental Cancelled',
        description:
            'Template sent to customer when their rental booking is cancelled.',
        badge: 'Customer',
        badgeVariant: 'primary',
    },
    {
        key: 'pickup_reminder',
        label: 'Pickup Reminder',
        description:
            'Template for the daily pickup reminder sent to customers with a pickup scheduled tomorrow.',
        badge: 'Customer',
        badgeVariant: 'primary',
    },
    {
        key: 'return_reminder',
        label: 'Return Reminder',
        description:
            'Template for the daily return reminder sent to customers whose vehicle is due back tomorrow.',
        badge: 'Customer',
        badgeVariant: 'primary',
    },
    {
        key: 'overdue_alert',
        label: 'Overdue Alert',
        description:
            'Template sent to customers whose rental is overdue for return.',
        badge: 'Customer',
        badgeVariant: 'danger',
    },
    {
        key: 'payment_confirmation',
        label: 'Payment Confirmation',
        description: 'Template sent to customer when a payment is confirmed.',
        badge: 'Customer',
        badgeVariant: 'success',
    },
    {
        key: 'rental_status_change',
        label: 'Rental Status Change',
        description:
            'Template sent to customer when rental status is updated (e.g. confirmed, active).',
        badge: 'Customer',
        badgeVariant: 'primary',
    },
    {
        key: 'admin_new_booking',
        label: 'Admin - New Booking',
        description:
            'Template alert sent to admin/managers when a new booking is created.',
        badge: 'Admin',
        badgeVariant: 'warning',
    },
    {
        key: 'airport_booking',
        label: 'Airport Transfer Booking',
        description:
            'Template sent when a new airport transfer booking is created.',
        badge: 'Airport',
        badgeVariant: 'info',
    },
    {
        key: 'airport_booking_cancelled',
        label: 'Airport Transfer Cancelled',
        description:
            'Template sent when an airport transfer booking is cancelled.',
        badge: 'Airport',
        badgeVariant: 'info',
    },
    {
        key: 'airport_booking_status_changed',
        label: 'Airport Transfer Status',
        description:
            'Template sent when an airport transfer booking status changes.',
        badge: 'Airport',
        badgeVariant: 'info',
    },
    {
        key: 'chauffeur_booking',
        label: 'Chauffeur Booking',
        description:
            'Template sent when a new chauffeur rental booking is created.',
        badge: 'Chauffeur',
        badgeVariant: 'dark',
    },
    {
        key: 'chauffeur_booking_cancelled',
        label: 'Chauffeur Booking Cancelled',
        description:
            'Template sent when a chauffeur rental booking is cancelled.',
        badge: 'Chauffeur',
        badgeVariant: 'dark',
    },
    {
        key: 'chauffeur_booking_status_changed',
        label: 'Chauffeur Status Change',
        description:
            'Template sent when a chauffeur rental booking status changes.',
        badge: 'Chauffeur',
        badgeVariant: 'dark',
    },
    {
        key: 'chauffeur_pickup_reminder',
        label: 'Chauffeur Pickup Reminder',
        description:
            'Template for chauffeur pickup reminders sent the day before pickup.',
        badge: 'Chauffeur',
        badgeVariant: 'dark',
    },
    {
        key: 'driver_document_expiry',
        label: 'Driver Document Expiry',
        description:
            'Alert template sent when a driver license or ID document is expiring within 30 days.',
        badge: 'System',
        badgeVariant: 'secondary',
    },
    {
        key: 'vehicle_expiry',
        label: 'Vehicle Document Expiry',
        description:
            'Alert template sent when a vehicle document (roadworthy, insurance) is expiring within 30 days.',
        badge: 'System',
        badgeVariant: 'secondary',
    },
];

export default function TestWhatsAppNotifications() {
    const title = useTitle('Test WhatsApp');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const testWhatsApp = useTestWhatsAppConfig();

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
        testWhatsApp.mutate({ phone: recipientPhone.trim(), type });
    };

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>Test WhatsApp Notifications</h4>
                <p className="text-muted mb-0">
                    Send test WhatsApp messages to verify your Meta Business API
                    configuration and notification templates are working
                    correctly.
                </p>
            </div>

            <Alert variant="info" className="mb-4">
                <strong>Note:</strong> WhatsApp Business API only supports
                pre-approved templates for business-initiated messages.
                Event-specific tests use the corresponding registered template
                with sample data. If a template is not yet approved, the system
                will fall back to the <strong>hello_world</strong> template
                automatically. Make sure your WhatsApp credentials are
                configured in <strong>Settings &gt; WhatsApp</strong> before
                testing. The recipient must be registered on WhatsApp.
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
                                    Send test message to this number
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
                                    +233201234567). The number must be
                                    registered on WhatsApp.
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Row className="g-3">
                {TEMPLATE_TYPES.map(template => (
                    <Col md={6} key={template.key}>
                        <Card className="h-100">
                            <Card.Body className="d-flex flex-column">
                                <div className="d-flex align-items-start justify-content-between mb-2">
                                    <Card.Title className="mb-0 fs-6 fw-semibold">
                                        {template.label}
                                    </Card.Title>
                                    <Badge
                                        bg={template.badgeVariant}
                                        className="ms-2 flex-shrink-0"
                                    >
                                        {template.badge}
                                    </Badge>
                                </div>
                                <p className="text-muted small flex-grow-1">
                                    {template.description}
                                </p>
                                <div className="mt-3">
                                    <Button
                                        variant="outline-success"
                                        size="sm"
                                        onClick={() => handleSend(template.key)}
                                        disabled={testWhatsApp.isPending}
                                    >
                                        {testWhatsApp.isPending
                                            ? 'Sending...'
                                            : 'Send Test Message'}
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
