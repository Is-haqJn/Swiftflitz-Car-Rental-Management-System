import { useEffect, useRef, useState } from 'react';
import {
    Card,
    Form,
    Row,
    Col,
    Button,
    Spinner,
    Badge,
    Modal,
    InputGroup,
} from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useForm } from 'react-hook-form';
import { applyServerErrors } from '@/shared/libs/utils';
import type { AboutSettingsData } from '@/shared/types';
import {
    useAboutSettings,
    useUpdateAboutSettings,
    useUploadAboutBannerImage,
    useUploadAboutBgImage,
    useUploadAboutOverlayImage,
    useUploadAboutValuesBgImage,
    useUploadTeamPhoto,
} from '@/shared/hooks/queries/useSettings';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';
import { useTitle } from '@/shared/hooks';
import {
    AssetIconPickerModal,
    toAbsoluteAssetPath,
} from '@/admin/components/ui/AssetIconPickerModal';

const BANNER_IMAGE_FALLBACK = '/assets/images/main-slider/slide2/bg-pic1.jpg';
const BG_IMAGE_FALLBACK = '/assets/images/abus-pic.jpg';
const OVERLAY_IMAGE_FALLBACK = '/assets/images/car-pic1.png';
const VALUES_BG_IMAGE_FALLBACK = '/assets/images/ab-us.jpg';

type ValueCard = { icon_url: string; title: string; description: string };

type TeamSocial = { icon: string; url: string };
type TeamMember = {
    name: string;
    position: string;
    image_url: string;
    socials: TeamSocial[];
};

const SOCIAL_PLATFORMS: { label: string; icon: string }[] = [
    { label: 'LinkedIn', icon: 'fa-brands fa-linkedin-in' },
    { label: 'Instagram', icon: 'fa-brands fa-instagram' },
    { label: 'Facebook', icon: 'fa-brands fa-facebook-f' },
    { label: 'Twitter / X', icon: 'fa-brands fa-x-twitter' },
    { label: 'WhatsApp', icon: 'fa-brands fa-whatsapp' },
    { label: 'YouTube', icon: 'fa-brands fa-youtube' },
    { label: 'TikTok', icon: 'fa-brands fa-tiktok' },
    { label: 'Pinterest', icon: 'fa-brands fa-pinterest-p' },
];

const EMPTY_MEMBER: TeamMember = {
    name: '',
    position: '',
    image_url: '',
    socials: [],
};

/* Banner Section Card */

function BannerSectionCard({
    initialData,
}: {
    initialData: AboutSettingsData;
}) {
    const updateMutation = useUpdateAboutSettings();
    const uploadBannerMutation = useUploadAboutBannerImage();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<AboutSettingsData>({ defaultValues: initialData });

    const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(
        initialData.banner_image_url ?? null
    );

    const bannerFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        reset(initialData);
    }, [initialData, reset]);

    const onSubmit = (data: AboutSettingsData) => {
        updateMutation.mutate(
            { hero_title: data.hero_title },
            { onError: error => applyServerErrors(error, setError) }
        );
    };

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        uploadBannerMutation.mutate(file, {
            onSuccess: res => {
                const url = res.data.banner_image_url;
                setBannerImageUrl(url ? `${url}?t=${Date.now()}` : null);
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
                        {/* Page title */}
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Page Title</Form.Label>
                                <Form.Control
                                    {...register('hero_title')}
                                    placeholder="ABOUT US"
                                    isInvalid={!!errors.hero_title}
                                />
                                <Form.Text className="text-muted">
                                    Heading displayed on the about page banner
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    {errors.hero_title?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        {/* Banner image */}
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
                                        ).src = BANNER_IMAGE_FALLBACK;
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
                            permission={PERMISSIONS.WEBSITE.EDIT_ABOUT}
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

/* General About Us Card */

function GeneralAboutUsCard({
    initialData,
}: {
    initialData: AboutSettingsData;
}) {
    const updateMutation = useUpdateAboutSettings();
    const uploadBgMutation = useUploadAboutBgImage();
    const uploadOverlayMutation = useUploadAboutOverlayImage();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<AboutSettingsData>({ defaultValues: initialData });

    const [listItems, setListItems] = useState<string[]>(
        initialData.general_list_items ?? []
    );
    const [itemInput, setItemInput] = useState('');
    const [bgImageUrl, setBgImageUrl] = useState<string | null>(
        initialData.general_bg_image_url ?? null
    );
    const [overlayImageUrl, setOverlayImageUrl] = useState<string | null>(
        initialData.general_overlay_image_url ?? null
    );

    const bgFileRef = useRef<HTMLInputElement>(null);
    const overlayFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        reset(initialData);
        setListItems(initialData.general_list_items ?? []);
    }, [initialData, reset]);

    const onSubmit = (data: AboutSettingsData) => {
        updateMutation.mutate(
            {
                general_title: data.general_title,
                general_large_title: data.general_large_title,
                general_description: data.general_description,
                general_list_items: listItems,
            },
            { onError: error => applyServerErrors(error, setError) }
        );
    };

    const addItem = () => {
        const trimmed = itemInput.trim();
        if (!trimmed) return;
        setListItems(prev => [...prev, trimmed]);
        setItemInput('');
    };

    const removeItem = (index: number) => {
        setListItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        uploadBgMutation.mutate(file, {
            onSuccess: res => {
                const url = res.data.general_bg_image_url;
                setBgImageUrl(url ? `${url}?t=${Date.now()}` : null);
            },
        });
        e.target.value = '';
    };

    const handleOverlayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        uploadOverlayMutation.mutate(file, {
            onSuccess: res => {
                const url = res.data.general_overlay_image_url;
                setOverlayImageUrl(url ? `${url}?t=${Date.now()}` : null);
            },
        });
        e.target.value = '';
    };

    return (
        <Card className="mb-4">
            <Card.Header>
                <strong>General About Us Section</strong>
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row className="g-3">
                        {/* Section title */}
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Section Title</Form.Label>
                                <Form.Control
                                    {...register('general_title')}
                                    placeholder="About Us"
                                    isInvalid={!!errors.general_title}
                                />
                                <Form.Text className="text-muted">
                                    Small label above the heading
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    {errors.general_title?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        {/* Large title */}
                        <Col md={8}>
                            <Form.Group>
                                <Form.Label>Large Title</Form.Label>
                                <Form.Control
                                    {...register('general_large_title')}
                                    placeholder="We Have Many Provided Assistance…"
                                    isInvalid={!!errors.general_large_title}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.general_large_title?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        {/* Description */}
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    {...register('general_description')}
                                    isInvalid={!!errors.general_description}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.general_description?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        {/* List items */}
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Bullet List Items</Form.Label>
                                <div className="d-flex gap-2">
                                    <Form.Control
                                        value={itemInput}
                                        onChange={e =>
                                            setItemInput(e.target.value)
                                        }
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addItem();
                                            }
                                        }}
                                        placeholder="Add list item…"
                                    />
                                    <Button
                                        variant="outline-secondary"
                                        type="button"
                                        onClick={addItem}
                                    >
                                        +
                                    </Button>
                                </div>
                                <div className="d-flex flex-wrap gap-1 mt-2">
                                    {listItems.map((item, index) => (
                                        <Badge
                                            key={index}
                                            bg="secondary"
                                            className="d-flex align-items-center gap-1"
                                            style={{ cursor: 'default' }}
                                        >
                                            {item}
                                            <span
                                                role="button"
                                                aria-label="Remove"
                                                onClick={() =>
                                                    removeItem(index)
                                                }
                                                style={{ cursor: 'pointer' }}
                                            >
                                                ×
                                            </span>
                                        </Badge>
                                    ))}
                                </div>
                                <Form.Text className="text-muted">
                                    Short bullet points shown below the
                                    description
                                </Form.Text>
                            </Form.Group>
                        </Col>

                        {/* Background image */}
                        <Col md={6}>
                            <Form.Label className="fw-semibold">
                                Background Image
                            </Form.Label>
                            <div className="d-flex align-items-start gap-3">
                                <img
                                    src={bgImageUrl ?? BG_IMAGE_FALLBACK}
                                    alt="Background"
                                    onError={e => {
                                        (
                                            e.currentTarget as HTMLImageElement
                                        ).src = BG_IMAGE_FALLBACK;
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
                                        onClick={() =>
                                            bgFileRef.current?.click()
                                        }
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
                        </Col>

                        {/* Overlay image */}
                        <Col md={6}>
                            <Form.Label className="fw-semibold">
                                Overlay Image
                            </Form.Label>
                            <div className="d-flex align-items-start gap-3">
                                <img
                                    src={
                                        overlayImageUrl ??
                                        OVERLAY_IMAGE_FALLBACK
                                    }
                                    alt="Overlay"
                                    onError={e => {
                                        (
                                            e.currentTarget as HTMLImageElement
                                        ).src = OVERLAY_IMAGE_FALLBACK;
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
                                        ref={overlayFileRef}
                                        type="file"
                                        accept="image/*"
                                        className="d-none"
                                        onChange={handleOverlayChange}
                                    />
                                    <Button
                                        variant="outline-primary"
                                        type="button"
                                        disabled={
                                            uploadOverlayMutation.isPending
                                        }
                                        onClick={() =>
                                            overlayFileRef.current?.click()
                                        }
                                    >
                                        {uploadOverlayMutation.isPending ? (
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
                            permission={PERMISSIONS.WEBSITE.EDIT_ABOUT}
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

/* Story & Mission Card */

function StoryMissionCard({ initialData }: { initialData: AboutSettingsData }) {
    const updateMutation = useUpdateAboutSettings();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<AboutSettingsData>({ defaultValues: initialData });

    useEffect(() => {
        reset(initialData);
    }, [initialData, reset]);

    const onSubmit = (data: AboutSettingsData) => {
        updateMutation.mutate(
            {
                story_title: data.story_title,
                story_content: data.story_content,
                mission: data.mission,
                vision: data.vision,
                values: data.values,
            },
            { onError: error => applyServerErrors(error, setError) }
        );
    };

    return (
        <Card className="mb-4">
            <Card.Header>
                <strong>Story & Mission</strong>
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Story Title</Form.Label>
                                <Form.Control
                                    {...register('story_title')}
                                    placeholder="Our Story"
                                    isInvalid={!!errors.story_title}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.story_title?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Story Content</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    {...register('story_content')}
                                    isInvalid={!!errors.story_content}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.story_content?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Mission</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    {...register('mission')}
                                    isInvalid={!!errors.mission}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.mission?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Vision</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    {...register('vision')}
                                    isInvalid={!!errors.vision}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.vision?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Values</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    {...register('values')}
                                    placeholder="Integrity, Excellence, Customer First…"
                                    isInvalid={!!errors.values}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.values?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end mt-4">
                        <PermisssionGuard
                            permission={PERMISSIONS.WEBSITE.EDIT_ABOUT}
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

/* Our Values Section Card */

function OurValuesSectionCard({
    initialData,
}: {
    initialData: AboutSettingsData;
}) {
    const updateMutation = useUpdateAboutSettings();
    const uploadValuesBgMutation = useUploadAboutValuesBgImage();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<AboutSettingsData>({ defaultValues: initialData });

    const [enabled, setEnabled] = useState(initialData.values_enabled ?? true);
    const [cards, setCards] = useState<ValueCard[]>(
        (initialData.values_cards ?? []) as ValueCard[]
    );
    const [valuesBgImageUrl, setValuesBgImageUrl] = useState<string | null>(
        initialData.values_bg_image_url ?? null
    );
    const [showModal, setShowModal] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [modalCard, setModalCard] = useState<ValueCard>({
        icon_url: '',
        title: '',
        description: '',
    });
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const bgFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        reset(initialData);
        setEnabled(initialData.values_enabled ?? true);
        setCards((initialData.values_cards ?? []) as ValueCard[]);
    }, [initialData, reset]);

    const onSubmit = (data: AboutSettingsData) => {
        updateMutation.mutate(
            {
                values_enabled: enabled,
                values_title: data.values_title,
                values_large_title: data.values_large_title,
                values_cards: cards,
            },
            { onError: error => applyServerErrors(error, setError) }
        );
    };

    const handleBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        uploadValuesBgMutation.mutate(file, {
            onSuccess: res => {
                const url = res.data.values_bg_image_url;
                setValuesBgImageUrl(url ? `${url}?t=${Date.now()}` : null);
            },
        });
        e.target.value = '';
    };

    const openAddModal = () => {
        setEditingIndex(null);
        setModalCard({ icon_url: '', title: '', description: '' });
        setShowModal(true);
    };

    const openEditModal = (index: number) => {
        setEditingIndex(index);
        setModalCard({ ...cards[index] });
        setShowModal(true);
    };

    const saveModalCard = () => {
        if (!modalCard.title.trim()) return;
        if (editingIndex !== null) {
            setCards(prev =>
                prev.map((c, i) => (i === editingIndex ? { ...modalCard } : c))
            );
        } else {
            setCards(prev => [...prev, { ...modalCard }]);
        }
        setShowModal(false);
    };

    const removeCard = (index: number) => {
        setCards(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <>
            <Card className="mb-4">
                <Card.Header>
                    <strong>Our Values Section</strong>
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <Row className="g-3">
                            {/* Toggle */}
                            <Col md={12}>
                                <Form.Check
                                    type="switch"
                                    id="values-enabled-switch"
                                    label="Show Our Values section"
                                    checked={enabled}
                                    onChange={e => setEnabled(e.target.checked)}
                                />
                            </Col>

                            {/* Title */}
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Section Title</Form.Label>
                                    <Form.Control
                                        {...register('values_title')}
                                        placeholder="Our Values"
                                        isInvalid={!!errors.values_title}
                                    />
                                    <Form.Text className="text-muted">
                                        Small label above the heading
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.values_title?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            {/* Large title */}
                            <Col md={8}>
                                <Form.Group>
                                    <Form.Label>Large Title</Form.Label>
                                    <Form.Control
                                        {...register('values_large_title')}
                                        placeholder="What we stand for"
                                        isInvalid={!!errors.values_large_title}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.values_large_title?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            {/* Background image */}
                            <Col md={12}>
                                <Form.Label className="fw-semibold">
                                    Background Image
                                </Form.Label>
                                <div className="d-flex align-items-start gap-3">
                                    <img
                                        src={
                                            valuesBgImageUrl ??
                                            VALUES_BG_IMAGE_FALLBACK
                                        }
                                        alt="Values background"
                                        onError={e => {
                                            (
                                                e.currentTarget as HTMLImageElement
                                            ).src = VALUES_BG_IMAGE_FALLBACK;
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
                                            disabled={
                                                uploadValuesBgMutation.isPending
                                            }
                                            onClick={() =>
                                                bgFileRef.current?.click()
                                            }
                                        >
                                            {uploadValuesBgMutation.isPending ? (
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

                            {/* Value cards list */}
                            <Col md={12}>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <Form.Label className="fw-semibold mb-0">
                                        Value Cards
                                    </Form.Label>
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        type="button"
                                        onClick={openAddModal}
                                    >
                                        + Add Card
                                    </Button>
                                </div>
                                {cards.length === 0 ? (
                                    <p className="text-muted small">
                                        No value cards yet. Add one above.
                                    </p>
                                ) : (
                                    <div className="d-flex flex-column gap-2">
                                        {cards.map((card, index) => (
                                            <div
                                                key={index}
                                                className="d-flex flex-column flex-sm-row align-items-start gap-2 p-2 border rounded"
                                                style={{
                                                    background: '#f8f9fa',
                                                }}
                                            >
                                                {card.icon_url && (
                                                    <img
                                                        src={card.icon_url}
                                                        alt=""
                                                        style={{
                                                            width: 32,
                                                            height: 32,
                                                            objectFit:
                                                                'contain',
                                                            flexShrink: 0,
                                                            marginTop: 2,
                                                        }}
                                                    />
                                                )}
                                                <div className="flex-grow-1 min-w-0">
                                                    <div className="fw-semibold small text-break">
                                                        {card.title}
                                                    </div>
                                                    <div
                                                        className="text-muted small text-break"
                                                        title={card.description}
                                                        style={{
                                                            whiteSpace:
                                                                'normal',
                                                            overflowWrap:
                                                                'anywhere',
                                                        }}
                                                    >
                                                        {card.description}
                                                    </div>
                                                </div>
                                                <div className="d-flex gap-1 flex-shrink-0 align-self-end align-self-sm-start mt-2 mt-sm-0">
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        type="button"
                                                        onClick={() =>
                                                            openEditModal(index)
                                                        }
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
                                        ))}
                                    </div>
                                )}
                                <Form.Text className="text-muted">
                                    Changes to cards are saved with the Save
                                    Settings button below.
                                </Form.Text>
                            </Col>
                        </Row>

                        <div className="d-flex justify-content-end mt-4">
                            <PermisssionGuard
                                permission={PERMISSIONS.WEBSITE.EDIT_ABOUT}
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

            {/* Add Value Card Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingIndex !== null
                            ? 'Edit Value Card'
                            : 'Add Value Card'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Icon</Form.Label>
                        <div className="d-flex align-items-center gap-3">
                            {modalCard.icon_url ? (
                                <img
                                    src={toAbsoluteAssetPath(
                                        modalCard.icon_url
                                    )}
                                    alt="Selected icon"
                                    style={{
                                        width: 48,
                                        height: 48,
                                        objectFit: 'contain',
                                        border: '1px solid #dee2e6',
                                        borderRadius: 6,
                                        padding: 4,
                                        flexShrink: 0,
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: 48,
                                        height: 48,
                                        border: '1px dashed #dee2e6',
                                        borderRadius: 6,
                                        flexShrink: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#adb5bd',
                                        fontSize: '0.7rem',
                                    }}
                                >
                                    None
                                </div>
                            )}
                            <div>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    type="button"
                                    onClick={() => setShowIconPicker(true)}
                                >
                                    {modalCard.icon_url
                                        ? 'Change Icon'
                                        : 'Select Icon'}
                                </Button>
                                {modalCard.icon_url && (
                                    <Button
                                        variant="link"
                                        size="sm"
                                        type="button"
                                        className="text-danger ms-2"
                                        onClick={() =>
                                            setModalCard(prev => ({
                                                ...prev,
                                                icon_url: '',
                                            }))
                                        }
                                    >
                                        Remove
                                    </Button>
                                )}
                            </div>
                        </div>
                        <Form.Text className="text-muted">
                            Optional - pick from uploaded icons or upload a new
                            one
                        </Form.Text>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>
                            Title <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Safety first"
                            value={modalCard.title}
                            onChange={e =>
                                setModalCard(prev => ({
                                    ...prev,
                                    title: e.target.value,
                                }))
                            }
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>
                            Description <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Describe this value…"
                            value={modalCard.description}
                            onChange={e =>
                                setModalCard(prev => ({
                                    ...prev,
                                    description: e.target.value,
                                }))
                            }
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowModal(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={saveModalCard}
                        disabled={!modalCard.title.trim()}
                    >
                        {editingIndex !== null ? 'Update Card' : 'Add Card'}
                    </Button>
                </Modal.Footer>
            </Modal>

            <AssetIconPickerModal
                show={showIconPicker}
                onHide={() => setShowIconPicker(false)}
                currentValue={modalCard.icon_url}
                onSelect={path =>
                    setModalCard(prev => ({ ...prev, icon_url: path }))
                }
            />
        </>
    );
}

/* Team Section Card */

function TeamSectionCard({ initialData }: { initialData: AboutSettingsData }) {
    const updateMutation = useUpdateAboutSettings();
    const uploadPhotoMutation = useUploadTeamPhoto();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<AboutSettingsData>({ defaultValues: initialData });

    const [enabled, setEnabled] = useState(initialData.team_enabled ?? true);
    const [members, setMembers] = useState<TeamMember[]>(
        (initialData.team_members ?? []) as TeamMember[]
    );
    const [showModal, setShowModal] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [modalMember, setModalMember] = useState<TeamMember>({
        ...EMPTY_MEMBER,
    });
    const photoFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        reset(initialData);
        setEnabled(initialData.team_enabled ?? true);
        setMembers((initialData.team_members ?? []) as TeamMember[]);
    }, [initialData, reset]);

    const onSubmit = (data: AboutSettingsData) => {
        updateMutation.mutate(
            {
                team_enabled: enabled,
                team_title: data.team_title,
                team_large_title: data.team_large_title,
                team_members: members,
            },
            { onError: error => applyServerErrors(error, setError) }
        );
    };

    const openAddModal = () => {
        setEditingIndex(null);
        setModalMember({ ...EMPTY_MEMBER, socials: [] });
        setShowModal(true);
    };

    const openEditModal = (index: number) => {
        setEditingIndex(index);
        setModalMember({
            ...members[index],
            socials: members[index].socials.map(s => ({ ...s })),
        });
        setShowModal(true);
    };

    const saveModalMember = () => {
        if (!modalMember.name.trim()) return;
        if (editingIndex !== null) {
            setMembers(prev =>
                prev.map((m, i) =>
                    i === editingIndex ? { ...modalMember } : m
                )
            );
        } else {
            setMembers(prev => [...prev, { ...modalMember }]);
        }
        setShowModal(false);
    };

    const removeMember = (index: number) => {
        setMembers(prev => prev.filter((_, i) => i !== index));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        uploadPhotoMutation.mutate(file, {
            onSuccess: res => {
                setModalMember(prev => ({
                    ...prev,
                    image_url: res.data.url,
                }));
            },
        });
        e.target.value = '';
    };

    const addSocial = () => {
        setModalMember(prev => ({
            ...prev,
            socials: [
                ...prev.socials,
                { icon: SOCIAL_PLATFORMS[0].icon, url: '' },
            ],
        }));
    };

    const updateSocial = (
        index: number,
        field: keyof TeamSocial,
        value: string
    ) => {
        setModalMember(prev => ({
            ...prev,
            socials: prev.socials.map((s, i) =>
                i === index ? { ...s, [field]: value } : s
            ),
        }));
    };

    const removeSocial = (index: number) => {
        setModalMember(prev => ({
            ...prev,
            socials: prev.socials.filter((_, i) => i !== index),
        }));
    };

    return (
        <>
            <Card className="mb-4">
                <Card.Header>
                    <strong>Team Section</strong>
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <Row className="g-3">
                            {/* Toggle */}
                            <Col md={12}>
                                <Form.Check
                                    type="switch"
                                    id="team-enabled-switch"
                                    label="Show Team section"
                                    checked={enabled}
                                    onChange={e => setEnabled(e.target.checked)}
                                />
                            </Col>

                            {/* Title */}
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Section Title</Form.Label>
                                    <Form.Control
                                        {...register('team_title')}
                                        placeholder="Swiftflitz Team"
                                        isInvalid={!!errors.team_title}
                                    />
                                    <Form.Text className="text-muted">
                                        Small label above the heading
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.team_title?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            {/* Large title */}
                            <Col md={8}>
                                <Form.Group>
                                    <Form.Label>Large Title</Form.Label>
                                    <Form.Control
                                        {...register('team_large_title')}
                                        placeholder="The Swiftflitz Team"
                                        isInvalid={!!errors.team_large_title}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.team_large_title?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            {/* Members list */}
                            <Col md={12}>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <Form.Label className="fw-semibold mb-0">
                                        Team Members
                                    </Form.Label>
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        type="button"
                                        onClick={openAddModal}
                                    >
                                        + Add Member
                                    </Button>
                                </div>
                                {members.length === 0 ? (
                                    <p className="text-muted small">
                                        No team members yet. Add one above.
                                    </p>
                                ) : (
                                    <div className="d-flex flex-column gap-2">
                                        {members.map((member, index) => (
                                            <div
                                                key={index}
                                                className="d-flex align-items-center gap-2 p-2 border rounded"
                                                style={{
                                                    background: '#f8f9fa',
                                                }}
                                            >
                                                <img
                                                    src={
                                                        member.image_url ||
                                                        '/assets/images/team/1.jpg'
                                                    }
                                                    alt=""
                                                    style={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: '50%',
                                                        objectFit: 'cover',
                                                        flexShrink: 0,
                                                        border: '1px solid #dee2e6',
                                                    }}
                                                />
                                                <div className="flex-grow-1 min-w-0">
                                                    <div className="fw-semibold small">
                                                        {member.name}
                                                    </div>
                                                    <div className="text-muted small">
                                                        {member.position}
                                                    </div>
                                                    {member.socials.length >
                                                        0 && (
                                                        <div className="d-flex gap-2 mt-1">
                                                            {member.socials.map(
                                                                (s, si) => (
                                                                    <i
                                                                        key={si}
                                                                        className={
                                                                            s.icon
                                                                        }
                                                                        style={{
                                                                            fontSize: 12,
                                                                            color: '#6c757d',
                                                                        }}
                                                                    />
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="d-flex gap-1 flex-shrink-0">
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        type="button"
                                                        onClick={() =>
                                                            openEditModal(index)
                                                        }
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        type="button"
                                                        onClick={() =>
                                                            removeMember(index)
                                                        }
                                                    >
                                                        ×
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <Form.Text className="text-muted">
                                    Changes are saved with the Save Settings
                                    button below.
                                </Form.Text>
                            </Col>
                        </Row>

                        <div className="d-flex justify-content-end mt-4">
                            <PermisssionGuard
                                permission={PERMISSIONS.WEBSITE.EDIT_ABOUT}
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

            {/* Add / Edit Team Member Modal */}
            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                centered
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingIndex !== null
                            ? 'Edit Team Member'
                            : 'Add Team Member'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="g-3">
                        {/* Photo */}
                        <Col md={12}>
                            <Form.Label>Profile Photo</Form.Label>
                            <div className="d-flex align-items-center gap-3">
                                <div
                                    style={{
                                        width: 72,
                                        height: 72,
                                        borderRadius: '50%',
                                        overflow: 'hidden',
                                        border: '2px solid #dee2e6',
                                        flexShrink: 0,
                                        background: '#f8f9fa',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {uploadPhotoMutation.isPending ? (
                                        <Spinner
                                            animation="border"
                                            size="sm"
                                            variant="secondary"
                                        />
                                    ) : modalMember.image_url ? (
                                        <img
                                            src={modalMember.image_url}
                                            alt="Preview"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    ) : (
                                        <span
                                            style={{
                                                fontSize: '0.65rem',
                                                color: '#adb5bd',
                                            }}
                                        >
                                            No photo
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <input
                                        ref={photoFileRef}
                                        type="file"
                                        accept="image/*"
                                        className="d-none"
                                        onChange={handlePhotoChange}
                                    />
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        type="button"
                                        disabled={uploadPhotoMutation.isPending}
                                        onClick={() =>
                                            photoFileRef.current?.click()
                                        }
                                    >
                                        {uploadPhotoMutation.isPending
                                            ? 'Uploading…'
                                            : modalMember.image_url
                                              ? 'Replace Photo'
                                              : 'Upload Photo'}
                                    </Button>
                                    {modalMember.image_url && (
                                        <Button
                                            variant="link"
                                            size="sm"
                                            type="button"
                                            className="text-danger ms-2"
                                            onClick={() =>
                                                setModalMember(prev => ({
                                                    ...prev,
                                                    image_url: '',
                                                }))
                                            }
                                        >
                                            Remove
                                        </Button>
                                    )}
                                    <Form.Text className="d-block text-muted mt-1">
                                        JPG, PNG or WebP · max 4 MB
                                    </Form.Text>
                                </div>
                            </div>
                        </Col>

                        {/* Name */}
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    Name <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Kevin Martin"
                                    value={modalMember.name}
                                    onChange={e =>
                                        setModalMember(prev => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                />
                            </Form.Group>
                        </Col>

                        {/* Position */}
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    Position{' '}
                                    <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Sales Consultant"
                                    value={modalMember.position}
                                    onChange={e =>
                                        setModalMember(prev => ({
                                            ...prev,
                                            position: e.target.value,
                                        }))
                                    }
                                />
                            </Form.Group>
                        </Col>

                        {/* Socials */}
                        <Col md={12}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <Form.Label className="mb-0">
                                    Social Links
                                </Form.Label>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    type="button"
                                    onClick={addSocial}
                                >
                                    + Add Social
                                </Button>
                            </div>
                            {modalMember.socials.length === 0 ? (
                                <p className="text-muted small mb-0">
                                    No socials added yet.
                                </p>
                            ) : (
                                <div className="d-flex flex-column gap-2">
                                    {modalMember.socials.map((social, si) => (
                                        <InputGroup key={si} size="sm">
                                            <InputGroup.Text
                                                style={{ minWidth: 38 }}
                                            >
                                                <i
                                                    className={social.icon}
                                                    style={{ fontSize: 14 }}
                                                />
                                            </InputGroup.Text>
                                            <Form.Select
                                                value={social.icon}
                                                onChange={e =>
                                                    updateSocial(
                                                        si,
                                                        'icon',
                                                        e.target.value
                                                    )
                                                }
                                                style={{ maxWidth: 160 }}
                                            >
                                                {SOCIAL_PLATFORMS.map(p => (
                                                    <option
                                                        key={p.icon}
                                                        value={p.icon}
                                                    >
                                                        {p.label}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                            <Form.Control
                                                type="url"
                                                placeholder="https://..."
                                                value={social.url}
                                                onChange={e =>
                                                    updateSocial(
                                                        si,
                                                        'url',
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            <Button
                                                variant="outline-danger"
                                                onClick={() => removeSocial(si)}
                                            >
                                                ×
                                            </Button>
                                        </InputGroup>
                                    ))}
                                </div>
                            )}
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowModal(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={saveModalMember}
                        disabled={
                            !modalMember.name.trim() ||
                            uploadPhotoMutation.isPending
                        }
                    >
                        {editingIndex !== null ? 'Update Member' : 'Add Member'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

/* Page */

export default function AboutContent() {
    const title = useTitle('About Page');
    const { data: res, isLoading } = useAboutSettings();

    if (isLoading) {
        return <SettingsFormSkeleton cards={2} />;
    }

    const data = res?.data ?? {};

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>About Page Content</h4>
                <p className="text-muted mb-0">
                    Manage each section of the about page independently.
                </p>
            </div>

            <BannerSectionCard initialData={data} />
            <GeneralAboutUsCard initialData={data} />
            <StoryMissionCard initialData={data} />
            <OurValuesSectionCard initialData={data} />
            <TeamSectionCard initialData={data} />
        </div>
    );
}
