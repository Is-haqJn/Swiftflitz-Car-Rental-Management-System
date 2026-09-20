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
    useResetWhatsAppTemplate,
    useUpdateWhatsAppTemplate,
    useWhatsAppTemplate,
} from '@/shared/hooks/queries/useWhatsAppTemplates';
import { ROUTES } from '@/shared/routes';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';

export default function WhatsAppTemplateEditor() {
    const { key = '' } = useParams<{ key: string }>();
    const title = useTitle('Edit WhatsApp Template');
    const navigate = useNavigate();
    const location = useLocation();
    const returnTab: string =
        (location.state as { returnTab?: string } | null)?.returnTab ??
        'customer';
    const { confirm } = useConfirm();

    const { data: res, isLoading } = useWhatsAppTemplate(key);
    const updateMutation = useUpdateWhatsAppTemplate(key);
    const resetMutation = useResetWhatsAppTemplate(key);

    const template = res?.data;

    const [templateName, setTemplateName] = useState('');
    const [languageCode, setLanguageCode] = useState('en_US');
    const [header, setHeader] = useState('');
    const [body, setBody] = useState('');
    const [footer, setFooter] = useState('');
    const [variables, setVariables] = useState<string[]>([]);

    useEffect(() => {
        if (template) {
            setTemplateName(template.template_name);
            setLanguageCode(template.language_code);
            setHeader(template.header ?? '');
            setBody(template.body);
            setFooter(template.footer ?? '');
            setVariables(template.variables ?? []);
        }
    }, [template]);

    /* Detect {{N}} placeholders in header + body */
    const detectPlaceholderCount = (text: string): number => {
        const matches = text.match(/\{\{\d+\}\}/g) ?? [];
        const indices = matches.map(m => parseInt(m.replace(/\D/g, ''), 10));
        return indices.length > 0 ? Math.max(...indices) : 0;
    };

    const placeholderCount = detectPlaceholderCount(header + body);

    const handleVariableChange = (index: number, value: string) => {
        setVariables(prev => {
            const updated = [...prev];
            updated[index] = value;
            return updated;
        });
    };

    const handleSave = () => {
        updateMutation.mutate({
            template_name: templateName,
            language_code: languageCode,
            header: header || null,
            body,
            footer: footer || null,
            variables,
        });
    };

    const handleReset = async () => {
        const confirmed = await confirm({
            title: 'Reset to Default',
            message:
                'This will discard your customisations and restore the default template content. This cannot be undone.',
            confirmText: 'Reset',
            confirmVariant: 'danger',
        });
        if (confirmed) {
            resetMutation.mutate(undefined, {
                onSuccess: () => {
                    navigate(
                        `${ROUTES.DASHBOARD.SETTINGS.WHATSAPP_TEMPLATES}?tab=${returnTab}`
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
                                `${ROUTES.DASHBOARD.SETTINGS.WHATSAPP_TEMPLATES}?tab=${returnTab}`
                            )
                        }
                    >
                        WhatsApp Templates
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
                                        Template Content
                                    </Card.Title>
                                </Card.Header>
                                <Card.Body className="d-flex flex-column gap-3">
                                    <Alert variant="info" className="mb-0">
                                        Use <code>{'{{1}}'}</code>,{' '}
                                        <code>{'{{2}}'}</code> etc. as
                                        positional placeholders. Register this
                                        exact content in your Meta WhatsApp
                                        Manager with the same template name.
                                    </Alert>

                                    <Row className="g-3">
                                        <Col md={8}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold">
                                                    Template Name
                                                </Form.Label>
                                                <Form.Control
                                                    value={templateName}
                                                    onChange={e =>
                                                        setTemplateName(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="e.g. booking_confirmation"
                                                />
                                                <Form.Text className="text-muted">
                                                    Must match exactly the
                                                    template name registered in
                                                    Meta.
                                                </Form.Text>
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold">
                                                    Language Code
                                                </Form.Label>
                                                <Form.Control
                                                    value={languageCode}
                                                    onChange={e =>
                                                        setLanguageCode(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="e.g. en_US"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group>
                                        <div className="d-flex justify-content-between align-items-baseline mb-1">
                                            <Form.Label className="fw-semibold mb-0">
                                                Header{' '}
                                                <span className="text-muted fw-normal">
                                                    (optional)
                                                </span>
                                            </Form.Label>
                                            <span
                                                className={`small ${header.length > 60 ? 'text-danger fw-semibold' : 'text-muted'}`}
                                            >
                                                {header.length} / 60
                                            </span>
                                        </div>
                                        <Form.Control
                                            value={header}
                                            maxLength={60}
                                            onChange={e =>
                                                setHeader(e.target.value)
                                            }
                                            placeholder="Optional header text"
                                            isInvalid={header.length > 60}
                                        />
                                        <Form.Text className="text-muted">
                                            Max 60 characters (Meta limit).
                                        </Form.Text>
                                    </Form.Group>

                                    <Form.Group>
                                        <div className="d-flex justify-content-between align-items-baseline mb-1">
                                            <Form.Label className="fw-semibold mb-0">
                                                Body{' '}
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </Form.Label>
                                            <span
                                                className={`small ${body.length > 1024 ? 'text-danger fw-semibold' : body.length > 900 ? 'text-warning' : 'text-muted'}`}
                                            >
                                                {body.length} / 1,024
                                            </span>
                                        </div>
                                        <Form.Control
                                            as="textarea"
                                            rows={placeholderCount > 3 ? 7 : 5}
                                            value={body}
                                            maxLength={1024}
                                            onChange={e =>
                                                setBody(e.target.value)
                                            }
                                            placeholder="Message body..."
                                            isInvalid={body.length > 1024}
                                        />
                                        <Form.Text className="text-muted">
                                            Max 1,024 characters (Meta limit).
                                            {placeholderCount > 3 && (
                                                <span className="ms-1 text-info">
                                                    This template uses{' '}
                                                    {placeholderCount} variables
                                                    - ensure your body fits
                                                    within the 1,024 char limit
                                                    with real values
                                                    substituted.
                                                </span>
                                            )}
                                        </Form.Text>
                                    </Form.Group>

                                    <Form.Group>
                                        <div className="d-flex justify-content-between align-items-baseline mb-1">
                                            <Form.Label className="fw-semibold mb-0">
                                                Footer{' '}
                                                <span className="text-muted fw-normal">
                                                    (optional)
                                                </span>
                                            </Form.Label>
                                            <span
                                                className={`small ${footer.length > 60 ? 'text-danger fw-semibold' : 'text-muted'}`}
                                            >
                                                {footer.length} / 60
                                            </span>
                                        </div>
                                        <Form.Control
                                            value={footer}
                                            maxLength={60}
                                            onChange={e =>
                                                setFooter(e.target.value)
                                            }
                                            placeholder="Optional footer text"
                                            isInvalid={footer.length > 60}
                                        />
                                        <Form.Text className="text-muted">
                                            Max 60 characters (Meta limit).
                                        </Form.Text>
                                    </Form.Group>

                                    <PermisssionGuard
                                        permission={
                                            PERMISSIONS.SETTINGS
                                                .EDIT_WHATSAPP_TEMPLATES
                                        }
                                    >
                                        <div className="d-flex gap-2 pt-2 border-top">
                                            <Button
                                                variant="primary"
                                                onClick={handleSave}
                                                disabled={
                                                    updateMutation.isPending ||
                                                    !templateName ||
                                                    !body ||
                                                    body.length > 1024 ||
                                                    header.length > 60 ||
                                                    footer.length > 60
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
                            <Card>
                                <Card.Header>
                                    <Card.Title className="mb-0">
                                        Variable Definitions
                                    </Card.Title>
                                </Card.Header>
                                <Card.Body>
                                    {placeholderCount === 0 ? (
                                        <p className="text-muted small mb-0">
                                            No <code>{'{{N}}'}</code>{' '}
                                            placeholders detected in the header
                                            or body.
                                        </p>
                                    ) : (
                                        <>
                                            <p className="text-muted small mb-2">
                                                Define what each positional
                                                placeholder maps to. This is
                                                used internally to populate the
                                                template at send time.
                                            </p>
                                            <div className="d-flex flex-column gap-2">
                                                {Array.from(
                                                    {
                                                        length: placeholderCount,
                                                    },
                                                    (_, i) => (
                                                        <Form.Group key={i}>
                                                            <Form.Label className="small fw-semibold mb-1">
                                                                <code>{`{{${i + 1}}}`}</code>
                                                            </Form.Label>
                                                            <Form.Control
                                                                size="sm"
                                                                value={
                                                                    variables[
                                                                        i
                                                                    ] ?? ''
                                                                }
                                                                onChange={e =>
                                                                    handleVariableChange(
                                                                        i,
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                placeholder={`e.g. customer_name`}
                                                            />
                                                        </Form.Group>
                                                    )
                                                )}
                                            </div>
                                        </>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <Card.Header>
                                    <Card.Title className="mb-0">
                                        Default Content
                                    </Card.Title>
                                </Card.Header>
                                <Card.Body>
                                    <ListGroup
                                        variant="flush"
                                        className="small"
                                    >
                                        <ListGroup.Item className="px-0">
                                            <span className="text-muted">
                                                Template name:
                                            </span>
                                            <br />
                                            <code>
                                                {template.default_template_name}
                                            </code>
                                        </ListGroup.Item>
                                        <ListGroup.Item className="px-0">
                                            <span className="text-muted">
                                                Body:
                                            </span>
                                            <br />
                                            <span className="text-break">
                                                {template.default_body}
                                            </span>
                                        </ListGroup.Item>
                                    </ListGroup>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </div>
    );
}
