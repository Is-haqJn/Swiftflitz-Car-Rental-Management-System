import { useEffect, useState } from 'react';
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Form,
    ListGroup,
    Row,
} from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useConfirm } from '@/shared/hooks/useConfirm';
import { useTitle } from '@/shared/hooks/useTitle';
import {
    useResetSmsTemplate,
    useSmsTemplate,
    useUpdateSmsTemplate,
} from '@/shared/hooks/queries/useSmsTemplates';
import { ROUTES } from '@/shared/routes';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';

const TEMPLATE_TOKENS: Record<string, string[]> = {
    new_booking: ['customer_name', 'booking_reference', 'vehicle_name'],
    return_reminder: [
        'customer_name',
        'booking_reference',
        'vehicle_name',
        'return_date',
    ],
    overdue_alert: ['customer_name', 'booking_reference', 'vehicle_name'],
    pickup_reminder: [
        'customer_name',
        'booking_reference',
        'vehicle_name',
        'pickup_date',
    ],
    payment_confirmation: ['customer_name', 'booking_reference'],
    admin_new_booking: [
        'booking_reference',
        'branch_name',
        'customer_name',
        'vehicle_name',
        'total_amount',
    ],
};

export default function SmsTemplateEditor() {
    const { key = '' } = useParams<{ key: string }>();
    const title = useTitle('Edit SMS Template');
    const navigate = useNavigate();
    const location = useLocation();
    const returnTab: string =
        (location.state as { returnTab?: string } | null)?.returnTab ??
        'customer';
    const { confirm } = useConfirm();

    const { data: res, isLoading } = useSmsTemplate(key);
    const updateMutation = useUpdateSmsTemplate(key);
    const resetMutation = useResetSmsTemplate(key);

    const template = res?.data;
    const [body, setBody] = useState('');

    useEffect(() => {
        if (template) {
            setBody(template.body);
        }
    }, [template]);

    const availableTokens = TEMPLATE_TOKENS[key] ?? [];

    const insertToken = (token: string) => {
        setBody(prev => prev + `{{${token}}}`);
    };

    const handleSave = () => {
        updateMutation.mutate({ body });
    };

    const handleReset = async () => {
        const confirmed = await confirm({
            title: 'Reset to Default',
            message:
                'This will discard your customisations and restore the default message. This cannot be undone.',
            confirmText: 'Reset',
            confirmVariant: 'danger',
        });
        if (confirmed) {
            resetMutation.mutate(undefined, {
                onSuccess: () => {
                    navigate(
                        `${ROUTES.DASHBOARD.SETTINGS.SMS_TEMPLATES}?tab=${returnTab}`
                    );
                },
            });
        }
    };

    if (isLoading) {
        return <SettingsFormSkeleton />;
    }

    if (!template) {
        return <Alert variant="danger">Template not found.</Alert>;
    }

    return (
        <div>
            {title}

            <div className="page-titles mb-3">
                <div className="d-flex align-items-center gap-2">
                    <Button
                        variant="link"
                        className="p-0 text-muted"
                        onClick={() =>
                            navigate(
                                `${ROUTES.DASHBOARD.SETTINGS.SMS_TEMPLATES}?tab=${returnTab}`
                            )
                        }
                    >
                        SMS Templates
                    </Button>
                    <span className="text-muted">/</span>
                    <h4 className="mb-0">{template.name}</h4>
                    {template.is_customised && (
                        <Badge bg="success">Customised</Badge>
                    )}
                </div>
                <p className="text-muted mb-0 mt-1">{template.description}</p>
            </div>

            <Row className="g-3">
                <Col lg={8}>
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <Card.Header>
                                    <Card.Title className="mb-0">
                                        Message Body
                                    </Card.Title>
                                </Card.Header>
                                <Card.Body className="d-flex flex-column gap-3">
                                    <Form.Group>
                                        <Form.Control
                                            as="textarea"
                                            rows={6}
                                            value={body}
                                            onChange={e =>
                                                setBody(e.target.value)
                                            }
                                            placeholder="SMS message body..."
                                        />
                                        <Form.Text className="text-muted">
                                            Use <code>{'{{token_name}}'}</code>{' '}
                                            to insert dynamic values. Click a
                                            token in the sidebar to insert it.
                                        </Form.Text>
                                    </Form.Group>

                                    <PermisssionGuard
                                        permission={
                                            PERMISSIONS.SETTINGS
                                                .EDIT_SMS_TEMPLATES
                                        }
                                    >
                                        <div className="d-flex gap-2 pt-2 border-top">
                                            <Button
                                                variant="primary"
                                                onClick={handleSave}
                                                disabled={
                                                    updateMutation.isPending ||
                                                    !body
                                                }
                                            >
                                                {updateMutation.isPending
                                                    ? 'Saving...'
                                                    : 'Save Changes'}
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                onClick={handleReset}
                                                disabled={
                                                    resetMutation.isPending
                                                }
                                            >
                                                Reset to Default
                                            </Button>
                                        </div>
                                    </PermisssionGuard>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Col>

                <Col lg={4}>
                    <Row>
                        <Col lg={12}>
                            {availableTokens.length > 0 && (
                                <Card className="mb-3">
                                    <Card.Header>
                                        <Card.Title className="mb-0">
                                            Available Tokens
                                        </Card.Title>
                                    </Card.Header>
                                    <Card.Body>
                                        <p className="text-muted small mb-2">
                                            Click a token to insert it at the
                                            end of the message.
                                        </p>
                                        <ListGroup variant="flush">
                                            {availableTokens.map(token => (
                                                <ListGroup.Item
                                                    key={token}
                                                    action
                                                    className="px-0 py-1"
                                                    onClick={() =>
                                                        insertToken(token)
                                                    }
                                                >
                                                    <code className="text-primary">
                                                        {`{{${token}}}`}
                                                    </code>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    </Card.Body>
                                </Card>
                            )}
                        </Col>

                        <Col lg={12}>
                            <Card>
                                <Card.Header>
                                    <Card.Title className="mb-0">
                                        Default Message
                                    </Card.Title>
                                </Card.Header>
                                <Card.Body>
                                    <p className="small text-break mb-0">
                                        {template.default_body}
                                    </p>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </div>
    );
}
