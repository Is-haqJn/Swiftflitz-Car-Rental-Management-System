import { useState } from 'react';
import { Card, Form, Button, Row, Col, Badge } from 'react-bootstrap';
import { useSendTestEmail } from '@/shared/hooks/queries/useNotifications';
import { useTitle } from '@/shared/hooks';

interface EmailType {
    key: string;
    label: string;
    description: string;
    badge: string;
    badgeVariant: string;
}

const EMAIL_TYPES: EmailType[] = [
    {
        key: 'booking_confirmation',
        label: 'Booking Confirmation',
        description:
            'Sent to customers when a new rental booking is created. Uses the most recent rental record as sample data.',
        badge: 'Rental',
        badgeVariant: 'primary',
    },
    {
        key: 'overdue_alert',
        label: 'Overdue Alert',
        description:
            'Sent to staff when a rental becomes overdue. Uses the most recent rental record as sample data.',
        badge: 'Rental',
        badgeVariant: 'danger',
    },
    {
        key: 'return_reminder',
        label: 'Return Reminder',
        description:
            'Reminds staff about upcoming rental return dates. Uses the most recent rental record as sample data.',
        badge: 'Rental',
        badgeVariant: 'warning',
    },
    {
        key: 'pickup_reminder',
        label: 'Pickup Reminder',
        description:
            'Reminds staff when a rental pickup date is approaching. Uses the most recent rental record as sample data.',
        badge: 'Rental',
        badgeVariant: 'info',
    },
    {
        key: 'vehicle_expiry',
        label: 'Vehicle Expiry',
        description:
            'Notifies staff when a vehicle document (insurance/roadworthy) is expiring soon. Uses the most recent vehicle record.',
        badge: 'Vehicle',
        badgeVariant: 'secondary',
    },
    {
        key: 'quote_confirmation',
        label: 'Quote Confirmation',
        description:
            'Sent to customers when a quote request is received. Uses the most recent quote request as sample data.',
        badge: 'Quote',
        badgeVariant: 'success',
    },
    {
        key: 'new_quote_request',
        label: 'New Quote Request (Admin)',
        description:
            'Sent to admins when a customer submits a new quote request. Uses the most recent quote request as sample data.',
        badge: 'Quote',
        badgeVariant: 'warning',
    },
    {
        key: 'quote_ready',
        label: 'Quote Ready',
        description:
            'Sent to customers when an admin has prepared their quote and it is ready to confirm. Uses the most recent quote request as sample data.',
        badge: 'Quote',
        badgeVariant: 'primary',
    },
];

export default function TestEmailNotifications() {
    const title = useTitle('Test Notifications');
    const [recipientEmail, setRecipientEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const sendTestEmail = useSendTestEmail();

    const validateEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSend = (type: string) => {
        if (!recipientEmail.trim()) {
            setEmailError('Please enter a recipient email address.');
            return;
        }

        if (!validateEmail(recipientEmail)) {
            setEmailError('Please enter a valid email address.');
            return;
        }

        setEmailError('');
        sendTestEmail.mutate({ type, email: recipientEmail });
    };

    const isSending = (type: string) =>
        sendTestEmail.isPending && sendTestEmail.variables?.type === type;

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>Test Email Notifications</h4>
                <p className="text-muted mb-0">
                    Send test emails to verify your email configuration and
                    templates are working correctly.
                </p>
            </div>

            <Card className="mb-4">
                <Card.Header>
                    <Card.Title>Recipient Email Address</Card.Title>
                </Card.Header>
                <Card.Body>
                    <Row className="align-items-start g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    Send test emails to this address
                                </Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="e.g. admin@example.com"
                                    value={recipientEmail}
                                    onChange={e => {
                                        setRecipientEmail(e.target.value);
                                        if (emailError) {
                                            setEmailError('');
                                        }
                                    }}
                                    isInvalid={!!emailError}
                                />
                                {emailError && (
                                    <Form.Control.Feedback type="invalid">
                                        {emailError}
                                    </Form.Control.Feedback>
                                )}
                                <Form.Text className="text-muted">
                                    All test emails below will be sent to this
                                    address using your most recent data records.
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Row className="g-3">
                {EMAIL_TYPES.map(emailType => (
                    <Col md={6} key={emailType.key}>
                        <Card className="h-100">
                            <Card.Body className="d-flex flex-column">
                                <div className="d-flex align-items-start justify-content-between mb-2">
                                    <Card.Title className="mb-0 fs-6 fw-semibold">
                                        {emailType.label}
                                    </Card.Title>
                                    <Badge
                                        bg={emailType.badgeVariant}
                                        className="ms-2 flex-shrink-0"
                                    >
                                        {emailType.badge}
                                    </Badge>
                                </div>
                                <p className="text-muted small flex-grow-1">
                                    {emailType.description}
                                </p>
                                <div className="mt-3">
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() =>
                                            handleSend(emailType.key)
                                        }
                                        disabled={
                                            isSending(emailType.key) ||
                                            sendTestEmail.isPending
                                        }
                                    >
                                        {isSending(emailType.key)
                                            ? 'Sending…'
                                            : 'Send Test Email'}
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
