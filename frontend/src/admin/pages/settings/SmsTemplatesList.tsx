import { Badge, Button, Card, Col, Nav, Row } from 'react-bootstrap';
import { TemplateListSkeleton } from '@adminComponents/skeletons/TemplateListSkeleton';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSmsTemplates } from '@/shared/hooks/queries/useSmsTemplates';
import { ROUTES } from '@/shared/routes';
import { VscEdit } from 'react-icons/vsc';
import { useTitle } from '@/shared/hooks';

type Tab = 'customer' | 'admin';

export default function SmsTemplatesList() {
    const title = useTitle('SMS Templates');
    const { data: res, isLoading } = useSmsTemplates();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = (searchParams.get('tab') as Tab) ?? 'customer';

    const setTab = (value: Tab) => {
        setSearchParams({ tab: value }, { replace: true });
    };

    if (isLoading) {
        return <TemplateListSkeleton />;
    }

    const allTemplates = res?.data ?? [];
    const templates = allTemplates.filter(t =>
        tab === 'admin'
            ? t.key.startsWith('admin_')
            : !t.key.startsWith('admin_')
    );

    return (
        <div>
            {title}
            <div className="page-titles mb-3">
                <h4>SMS Templates</h4>
                <p className="text-muted mb-0">
                    Customise the SMS message templates sent to customers and
                    admins. Use named tokens like{' '}
                    <code>{'{{customer_name}}'}</code> in the message body.
                </p>
            </div>

            <Nav variant="tabs" className="mb-3">
                <Nav.Item>
                    <Nav.Link
                        active={tab === 'customer'}
                        onClick={() => setTab('customer')}
                    >
                        Customer
                        <Badge bg="secondary" className="ms-2">
                            {
                                allTemplates.filter(
                                    t => !t.key.startsWith('admin_')
                                ).length
                            }
                        </Badge>
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link
                        active={tab === 'admin'}
                        onClick={() => setTab('admin')}
                    >
                        Admin
                        <Badge bg="secondary" className="ms-2">
                            {
                                allTemplates.filter(t =>
                                    t.key.startsWith('admin_')
                                ).length
                            }
                        </Badge>
                    </Nav.Link>
                </Nav.Item>
            </Nav>

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
                                            {template.description ?? ''}
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
                                                ROUTES.DASHBOARD.SETTINGS.SMS_TEMPLATE_EDITOR(
                                                    template.key
                                                ),
                                                { state: { returnTab: tab } }
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
