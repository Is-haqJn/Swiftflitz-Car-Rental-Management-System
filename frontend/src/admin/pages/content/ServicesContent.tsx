import { useEffect, useRef, useState } from 'react';
import { Card, Form, Row, Col, Button, Spinner, Modal } from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useForm } from 'react-hook-form';
import { applyServerErrors } from '@/shared/libs/utils';
import type {
    ServiceFacilityCard,
    ServicesSettingsData,
    WhyChooseUsCard,
} from '@/shared/types';
import {
    useServicesSettings,
    useUpdateServicesSettings,
    useUploadServicesBannerImage,
    useUploadServicesFacilityCardImage,
    useUploadServicesWhyChooseUsBgImage,
    useUploadListingsBannerImage,
    useUploadAirportTransferBannerImage,
    useUploadChauffeurBannerImage,
} from '@/shared/hooks/queries/useSettings';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';
import { useTitle } from '@/shared/hooks';

const BANNER_IMAGE_FALLBACK = '/assets/images/services-banner.jpg';
const CARD_IMAGE_FALLBACK = '/assets/images/main-slider/slide2/bg-pic1.jpg';

const DEFAULT_FACILITIES_CARDS: ServiceFacilityCard[] = [
    {
        image_url: '',
        title: 'Car Rental',
        description:
            'Choose from our wide range of vehicles and enjoy a seamless self-drive rental experience at competitive rates.',
        button_text: 'Book Now',
        button_url: '/vehicles',
    },
    {
        image_url: '',
        title: 'Chauffeur Service',
        description:
            'Travel in style and comfort with our professional chauffeur-driven vehicles for any occasion.',
        button_text: 'Book Now',
        button_url: '/chauffeur-services',
    },
    {
        image_url: '',
        title: 'Airport Transfer',
        description:
            'Reliable and punctual airport transfers to and from all major airports, available 24/7.',
        button_text: 'Book Now',
        button_url: '/airport-transfer',
    },
];

/* Banner Section Card */

function BannerSectionCard({
    initialData,
}: {
    initialData: ServicesSettingsData;
}) {
    const updateMutation = useUpdateServicesSettings();
    const uploadBannerMutation = useUploadServicesBannerImage();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<ServicesSettingsData>({ defaultValues: initialData });

    const [bannerImageUrl, setBannerImageUrl] = useState(
        initialData.banner_image_url ?? null
    );

    const bannerFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        reset(initialData);
        setBannerImageUrl(initialData.banner_image_url ?? null);
    }, [initialData, reset]);

    const onSubmit = (data: ServicesSettingsData) => {
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
                                    placeholder="SERVICES"
                                    isInvalid={!!errors.banner_title}
                                />
                                <Form.Text className="text-muted">
                                    Heading displayed on the services page
                                    banner
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
                                        bannerImageUrl ?? BANNER_IMAGE_FALLBACK
                                    }
                                    alt="Banner"
                                    onError={e => {
                                        (
                                            e.currentTarget as HTMLImageElement
                                        ).src = CARD_IMAGE_FALLBACK;
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

/* Card Edit Modal */

interface CardEditModalProps {
    show: boolean;
    cardIndex: number;
    card: ServiceFacilityCard;
    onHide: () => void;
    onSave: (index: number, card: ServiceFacilityCard) => void;
    onImageUpload: (file: File, index: number) => void;
    isUploading: boolean;
}

function CardEditModal({
    show,
    cardIndex,
    card,
    onHide,
    onSave,
    onImageUpload,
    isUploading,
}: CardEditModalProps) {
    const [draft, setDraft] = useState<ServiceFacilityCard>(card);
    const [imgVersion, setImgVersion] = useState(Date.now());
    const fileRef = useRef<HTMLInputElement>(null);

    // Full reset only when modal opens (show changes)
    useEffect(() => {
        setDraft(card);
        setImgVersion(Date.now());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show]);

    // Patch only image_url when upload completes while modal is open
    useEffect(() => {
        if (show) {
            setDraft(prev => ({ ...prev, image_url: card.image_url ?? '' }));
            setImgVersion(Date.now());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [card.image_url]);

    const update = (field: keyof ServiceFacilityCard, value: string) => {
        setDraft(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        onImageUpload(file, cardIndex);
        e.target.value = '';
        setImgVersion(Date.now());
    };

    const imagePreviewSrc = draft.image_url
        ? draft.image_url.startsWith('http')
            ? draft.image_url
            : `/${draft.image_url.replace(/^\//, '')}?v=${imgVersion}`
        : CARD_IMAGE_FALLBACK;

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Edit Service Card</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row className="g-3">
                    {/* Image */}
                    <Col md={12}>
                        <Form.Label className="fw-semibold">
                            Card Image
                        </Form.Label>
                        <div className="d-flex align-items-start gap-3">
                            <img
                                src={imagePreviewSrc}
                                alt="card"
                                onError={e => {
                                    (e.currentTarget as HTMLImageElement).src =
                                        CARD_IMAGE_FALLBACK;
                                }}
                                style={{
                                    width: 200,
                                    height: 130,
                                    objectFit: 'cover',
                                    borderRadius: 8,
                                    border: '1px solid #dee2e6',
                                    flexShrink: 0,
                                    background: '#e9ecef',
                                }}
                            />
                            <div>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    className="d-none"
                                    onChange={handleFileChange}
                                />
                                <Button
                                    variant="outline-secondary"
                                    type="button"
                                    disabled={isUploading}
                                    onClick={() => fileRef.current?.click()}
                                >
                                    {isUploading ? (
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
                                        'Upload Image'
                                    )}
                                </Button>
                                <Form.Text className="d-block text-muted mt-1">
                                    JPG, PNG or WebP · max 4 MB
                                </Form.Text>
                                <Form.Text className="d-block text-muted">
                                    Image is saved immediately on upload.
                                </Form.Text>
                            </div>
                        </div>
                    </Col>

                    {/* Title */}
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label>Title</Form.Label>
                            <Form.Control
                                value={draft.title ?? ''}
                                onChange={e => update('title', e.target.value)}
                                placeholder="e.g. Car Rental"
                            />
                        </Form.Group>
                    </Col>

                    {/* Description */}
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={draft.description ?? ''}
                                onChange={e =>
                                    update('description', e.target.value)
                                }
                                placeholder="Short description…"
                            />
                        </Form.Group>
                    </Col>

                    {/* Button text */}
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>Button Text</Form.Label>
                            <Form.Control
                                value={draft.button_text ?? ''}
                                onChange={e =>
                                    update('button_text', e.target.value)
                                }
                                placeholder="Book Now"
                            />
                        </Form.Group>
                    </Col>

                    {/* Button URL */}
                    <Col md={8}>
                        <Form.Group>
                            <Form.Label>Button URL</Form.Label>
                            <Form.Control
                                value={draft.button_url ?? ''}
                                onChange={e =>
                                    update('button_url', e.target.value)
                                }
                                placeholder="/vehicles"
                            />
                        </Form.Group>
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={() => {
                        onSave(cardIndex, draft);
                        onHide();
                    }}
                >
                    Apply Changes
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

/* Facilities Section Card */

function FacilitiesSectionCard({
    initialData,
}: {
    initialData: ServicesSettingsData;
}) {
    const updateMutation = useUpdateServicesSettings();
    const uploadCardImageMutation = useUploadServicesFacilityCardImage();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<ServicesSettingsData>({ defaultValues: initialData });

    const [cards, setCards] = useState<ServiceFacilityCard[]>(
        initialData.facilities_cards ?? DEFAULT_FACILITIES_CARDS
    );
    const [modalOpen, setModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number>(0);

    useEffect(() => {
        reset(initialData);
        setCards(initialData.facilities_cards ?? DEFAULT_FACILITIES_CARDS);
    }, [initialData, reset]);

    const openModal = (index: number) => {
        setEditingIndex(index);
        setModalOpen(true);
    };

    const saveCardDraft = (index: number, updated: ServiceFacilityCard) => {
        setCards(prev =>
            /* image_url is authoritative from the upload handler - never overwrite it with a stale draft value */
            prev.map((c, i) =>
                i === index ? { ...c, ...updated, image_url: c.image_url } : c
            )
        );
    };

    const handleImageUpload = (file: File, index: number) => {
        uploadCardImageMutation.mutate(
            { file, index },
            {
                onSuccess: data => {
                    setCards(prev =>
                        prev.map((c, i) =>
                            i === index
                                ? { ...c, image_url: data.data.path }
                                : c
                        )
                    );
                },
            }
        );
    };

    const removeCard = (index: number) => {
        setCards(prev => prev.filter((_, i) => i !== index));
    };

    const addCard = () => {
        const newIndex = cards.length;
        setCards(prev => [
            ...prev,
            {
                image_url: '',
                title: '',
                description: '',
                button_text: '',
                button_url: '',
            },
        ]);
        // Open modal immediately for the new card
        setEditingIndex(newIndex);
        setModalOpen(true);
    };

    const onSubmit = (data: ServicesSettingsData) => {
        const filledCards = cards.filter(c => c.title?.trim());
        updateMutation.mutate(
            {
                facilities_title: data.facilities_title,
                facilities_large_title: data.facilities_large_title,
                facilities_cards: filledCards,
            },
            { onError: error => applyServerErrors(error, setError) }
        );
    };

    return (
        <>
            {modalOpen && (
                <CardEditModal
                    show={modalOpen}
                    cardIndex={editingIndex}
                    card={
                        cards[editingIndex] ?? {
                            image_url: '',
                            title: '',
                            description: '',
                            button_text: '',
                            button_url: '',
                        }
                    }
                    onHide={() => setModalOpen(false)}
                    onSave={saveCardDraft}
                    onImageUpload={handleImageUpload}
                    isUploading={uploadCardImageMutation.isPending}
                />
            )}

            <Card className="mb-4">
                <Card.Header>
                    <strong>Services / Facilities Section</strong>
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <Row className="g-3 mb-4">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Section Title</Form.Label>
                                    <Form.Control
                                        {...register('facilities_title')}
                                        placeholder="Our Services"
                                        isInvalid={!!errors.facilities_title}
                                    />
                                    <Form.Text className="text-muted">
                                        Small label above the heading
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.facilities_title?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col md={8}>
                                <Form.Group>
                                    <Form.Label>Large Title</Form.Label>
                                    <Form.Control
                                        {...register('facilities_large_title')}
                                        placeholder="What We Offer"
                                        isInvalid={
                                            !!errors.facilities_large_title
                                        }
                                    />
                                    <Form.Text className="text-muted">
                                        Main heading displayed in the section
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.facilities_large_title?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Card grid */}
                        <Form.Label className="fw-semibold d-block mb-2">
                            Service Cards
                        </Form.Label>
                        <div className="d-flex flex-wrap gap-3 mb-3">
                            {cards.map((card, index) => (
                                <div
                                    key={index}
                                    className="border rounded overflow-hidden position-relative"
                                    style={{
                                        width: 180,
                                        background: '#f8f9fa',
                                        flexShrink: 0,
                                    }}
                                >
                                    {/* Thumbnail */}
                                    <img
                                        src={
                                            card.image_url
                                                ? card.image_url.startsWith(
                                                      'http'
                                                  )
                                                    ? card.image_url
                                                    : `/${card.image_url.replace(/^\//, '')}?v=${Date.now()}`
                                                : CARD_IMAGE_FALLBACK
                                        }
                                        alt={card.title ?? 'card'}
                                        onError={e => {
                                            (
                                                e.currentTarget as HTMLImageElement
                                            ).src = CARD_IMAGE_FALLBACK;
                                        }}
                                        style={{
                                            width: '100%',
                                            height: 110,
                                            objectFit: 'cover',
                                            display: 'block',
                                        }}
                                    />
                                    <div className="p-2">
                                        <div
                                            className="fw-semibold text-truncate small mb-2"
                                            title={card.title}
                                        >
                                            {card.title || (
                                                <span className="text-muted fst-italic">
                                                    Untitled
                                                </span>
                                            )}
                                        </div>
                                        <div className="d-flex gap-1">
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                type="button"
                                                className="flex-grow-1"
                                                onClick={() => openModal(index)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                type="button"
                                                onClick={() =>
                                                    removeCard(index)
                                                }
                                            >
                                                ×
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Add card tile */}
                            <button
                                type="button"
                                onClick={addCard}
                                className="border rounded d-flex flex-column align-items-center justify-content-center text-muted"
                                style={{
                                    width: 180,
                                    height: 176,
                                    background: '#f8f9fa',
                                    border: '2px dashed #dee2e6',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                }}
                            >
                                <span style={{ fontSize: 28, lineHeight: 1 }}>
                                    +
                                </span>
                                <span className="small mt-1">Add Card</span>
                            </button>
                        </div>

                        <div className="d-flex justify-content-end mt-2">
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
        </>
    );
}

/* Why Choose Us Section Card */

const WHY_CHOOSE_US_BG_IMAGE_PATH =
    '/assets/images/services-why-choose-us-bg.jpg';

const DEFAULT_WHY_CHOOSE_US_CARDS: WhyChooseUsCard[] = [
    {
        number: '01',
        title: 'Wide Fleet Selection',
        description:
            'From economy cars to luxury SUVs for every budget and occasion.',
    },
    {
        number: '02',
        title: 'Transparent Pricing',
        description:
            'No hidden fees - what you see is what you pay, every time.',
    },
    {
        number: '03',
        title: '24/7 Support',
        description:
            'Our team is always available whenever you need us, day or night.',
    },
    {
        number: '04',
        title: 'Fast & Easy Booking',
        description:
            'Reserve your vehicle online in under 3 minutes with instant confirmation.',
    },
];

function WhyChooseUsSectionCard({
    initialData,
}: {
    initialData: ServicesSettingsData;
}) {
    const updateMutation = useUpdateServicesSettings();
    const uploadBgMutation = useUploadServicesWhyChooseUsBgImage();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<ServicesSettingsData>({ defaultValues: initialData });

    const [enabled, setEnabled] = useState(
        initialData.why_choose_us_enabled ?? true
    );
    const [bgImageUrl, setBgImageUrl] = useState(
        initialData.why_choose_us_bg_image_url ?? null
    );
    const [cards, setCards] = useState<WhyChooseUsCard[]>(
        initialData.why_choose_us_cards ?? DEFAULT_WHY_CHOOSE_US_CARDS
    );

    const bgFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        reset(initialData);
        setEnabled(initialData.why_choose_us_enabled ?? true);
        setBgImageUrl(initialData.why_choose_us_bg_image_url ?? null);
        setCards(
            initialData.why_choose_us_cards ?? DEFAULT_WHY_CHOOSE_US_CARDS
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
                setBgImageUrl(res.data.why_choose_us_bg_image_url ?? null);
            },
            onError: () => {
                URL.revokeObjectURL(previewUrl);
                setBgImageUrl(initialData.why_choose_us_bg_image_url ?? null);
            },
        });
        e.target.value = '';
    };

    const updateCard = (
        index: number,
        field: keyof WhyChooseUsCard,
        value: string
    ) => {
        setCards(prev =>
            prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
        );
    };

    const addCard = () => {
        setCards(prev => [
            ...prev,
            {
                number: String(prev.length + 1).padStart(2, '0'),
                title: '',
                description: '',
            },
        ]);
    };

    const removeCard = (index: number) => {
        setCards(prev => prev.filter((_, i) => i !== index));
    };

    const onSubmit = (data: ServicesSettingsData) => {
        updateMutation.mutate(
            {
                why_choose_us_enabled: enabled,
                why_choose_us_title: data.why_choose_us_title,
                why_choose_us_large_title: data.why_choose_us_large_title,
                why_choose_us_cards: cards.filter(c => c.title?.trim()),
            },
            { onError: error => applyServerErrors(error, setError) }
        );
    };

    return (
        <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <strong>Why Choose Us Section</strong>
                <Form.Check
                    type="switch"
                    id="why-choose-us-toggle"
                    label={enabled ? 'Visible' : 'Hidden'}
                    checked={enabled}
                    onChange={e => setEnabled(e.target.checked)}
                />
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    {/* Background Image */}
                    <Form.Label className="fw-semibold">
                        Background Image
                    </Form.Label>
                    <div className="d-flex align-items-start gap-3 mb-4">
                        <img
                            src={bgImageUrl ?? WHY_CHOOSE_US_BG_IMAGE_PATH}
                            alt="Why Choose Us background"
                            onError={e => {
                                (e.currentTarget as HTMLImageElement).src =
                                    CARD_IMAGE_FALLBACK;
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

                    {/* Titles */}
                    <Row className="g-3 mb-4">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Section Title</Form.Label>
                                <Form.Control
                                    {...register('why_choose_us_title')}
                                    placeholder="WHY SWIFTFLITZ"
                                    isInvalid={!!errors.why_choose_us_title}
                                />
                                <Form.Text className="text-muted">
                                    Small label above the heading
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    {errors.why_choose_us_title?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={8}>
                            <Form.Group>
                                <Form.Label>Large Title</Form.Label>
                                <Form.Control
                                    {...register('why_choose_us_large_title')}
                                    placeholder="The Swiftflitz Difference"
                                    isInvalid={
                                        !!errors.why_choose_us_large_title
                                    }
                                />
                                <Form.Text className="text-muted">
                                    Main heading displayed in the section
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    {errors.why_choose_us_large_title?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* Cards */}
                    <Form.Label className="fw-semibold d-block mb-2">
                        Cards
                    </Form.Label>
                    <div className="d-flex flex-column gap-3 mb-3">
                        {cards.map((card, index) => (
                            <div
                                key={index}
                                className="border rounded p-3"
                                style={{ background: '#f8f9fa' }}
                            >
                                <Row className="g-2 align-items-start">
                                    <Col md={1}>
                                        <Form.Group>
                                            <Form.Label className="small">
                                                No.
                                            </Form.Label>
                                            <Form.Control
                                                size="sm"
                                                value={card.number ?? ''}
                                                onChange={e =>
                                                    updateCard(
                                                        index,
                                                        'number',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="01"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label className="small">
                                                Title
                                            </Form.Label>
                                            <Form.Control
                                                size="sm"
                                                value={card.title ?? ''}
                                                onChange={e =>
                                                    updateCard(
                                                        index,
                                                        'title',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Card title"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col>
                                        <Form.Group>
                                            <Form.Label className="small">
                                                Description
                                            </Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                size="sm"
                                                rows={2}
                                                value={card.description ?? ''}
                                                onChange={e =>
                                                    updateCard(
                                                        index,
                                                        'description',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Short description…"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col
                                        xs="auto"
                                        className="d-flex align-items-end pb-1"
                                    >
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            type="button"
                                            onClick={() => removeCard(index)}
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
                        onClick={addCard}
                    >
                        + Add Card
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

/* Listings Banner Image Card */

function ListingsBannerCard({
    initialData,
}: {
    initialData: ServicesSettingsData;
}) {
    const uploadMutation = useUploadListingsBannerImage();
    const [localUrl, setLocalUrl] = useState<string | null>(null);
    const displayUrl =
        localUrl ?? initialData.listings_banner_image_url ?? null;
    const fileRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        setLocalUrl(previewUrl);
        uploadMutation.mutate(file, {
            onSuccess: res => {
                URL.revokeObjectURL(previewUrl);
                setLocalUrl(res.data.listings_banner_image_url ?? null);
            },
            onError: () => {
                URL.revokeObjectURL(previewUrl);
                setLocalUrl(null);
            },
        });
        e.target.value = '';
    };

    return (
        <Card className="mb-4">
            <Card.Header>
                <strong>Listings Banner Image</strong>
            </Card.Header>
            <Card.Body>
                <Row className="g-3">
                    <Col md={12}>
                        <Form.Label className="fw-semibold">
                            Banner Background Image
                        </Form.Label>
                        <div className="d-flex align-items-start gap-3">
                            <img
                                src={displayUrl ?? BANNER_IMAGE_FALLBACK}
                                alt="Listings Banner"
                                onError={e => {
                                    (e.currentTarget as HTMLImageElement).src =
                                        CARD_IMAGE_FALLBACK;
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
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    className="d-none"
                                    onChange={handleChange}
                                />
                                <PermisssionGuard
                                    permission={
                                        PERMISSIONS.WEBSITE.EDIT_HOMEPAGE
                                    }
                                >
                                    <Button
                                        variant="outline-primary"
                                        type="button"
                                        disabled={uploadMutation.isPending}
                                        onClick={() => fileRef.current?.click()}
                                    >
                                        {uploadMutation.isPending ? (
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
                                </PermisssionGuard>
                                <Form.Text className="d-block text-muted mt-1">
                                    JPG, PNG or WebP · max 4 MB
                                </Form.Text>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
}

/* Airport Transfer Banner Image Card */

function AirportTransferBannerCard({
    initialData,
}: {
    initialData: ServicesSettingsData;
}) {
    const uploadMutation = useUploadAirportTransferBannerImage();
    const [localUrl, setLocalUrl] = useState<string | null>(null);
    const displayUrl =
        localUrl ?? initialData.airport_transfer_banner_image_url ?? null;
    const fileRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        setLocalUrl(previewUrl);
        uploadMutation.mutate(file, {
            onSuccess: res => {
                URL.revokeObjectURL(previewUrl);
                setLocalUrl(res.data.airport_transfer_banner_image_url ?? null);
            },
            onError: () => {
                URL.revokeObjectURL(previewUrl);
                setLocalUrl(null);
            },
        });
        e.target.value = '';
    };

    return (
        <Card className="mb-4">
            <Card.Header>
                <strong>Airport Transfer Banner Image</strong>
            </Card.Header>
            <Card.Body>
                <Row className="g-3">
                    <Col md={12}>
                        <Form.Label className="fw-semibold">
                            Banner Background Image
                        </Form.Label>
                        <div className="d-flex align-items-start gap-3">
                            <img
                                src={displayUrl ?? BANNER_IMAGE_FALLBACK}
                                alt="Airport Transfer Banner"
                                onError={e => {
                                    (e.currentTarget as HTMLImageElement).src =
                                        CARD_IMAGE_FALLBACK;
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
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    className="d-none"
                                    onChange={handleChange}
                                />
                                <PermisssionGuard
                                    permission={
                                        PERMISSIONS.WEBSITE.EDIT_HOMEPAGE
                                    }
                                >
                                    <Button
                                        variant="outline-primary"
                                        type="button"
                                        disabled={uploadMutation.isPending}
                                        onClick={() => fileRef.current?.click()}
                                    >
                                        {uploadMutation.isPending ? (
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
                                </PermisssionGuard>
                                <Form.Text className="d-block text-muted mt-1">
                                    JPG, PNG or WebP · max 4 MB
                                </Form.Text>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
}

/* Chauffeur Banner Image Card */

function ChauffeurBannerCard({
    initialData,
}: {
    initialData: ServicesSettingsData;
}) {
    const uploadMutation = useUploadChauffeurBannerImage();
    const [localUrl, setLocalUrl] = useState<string | null>(null);
    const displayUrl =
        localUrl ?? initialData.chauffeur_banner_image_url ?? null;
    const fileRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        setLocalUrl(previewUrl);
        uploadMutation.mutate(file, {
            onSuccess: res => {
                URL.revokeObjectURL(previewUrl);
                setLocalUrl(res.data.chauffeur_banner_image_url ?? null);
            },
            onError: () => {
                URL.revokeObjectURL(previewUrl);
                setLocalUrl(null);
            },
        });
        e.target.value = '';
    };

    return (
        <Card className="mb-4">
            <Card.Header>
                <strong>Chauffeur Services Banner Image</strong>
            </Card.Header>
            <Card.Body>
                <Row className="g-3">
                    <Col md={12}>
                        <Form.Label className="fw-semibold">
                            Banner Background Image
                        </Form.Label>
                        <div className="d-flex align-items-start gap-3">
                            <img
                                src={displayUrl ?? BANNER_IMAGE_FALLBACK}
                                alt="Chauffeur Banner"
                                onError={e => {
                                    (e.currentTarget as HTMLImageElement).src =
                                        CARD_IMAGE_FALLBACK;
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
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    className="d-none"
                                    onChange={handleChange}
                                />
                                <PermisssionGuard
                                    permission={
                                        PERMISSIONS.WEBSITE.EDIT_HOMEPAGE
                                    }
                                >
                                    <Button
                                        variant="outline-primary"
                                        type="button"
                                        disabled={uploadMutation.isPending}
                                        onClick={() => fileRef.current?.click()}
                                    >
                                        {uploadMutation.isPending ? (
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
                                </PermisssionGuard>
                                <Form.Text className="d-block text-muted mt-1">
                                    JPG, PNG or WebP · max 4 MB
                                </Form.Text>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
}

/* Page */

export default function ServicesContent() {
    const title = useTitle('Services Page');
    const { data: res, isLoading } = useServicesSettings();

    if (isLoading) {
        return <SettingsFormSkeleton cards={2} />;
    }

    const data = res?.data ?? {};

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>Services Page Content</h4>
                <p className="text-muted mb-0">
                    Manage each section of the services page independently.
                </p>
            </div>

            <BannerSectionCard initialData={data} />
            <FacilitiesSectionCard initialData={data} />
            <WhyChooseUsSectionCard initialData={data} />
            <ListingsBannerCard initialData={data} />
            <AirportTransferBannerCard initialData={data} />
            <ChauffeurBannerCard initialData={data} />
        </div>
    );
}
