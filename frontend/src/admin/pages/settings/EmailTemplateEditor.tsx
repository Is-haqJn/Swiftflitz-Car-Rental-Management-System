import grapesjs from 'grapesjs';
import type { Editor, Plugin } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import grapesjsNewsletterPlugin from 'grapesjs-preset-newsletter';
import { useEffect, useRef, useState } from 'react';
import {
    Badge,
    Button,
    Card,
    Col,
    Form,
    ListGroup,
    Row,
    Spinner,
} from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useNavigate, useParams } from 'react-router-dom';
import { useConfirm } from '@/shared/hooks/useConfirm';
import { useTitle } from '@/shared/hooks/useTitle';
import {
    useEmailTemplate,
    useResetEmailTemplate,
    useUpdateEmailTemplate,
} from '@/shared/hooks/queries/useEmailTemplates';
import { ROUTES } from '@/shared/routes';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';

interface TokenDef {
    token: string;
    description: string;
}

const GLOBAL_TOKENS: TokenDef[] = [
    { token: '{{app_name}}', description: 'Application name' },
    { token: '{{support_email}}', description: 'Support email address' },
    { token: '{{year}}', description: 'Current year' },
];

const TEMPLATE_TOKENS: Record<string, TokenDef[]> = {
    booking_confirmation: [
        { token: '{{customer_name}}', description: "Customer's full name" },
        {
            token: '{{booking_reference}}',
            description: 'Booking reference code',
        },
        { token: '{{vehicle_name}}', description: 'Vehicle make and model' },
        { token: '{{pickup_date}}', description: 'Pickup date' },
        { token: '{{return_date}}', description: 'Return date' },
        { token: '{{duration}}', description: 'Number of days' },
        { token: '{{total_cost}}', description: 'Total cost amount' },
        { token: '{{currency_symbol}}', description: 'Currency symbol' },
    ],
    return_reminder: [
        { token: '{{customer_name}}', description: "Customer's full name" },
        {
            token: '{{booking_reference}}',
            description: 'Booking reference code',
        },
        { token: '{{vehicle_name}}', description: 'Vehicle make and model' },
        { token: '{{return_date}}', description: 'Return date' },
        { token: '{{return_time}}', description: 'Return time (e.g. 5:00 PM)' },
    ],
    overdue_alert: [
        { token: '{{customer_name}}', description: "Customer's full name" },
        { token: '{{vehicle_name}}', description: 'Vehicle make and model' },
        {
            token: '{{booking_reference}}',
            description: 'Booking reference code',
        },
        { token: '{{return_date}}', description: 'Original return date' },
        {
            token: '{{return_time}}',
            description: 'Original return time (e.g. 5:00 PM)',
        },
        { token: '{{days_overdue}}', description: 'Number of days overdue' },
    ],
    quote_confirmation: [
        { token: '{{customer_name}}', description: "Customer's full name" },
        { token: '{{quote_reference}}', description: 'Quote reference code' },
        { token: '{{vehicle_name}}', description: 'Requested vehicle name' },
        { token: '{{pickup_date}}', description: 'Requested pickup date' },
        { token: '{{return_date}}', description: 'Requested return date' },
        { token: '{{rental_days}}', description: 'Number of rental days' },
    ],
    quote_ready: [
        { token: '{{customer_name}}', description: "Customer's full name" },
        { token: '{{quote_reference}}', description: 'Quote reference code' },
        { token: '{{vehicle_name}}', description: 'Requested vehicle name' },
        { token: '{{rental_days}}', description: 'Number of rental days' },
        { token: '{{pickup_date}}', description: 'Requested pickup date' },
        { token: '{{return_date}}', description: 'Requested return date' },
        { token: '{{base_cost}}', description: 'Calculated base rental cost' },
        {
            token: '{{deposit_amount}}',
            description: 'Security deposit amount',
        },
        {
            token: '{{confirm_url}}',
            description: 'Link for customer to confirm the quote',
        },
        {
            token: '{{cancel_url}}',
            description: 'Link for customer to decline the quote',
        },
        { token: '{{expires_at}}', description: 'Quote expiry date and time' },
    ],
    new_quote_request: [
        {
            token: '{{recipient_name}}',
            description: "Admin/manager's name",
        },
        { token: '{{customer_name}}', description: "Customer's full name" },
        {
            token: '{{customer_email}}',
            description: "Customer's email address",
        },
        { token: '{{customer_phone}}', description: "Customer's phone number" },
        { token: '{{quote_reference}}', description: 'Quote reference code' },
        { token: '{{vehicle_name}}', description: 'Requested vehicle name' },
        { token: '{{rental_days}}', description: 'Number of rental days' },
        { token: '{{message}}', description: "Customer's message / notes" },
    ],
    pickup_reminder: [
        { token: '{{customer_name}}', description: "Customer's full name" },
        {
            token: '{{booking_reference}}',
            description: 'Booking reference code',
        },
        { token: '{{vehicle_name}}', description: 'Vehicle make and model' },
        { token: '{{pickup_date}}', description: 'Pickup date' },
        { token: '{{pickup_time}}', description: 'Pickup time (e.g. 9:00 AM)' },
        { token: '{{return_date}}', description: 'Return date' },
        { token: '{{return_time}}', description: 'Return time (e.g. 5:00 PM)' },
    ],
    vehicle_expiry: [
        { token: '{{vehicle_name}}', description: 'Vehicle make and model' },
        { token: '{{license_plate}}', description: 'Vehicle license plate' },
        {
            token: '{{document_type}}',
            description: 'Document type (Roadworthy/Insurance)',
        },
        {
            token: '{{expiry_date}}',
            description: 'Expiry date of the document',
        },
    ],
    password_reset: [
        { token: '{{customer_name}}', description: "User's full name" },
        { token: '{{reset_url}}', description: 'Password reset link URL' },
        {
            token: '{{expire_minutes}}',
            description: 'Link expiry duration in minutes',
        },
    ],
};

function GrapesEditor({
    initialHtml,
    onInit,
}: {
    initialHtml: string;
    onInit: (editor: Editor) => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<Editor | null>(null);

    useEffect(() => {
        if (!containerRef.current || editorRef.current) {
            return;
        }

        const editor = grapesjs.init({
            container: containerRef.current,
            components: initialHtml,
            plugins: [grapesjsNewsletterPlugin as Plugin],
            pluginsOpts: {
                [grapesjsNewsletterPlugin as never]: {},
            },
            storageManager: false,
            height: '640px',
            // ? Prevent GrapeJS from injecting styles that conflict with the Bootstrap admin theme
            protectedCss: '',
        });

        editorRef.current = editor;
        onInit(editor);

        return () => {
            editor.destroy();
            editorRef.current = null;
        };
        // intentionally only run once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ? isolation: 'isolate' creates a new stacking context so GrapeJS z-indexes don't
    // ? bleed into the admin layout; overflow: hidden prevents panel overflow.
    return (
        <div
            ref={containerRef}
            style={{ isolation: 'isolate', overflow: 'hidden', minHeight: 640 }}
        />
    );
}

export default function EmailTemplateEditor() {
    const title = useTitle('Email Template Editor');
    const { key } = useParams<{ key: string }>();
    const navigate = useNavigate();
    const { confirm } = useConfirm();

    const { data: res, isLoading } = useEmailTemplate(key ?? '');
    const updateMutation = useUpdateEmailTemplate(key ?? '');
    const resetMutation = useResetEmailTemplate(key ?? '');

    const editorRef = useRef<Editor | null>(null);
    const [editorReady, setEditorReady] = useState(false);

    const template = res?.data;
    const [subject, setSubject] = useState('');

    // Sync subject state when template data loads
    useEffect(() => {
        if (template?.subject) {
            setSubject(template.subject);
        }
    }, [template?.subject]);

    const handleEditorInit = (editor: Editor) => {
        editorRef.current = editor;
        setEditorReady(true);
    };

    const handleSave = () => {
        if (!editorRef.current || !subject.trim()) {
            return;
        }

        // ? GrapesJS stores CSS separately from HTML - combine them so styles
        // ? are preserved when the template is saved and later rendered via email.
        const htmlContent = editorRef.current.getHtml();
        const cssContent = editorRef.current.getCss();
        const fullHtml = cssContent
            ? `<style>${cssContent}</style>\n${htmlContent}`
            : htmlContent;

        updateMutation.mutate({
            subject: subject.trim(),
            html_content: fullHtml,
        });
    };

    const handleReset = async () => {
        const confirmed = await confirm({
            title: 'Reset to Default',
            message:
                'This will discard all customisations and restore the template to its original default. This action cannot be undone.',
            confirmText: 'Reset',
            confirmVariant: 'danger',
        });

        if (confirmed) {
            resetMutation.mutate(undefined, {
                onSuccess: () => {
                    navigate(ROUTES.DASHBOARD.SETTINGS.EMAIL_TEMPLATES);
                },
            });
        }
    };

    if (isLoading) {
        return <SettingsFormSkeleton />;
    }

    if (!template) {
        return (
            <div className="text-center py-5 text-muted">
                <p>Template not found.</p>
                <Button
                    variant="link"
                    onClick={() =>
                        navigate(ROUTES.DASHBOARD.SETTINGS.EMAIL_TEMPLATES)
                    }
                >
                    Back to templates
                </Button>
            </div>
        );
    }

    const tokens = [...(TEMPLATE_TOKENS[template.key] ?? []), ...GLOBAL_TOKENS];
    const activeHtml = template.html_content ?? template.default_html ?? '';

    return (
        <div>
            {title}
            <div className="page-titles mb-3 d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div>
                    <h4 className="mb-0">{template.name}</h4>
                    <p className="text-muted mb-0 mt-1">
                        Edit the HTML content and subject line for this email
                        template.
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() =>
                            navigate(ROUTES.DASHBOARD.SETTINGS.EMAIL_TEMPLATES)
                        }
                    >
                        Back
                    </Button>
                    <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={handleReset}
                        disabled={
                            resetMutation.isPending || !template.is_customised
                        }
                    >
                        {resetMutation.isPending ? (
                            <Spinner size="sm" className="me-1" />
                        ) : null}
                        Reset to Default
                    </Button>
                    <PermisssionGuard
                        permission={PERMISSIONS.SETTINGS.EDIT_EMAIL}
                    >
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSave}
                            disabled={updateMutation.isPending || !editorReady}
                        >
                            {updateMutation.isPending ? (
                                <Spinner size="sm" className="me-1" />
                            ) : null}
                            Save Changes
                        </Button>
                    </PermisssionGuard>
                </div>
            </div>

            <Row className="g-3">
                <Col xl={9}>
                    <Row>
                        <Col lg={12}>
                            <Card className="mb-3">
                                <Card.Body>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold">
                                            Email Subject
                                        </Form.Label>
                                        <Form.Control
                                            value={subject}
                                            onChange={e =>
                                                setSubject(e.target.value)
                                            }
                                            placeholder="Enter email subject…"
                                        />
                                        <Form.Text className="text-muted">
                                            Tokens such as{' '}
                                            <code>{'{{customer_name}}'}</code>{' '}
                                            can be used in the subject line.
                                        </Form.Text>
                                    </Form.Group>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={12}>
                            <Card>
                                <Card.Header className="fw-semibold">
                                    HTML Content
                                </Card.Header>
                                <Card.Body
                                    className="p-0"
                                    style={{ overflow: 'hidden' }}
                                >
                                    <GrapesEditor
                                        initialHtml={activeHtml}
                                        onInit={handleEditorInit}
                                    />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Col>
                <Col xl={3}>
                    <Row>
                        <Col lg={12}>
                            <Card className="sticky-top">
                                <Card.Header className="fw-semibold d-flex align-items-center gap-2">
                                    Available Tokens
                                    {template.is_customised && (
                                        <Badge bg="success" className="ms-auto">
                                            Customised
                                        </Badge>
                                    )}
                                </Card.Header>
                                <Card.Body className="p-0">
                                    <ListGroup variant="flush">
                                        {tokens.map(
                                            ({ token, description }) => (
                                                <ListGroup.Item
                                                    key={token}
                                                    className="py-2 px-3"
                                                >
                                                    <code className="d-block text-primary fs-13">
                                                        {token}
                                                    </code>
                                                    <small className="text-muted">
                                                        {description}
                                                    </small>
                                                </ListGroup.Item>
                                            )
                                        )}
                                    </ListGroup>
                                </Card.Body>
                                <Card.Footer
                                    className="text-muted"
                                    style={{ fontSize: '0.75rem' }}
                                >
                                    Click a token to copy, then paste it in the
                                    editor or subject.
                                </Card.Footer>
                            </Card>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </div>
    );
}
