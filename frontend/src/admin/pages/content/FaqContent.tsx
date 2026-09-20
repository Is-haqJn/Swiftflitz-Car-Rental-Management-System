import { useEffect, useRef, useState } from 'react';
import { Card, Form, Row, Col, Button, Spinner } from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useForm } from 'react-hook-form';
import { applyServerErrors } from '@/shared/libs/utils';
import type { FaqItem, FaqSettingsData } from '@/shared/types';
import {
    useFaqSettings,
    useUpdateFaqSettings,
    useUploadFaqBannerImage,
    useUploadFaqSectionBgImage,
} from '@/shared/hooks/queries/useSettings';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';
import { useTitle } from '@/shared/hooks';

const BANNER_IMAGE_PATH = '/assets/images/faqs-banner.jpg';
const SECTION_BG_IMAGE_PATH = '/assets/images/faq-section-bg.jpg';
const IMAGE_FALLBACK = '/assets/images/main-slider/slide2/bg-pic1.jpg';

/* Banner Section Card */

function BannerSectionCard({ initialData }: { initialData: FaqSettingsData }) {
    const updateMutation = useUpdateFaqSettings();
    const uploadBannerMutation = useUploadFaqBannerImage();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<FaqSettingsData>({ defaultValues: initialData });

    const [bannerImageUrl, setBannerImageUrl] = useState(
        initialData.banner_image_url ?? null
    );

    const bannerFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        reset(initialData);
        setBannerImageUrl(initialData.banner_image_url ?? null);
    }, [initialData, reset]);

    const onSubmit = (data: FaqSettingsData) => {
        updateMutation.mutate(
            { banner_title: data.banner_title },
            { onError: error => applyServerErrors(error, setError) }
        );
    };

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        setBannerImageUrl(previewUrl);
        uploadBannerMutation.mutate(file, {
            onSuccess: res => {
                URL.revokeObjectURL(previewUrl);
                setBannerImageUrl(res.data.banner_image_url ?? null);
            },
            onError: () => {
                URL.revokeObjectURL(previewUrl);
                setBannerImageUrl(initialData.banner_image_url ?? null);
            },
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
                                    placeholder="FAQ's"
                                    isInvalid={!!errors.banner_title}
                                />
                                <Form.Text className="text-muted">
                                    Heading displayed on the FAQs page banner
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
                                    src={
                                        bannerImageUrl
                                            ? bannerImageUrl
                                            : BANNER_IMAGE_PATH
                                    }
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

/* FAQ Section Card */

const DEFAULT_FAQ_ITEMS: FaqItem[] = [{ question: '', answer: '' }];

function FaqSectionCard({ initialData }: { initialData: FaqSettingsData }) {
    const updateMutation = useUpdateFaqSettings();
    const uploadBgMutation = useUploadFaqSectionBgImage();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<FaqSettingsData>({ defaultValues: initialData });

    const [enabled, setEnabled] = useState(
        initialData.faq_section_enabled ?? true
    );
    const [bgImageUrl, setBgImageUrl] = useState(
        initialData.faq_section_bg_image_url ?? null
    );
    const [items, setItems] = useState<FaqItem[]>(
        initialData.faq_items?.length
            ? initialData.faq_items
            : DEFAULT_FAQ_ITEMS
    );

    const bgFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        reset(initialData);
        setEnabled(initialData.faq_section_enabled ?? true);
        setBgImageUrl(initialData.faq_section_bg_image_url ?? null);
        setItems(
            initialData.faq_items?.length
                ? initialData.faq_items
                : DEFAULT_FAQ_ITEMS
        );
    }, [initialData, reset]);

    const handleBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        setBgImageUrl(previewUrl);
        uploadBgMutation.mutate(file, {
            onSuccess: res => {
                URL.revokeObjectURL(previewUrl);
                setBgImageUrl(res.data.faq_section_bg_image_url ?? null);
            },
            onError: () => {
                URL.revokeObjectURL(previewUrl);
                setBgImageUrl(initialData.faq_section_bg_image_url ?? null);
            },
        });
        e.target.value = '';
    };

    const updateItem = (index: number, field: keyof FaqItem, value: string) => {
        setItems(prev =>
            prev.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        );
    };

    const addItem = () => {
        setItems(prev => [...prev, { question: '', answer: '' }]);
    };

    const removeItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const onSubmit = (data: FaqSettingsData) => {
        const filledItems = items.filter(item => item.question.trim());
        updateMutation.mutate(
            {
                faq_section_enabled: enabled,
                faq_section_large_title: data.faq_section_large_title,
                faq_items: filledItems,
            },
            { onError: error => applyServerErrors(error, setError) }
        );
    };

    return (
        <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <strong>FAQ Section</strong>
                <Form.Check
                    type="switch"
                    id="faq-section-toggle"
                    label={enabled ? 'Visible' : 'Hidden'}
                    checked={enabled}
                    onChange={e => setEnabled(e.target.checked)}
                />
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    {/* Side Background Image */}
                    <Form.Label className="fw-semibold">
                        Side Background Image
                    </Form.Label>
                    <div className="d-flex align-items-start gap-3 mb-4">
                        <img
                            src={
                                bgImageUrl ? bgImageUrl : SECTION_BG_IMAGE_PATH
                            }
                            alt="FAQ section background"
                            onError={e => {
                                (e.currentTarget as HTMLImageElement).src =
                                    IMAGE_FALLBACK;
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
                                ref={bgFileRef}
                                type="file"
                                accept="image/*"
                                className="d-none"
                                onChange={handleBgChange}
                            />
                            <Button
                                variant="outline-primary"
                                type="button"
                                disabled={uploadBgMutation.isPending}
                                onClick={() => bgFileRef.current?.click()}
                            >
                                {uploadBgMutation.isPending ? (
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

                    {/* Large Title */}
                    <Row className="g-3 mb-4">
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Section Heading</Form.Label>
                                <Form.Control
                                    {...register('faq_section_large_title')}
                                    placeholder="Frequently Asked Questions"
                                    isInvalid={!!errors.faq_section_large_title}
                                />
                                <Form.Text className="text-muted">
                                    Main heading displayed above the accordion
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    {errors.faq_section_large_title?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* FAQ Items */}
                    <Form.Label className="fw-semibold d-block mb-2">
                        FAQ Items
                    </Form.Label>
                    <div className="d-flex flex-column gap-3 mb-3">
                        {items.map((item, index) => (
                            <div
                                key={index}
                                className="border rounded p-3"
                                style={{ background: '#f8f9fa' }}
                            >
                                <Row className="g-2 align-items-start">
                                    <Col md={11}>
                                        <Form.Group className="mb-2">
                                            <Form.Label className="small fw-semibold">
                                                Question
                                            </Form.Label>
                                            <Form.Control
                                                size="sm"
                                                value={item.question}
                                                onChange={e =>
                                                    updateItem(
                                                        index,
                                                        'question',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="e.g. How do I book a vehicle?"
                                            />
                                        </Form.Group>
                                        <Form.Group>
                                            <Form.Label className="small fw-semibold">
                                                Answer
                                            </Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                size="sm"
                                                rows={3}
                                                value={item.answer}
                                                onChange={e =>
                                                    updateItem(
                                                        index,
                                                        'answer',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Enter the answer…"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col
                                        md={1}
                                        className="d-flex align-items-start justify-content-end pt-4"
                                    >
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            type="button"
                                            onClick={() => removeItem(index)}
                                        >
                                            ×
                                        </Button>
                                    </Col>
                                </Row>
                            </div>
                        ))}
                    </div>

                    <Button
                        variant="outline-secondary"
                        size="sm"
                        type="button"
                        className="mb-4"
                        onClick={addItem}
                    >
                        + Add FAQ
                    </Button>

                    <div className="d-flex justify-content-end">
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

/* Page */

export default function FaqContent() {
    const title = useTitle('FAQs Page');
    const { data: res, isLoading } = useFaqSettings();

    if (isLoading) {
        return <SettingsFormSkeleton cards={2} />;
    }

    const data = res?.data ?? {};

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>FAQs Page Content</h4>
                <p className="text-muted mb-0">
                    Manage each section of the FAQs page independently.
                </p>
            </div>

            <BannerSectionCard initialData={data} />
            <FaqSectionCard initialData={data} />
        </div>
    );
}
