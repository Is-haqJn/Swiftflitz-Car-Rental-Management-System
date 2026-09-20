import { Badge, Button, Card, Col, Row } from 'react-bootstrap';
import { TemplateListSkeleton } from '@adminComponents/skeletons/TemplateListSkeleton';
import { useNavigate } from 'react-router-dom';
import { useEmailTemplates } from '@/shared/hooks/queries/useEmailTemplates';
import { ROUTES } from '@/shared/routes';
import { VscEdit } from 'react-icons/vsc';
import { useTitle } from '@/shared/hooks';

const TEMPLATE_DESCRIPTIONS: Record<string, string> = {
    booking_confirmation: 'Sent to customers when a booking is confirmed.',
    return_reminder: 'Sent to remind customers of an upcoming vehicle return.',
    overdue_alert:
        'Sent when a booking is overdue and the vehicle has not been returned.',
    quote_confirmation: 'Sent to customers when a quote is submitted.',
    new_quote_request:
        'Sent to admins when a customer submits a new quote request.',
    quote_ready:
        'Sent to customers when an admin has prepared their quote and it is ready to confirm or decline.',
    pickup_reminder:
        'Sent to remind customers of their upcoming vehicle pickup.',
    vehicle_expiry:
        'Sent to admin users when a vehicle document is expiring soon.',
    password_reset: 'Sent to users when they request a password reset link.',
};

export default function EmailTemplatesList() {
    const title = useTitle('Email Templates');
    const { data: res, isLoading } = useEmailTemplates();
    const navigate = useNavigate();

    if (isLoading) {
        return <TemplateListSkeleton />;
    }

    const templates = res?.data ?? [];

    return (
        <div>
            {title}
            <div className="page-titles mb-3">
                <h4>Email Templates</h4>
                <p className="text-muted mb-0">
                    Customise the HTML email templates sent to customers. Use
                    the visual editor to modify content and tokens.
                </p>
            </div>

            <Row className="g-3">
                {templates.map(template => (
                    <Col md={6} key={template.key}>
                        <Card className="h-100">
                            <Card.Body className="d-flex flex-column gap-2">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h6 className="mb-0 fw-semibold">
                                            {template.name}
                                        </h6>
                                        <small className="text-muted">
                                            {TEMPLATE_DESCRIPTIONS[
                                                template.key
                                            ] ??
                                                template.description ??
                                                ''}
                                        </small>
                                    </div>
                                    <Badge
                                        bg={
                                            template.is_customised
                                                ? 'success'
                                                : 'secondary'
                                        }
                                        className="ms-2 flex-shrink-0"
                                    >
                                        {template.is_customised
                                            ? 'Customised'
                                            : 'Default'}
                                    </Badge>
                                </div>

                                <div className="mt-auto d-flex justify-content-between align-items-center pt-2 border-top">
                                    <small className="text-muted">
                                        {template.updated_at
                                            ? `Last edited: ${new Date(template.updated_at).toLocaleDateString()}`
                                            : 'Never edited'}
                                    </small>
                                    <Button
                                        size="sm"
                                        variant="outline-primary"
                                        onClick={() =>
                                            navigate(
                                                ROUTES.DASHBOARD.SETTINGS.EMAIL_TEMPLATE_EDITOR(
                                                    template.key
                                                )
                                            )
                                        }
                                    >
                                        <span className="me-1">
                                            <VscEdit />
                                        </span>
                                        Edit
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
