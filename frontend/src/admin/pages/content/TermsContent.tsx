import { useEffect, useRef, useState } from 'react';
import { Card, Form, Row, Col, Button, Spinner } from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useForm } from 'react-hook-form';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { applyServerErrors } from '@/shared/libs/utils';
import type { TermsSettingsData } from '@/shared/types';
import {
    useTermsSettings,
    useUpdateTermsSettings,
    useUploadTermsBannerImage,
} from '@/shared/hooks/queries/useSettings';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';
import { useTitle } from '@/shared/hooks';

const BANNER_IMAGE_PATH = '/assets/images/terms-banner.jpg';
const IMAGE_FALLBACK = '/assets/images/main-slider/slide2/bg-pic1.jpg';

/* Banner Section Card */

function BannerSectionCard({
    initialData,
}: {
    initialData: TermsSettingsData;
}) {
    const updateMutation = useUpdateTermsSettings();
    const uploadBannerMutation = useUploadTermsBannerImage();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<TermsSettingsData>({ defaultValues: initialData });

    const [bannerVersion, setBannerVersion] = useState(
        initialData.banner_image_version ?? Date.now()
    );

    const bannerFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        reset(initialData);
        setBannerVersion(initialData.banner_image_version ?? Date.now());
    }, [initialData, reset]);

    const onSubmit = (data: TermsSettingsData) => {
        updateMutation.mutate(
            { banner_title: data.banner_title },
            { onError: error => applyServerErrors(error, setError) }
        );
    };

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        uploadBannerMutation.mutate(file, {
            onSuccess: () => setBannerVersion(Date.now()),
        });
        e.target.value = '';
    };

    return (
        <Card className="mb-4">
            <Card.Header>
                <strong>Banner Section</strong>
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row className="g-3">
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Page Title</Form.Label>
                                <Form.Control
                                    {...register('banner_title')}
                                    placeholder="Terms & Conditions"
                                    isInvalid={!!errors.banner_title}
                                />
                                <Form.Text className="text-muted">
                                    Heading displayed on the Terms page banner
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    {errors.banner_title?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        <Col md={12}>
                            <Form.Label className="fw-semibold">
                                Banner Background Image
                            </Form.Label>
                            <div className="d-flex align-items-start gap-3">
                                <img
                                    src={`${BANNER_IMAGE_PATH}?v=${bannerVersion}`}
                                    alt="Banner"
                                    onError={e => {
                                        (
                                            e.currentTarget as HTMLImageElement
                                        ).src = IMAGE_FALLBACK;
                                    }}
                                    style={{
                                        width: 120,
                                        height: 80,
                                        objectFit: 'cover',
                                        borderRadius: 6,
                                        border: '1px solid #dee2e6',
                                        flexShrink: 0,
                                    }}
                                />
                                <div>
                                    <input
                                        ref={bannerFileRef}
                                        type="file"
                                        accept="image/*"
                                        className="d-none"
                                        onChange={handleBannerChange}
                                    />
                                    <Button
                                        variant="outline-primary"
                                        type="button"
                                        disabled={
                                            uploadBannerMutation.isPending
                                        }
                                        onClick={() =>
                                            bannerFileRef.current?.click()
                                        }
                                    >
                                        {uploadBannerMutation.isPending ? (
                                            <>
                                                <Spinner
                                                    as="span"
                                                    animation="border"
                                                    size="sm"
                                                    className="me-2"
                                                />
                                                Uploading…
                                            </>
                                        ) : (
                                            'Replace Image'
                                        )}
                                    </Button>
                                    <Form.Text className="d-block text-muted mt-1">
                                        JPG, PNG or WebP · max 4 MB
                                    </Form.Text>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end mt-4">
                        <PermisssionGuard
                            permission={PERMISSIONS.WEBSITE.EDIT_HOMEPAGE}
                        >
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending
                                    ? 'Saving…'
                                    : 'Save Settings'}
                            </Button>
                        </PermisssionGuard>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
}

/* Toolbar Button */

function ToolbarButton({
    onClick,
    active,
    disabled,
    children,
}: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onMouseDown={e => {
                e.preventDefault();
                onClick();
            }}
            disabled={disabled}
            style={{
                padding: '4px 8px',
                marginRight: 2,
                border: '1px solid #dee2e6',
                borderRadius: 4,
                background: active ? '#e9ecef' : 'white',
                fontWeight: active ? 600 : 400,
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: 13,
                color: disabled ? '#adb5bd' : '#212529',
            }}
        >
            {children}
        </button>
    );
}

/* Content Section Card */

function ContentSectionCard({
    initialData,
}: {
    initialData: TermsSettingsData;
}) {
    const updateMutation = useUpdateTermsSettings();

    const editor = useEditor({
        extensions: [StarterKit],
        content: initialData.content ?? '',
        editorProps: {
            attributes: {
                style: 'min-height: 400px; padding: 12px; outline: none;',
            },
        },
    });

    useEffect(() => {
        if (editor && initialData.content !== undefined) {
            const current = editor.getHTML();
            if (current !== initialData.content) {
                editor.commands.setContent(initialData.content ?? '');
            }
        }
    }, [editor, initialData.content]);

    const handleSave = () => {
        if (!editor) return;
        updateMutation.mutate({ content: editor.getHTML() });
    };

    if (!editor) return null;

    return (
        <Card className="mb-4">
            <Card.Header>
                <strong>Terms & Conditions Content</strong>
            </Card.Header>
            <Card.Body>
                {/* Toolbar */}
                <div
                    style={{
                        borderBottom: '1px solid #dee2e6',
                        paddingBottom: 8,
                        marginBottom: 8,
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 2,
                    }}
                >
                    <ToolbarButton
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleHeading({ level: 1 })
                                .run()
                        }
                        active={editor.isActive('heading', { level: 1 })}
                    >
                        H1
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleHeading({ level: 2 })
                                .run()
                        }
                        active={editor.isActive('heading', { level: 2 })}
                    >
                        H2
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleHeading({ level: 3 })
                                .run()
                        }
                        active={editor.isActive('heading', { level: 3 })}
                    >
                        H3
                    </ToolbarButton>
                    <span
                        style={{
                            width: 1,
                            background: '#dee2e6',
                            margin: '0 4px',
                        }}
                    />
                    <ToolbarButton
                        onClick={() =>
                            editor.chain().focus().toggleBold().run()
                        }
                        active={editor.isActive('bold')}
                    >
                        <strong>B</strong>
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() =>
                            editor.chain().focus().toggleItalic().run()
                        }
                        active={editor.isActive('italic')}
                    >
                        <em>I</em>
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() =>
                            editor.chain().focus().toggleStrike().run()
                        }
                        active={editor.isActive('strike')}
                    >
                        <s>S</s>
                    </ToolbarButton>
                    <span
                        style={{
                            width: 1,
                            background: '#dee2e6',
                            margin: '0 4px',
                        }}
                    />
                    <ToolbarButton
                        onClick={() =>
                            editor.chain().focus().toggleBulletList().run()
                        }
                        active={editor.isActive('bulletList')}
                    >
                        • List
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() =>
                            editor.chain().focus().toggleOrderedList().run()
                        }
                        active={editor.isActive('orderedList')}
                    >
                        1. List
                    </ToolbarButton>
                    <span
                        style={{
                            width: 1,
                            background: '#dee2e6',
                            margin: '0 4px',
                        }}
                    />
                    <ToolbarButton
                        onClick={() =>
                            editor.chain().focus().toggleBlockquote().run()
                        }
                        active={editor.isActive('blockquote')}
                    >
                        &ldquo; Quote
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() =>
                            editor.chain().focus().setHorizontalRule().run()
                        }
                    >
                        - Rule
                    </ToolbarButton>
                    <span
                        style={{
                            width: 1,
                            background: '#dee2e6',
                            margin: '0 4px',
                        }}
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                    >
                        ↩ Undo
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                    >
                        ↪ Redo
                    </ToolbarButton>
                </div>

                {/* Editor */}
                <div
                    style={{
                        border: '1px solid #dee2e6',
                        borderRadius: 6,
                        minHeight: 400,
                    }}
                    className="terms-editor"
                >
                    <EditorContent editor={editor} />
                </div>

                <div className="d-flex justify-content-end mt-3">
                    <PermisssionGuard
                        permission={PERMISSIONS.WEBSITE.EDIT_HOMEPAGE}
                    >
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending
                                ? 'Saving…'
                                : 'Save Content'}
                        </Button>
                    </PermisssionGuard>
                </div>
            </Card.Body>
        </Card>
    );
}

/* Page */

export default function TermsContent() {
    const title = useTitle('Terms & Conditions Page');
    const { data: res, isLoading } = useTermsSettings();

    if (isLoading) {
        return <SettingsFormSkeleton cards={2} />;
    }

    const data = res?.data ?? {};

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>Terms & Conditions Page Content</h4>
                <p className="text-muted mb-0">
                    Manage the banner and content of the Terms & Conditions
                    page.
                </p>
            </div>

            <BannerSectionCard initialData={data} />
            <ContentSectionCard initialData={data} />
        </div>
    );
}
