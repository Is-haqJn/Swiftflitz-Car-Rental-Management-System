import { useEffect, useRef, useState } from 'react';
import { Card, Form, Row, Col, Button, Spinner } from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useForm } from 'react-hook-form';
import { applyServerErrors } from '@/shared/libs/utils';
import type { ContactSettingsData, ContactSocialItem } from '@/shared/types';
import { useActiveBranches } from '@/shared/hooks/queries/useBranches';
import {
    useContactSettings,
    useUpdateContactSettings,
    useUploadContactBannerImage,
    useUploadContactSectionBgImage,
} from '@/shared/hooks/queries/useSettings';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';
import { useTitle } from '@/shared/hooks';
import IconPickerField from '@/admin/components/ui/IconPickerField';

const BANNER_IMAGE_PATH = '/assets/images/contact-banner.jpg';
const SECTION_BG_IMAGE_PATH = '/assets/images/contact-section-bg.jpg';
const IMAGE_FALLBACK = '/assets/images/main-slider/slide2/bg-pic1.jpg';

const DEFAULT_SOCIALS: ContactSocialItem[] = [
    { icon: 'FaXTwitter', url: 'https://www.x.com' },
    { icon: 'FaFacebook', url: 'https://www.facebook.com' },
    { icon: 'FaInstagram', url: 'https://www.instagram.com' },
    { icon: 'FaPinterest', url: 'https://www.pinterest.com' },
];

/* Banner Section Card */

function BannerSectionCard({
    initialData,
}: {
    initialData: ContactSettingsData;
}) {
    const updateMutation = useUpdateContactSettings();
    const uploadBannerMutation = useUploadContactBannerImage();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<ContactSettingsData>({ defaultValues: initialData });

    const [bannerImageUrl, setBannerImageUrl] = useState(
        initialData.banner_image_url ?? null
    );

    const bannerFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        reset(initialData);
        setBannerImageUrl(initialData.banner_image_url ?? null);
    }, [initialData, reset]);

    const onSubmit = (data: ContactSettingsData) => {
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
                                    placeholder="Contact Us"
                                    isInvalid={!!errors.banner_title}
                                />
                                <Form.Text className="text-muted">
                                    Heading displayed on the contact page banner
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
                            permission={PERMISSIONS.WEBSITE.EDIT_CONTACT}
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

/* Contact Us Section Card */

function ContactUsSectionCard({
    initialData,
}: {
    initialData: ContactSettingsData;
}) {
    const updateMutation = useUpdateContactSettings();
    const uploadBgMutation = useUploadContactSectionBgImage();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<ContactSettingsData>({ defaultValues: initialData });

    const [bgImageUrl, setBgImageUrl] = useState(
        initialData.contact_section_bg_image_url ?? null
    );
    const [socialsEnabled, setSocialsEnabled] = useState(
        initialData.contact_socials_enabled ?? true
    );
    const [socials, setSocials] = useState<ContactSocialItem[]>(
        initialData.contact_socials ?? DEFAULT_SOCIALS
    );
    const [socialsError, setSocialsError] = useState<string | null>(null);

    const bgFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        reset(initialData);
        setBgImageUrl(initialData.contact_section_bg_image_url ?? null);
        setSocialsEnabled(initialData.contact_socials_enabled ?? true);
        setSocials(initialData.contact_socials ?? DEFAULT_SOCIALS);
        setSocialsError(null);
    }, [initialData, reset]);

    const handleBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        setBgImageUrl(previewUrl);
        uploadBgMutation.mutate(file, {
            onSuccess: res => {
                URL.revokeObjectURL(previewUrl);
                setBgImageUrl(res.data.contact_section_bg_image_url ?? null);
            },
            onError: () => {
                URL.revokeObjectURL(previewUrl);
                setBgImageUrl(initialData.contact_section_bg_image_url ?? null);
            },
        });
        e.target.value = '';
    };

    // Socials helpers
    const updateSocial = (
        index: number,
        field: keyof ContactSocialItem,
        value: string
    ) => {
        setSocials(prev =>
            prev.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        );
    };
    const removeSocial = (index: number) => {
        setSocials(prev => prev.filter((_, i) => i !== index));
    };
    const addSocial = () => {
        setSocials(prev => [...prev, { icon: 'FaFacebook', url: '' }]);
    };

    const onSubmit = (data: ContactSettingsData) => {
        setSocialsError(null);
        updateMutation.mutate(
            {
                contact_section_large_title: data.contact_section_large_title,
                contact_socials_enabled: socialsEnabled,
                contact_socials_title: data.contact_socials_title,
                contact_socials: socials.filter(s => s.url.trim()),
            },
            {
                onError: error => {
                    applyServerErrors(error, setError);
                    const err = error as {
                        response?: {
                            data?: { errors?: Record<string, string[]> };
                        };
                    };
                    const socialsErrors = Object.entries(
                        err?.response?.data?.errors ?? {}
                    )
                        .filter(([key]) => key.startsWith('contact_socials'))
                        .flatMap(([, msgs]) => msgs);
                    if (socialsErrors.length > 0) {
                        setSocialsError(socialsErrors[0]);
                    }
                },
            }
        );
    };

    return (
        <Card className="mb-4">
            <Card.Header>
                <strong>Contact Us Section</strong>
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    {/* Large title + Background image */}
                    <Row className="g-3 mb-4">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Large Title</Form.Label>
                                <Form.Control
                                    {...register('contact_section_large_title')}
                                    placeholder="Get In Touch"
                                    isInvalid={
                                        !!errors.contact_section_large_title
                                    }
                                />
                                <Form.Text className="text-muted">
                                    Large masked heading on the left column
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    {
                                        errors.contact_section_large_title
                                            ?.message
                                    }
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        <Col md={12}>
                            <Form.Label className="fw-semibold">
                                Background Image (text masking)
                            </Form.Label>
                            <div className="d-flex align-items-start gap-3">
                                <img
                                    src={
                                        bgImageUrl
                                            ? bgImageUrl
                                            : SECTION_BG_IMAGE_PATH
                                    }
                                    alt="Section background"
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
                    </Row>

                    {/* Info items note */}
                    <div
                        className="mb-4 p-3 border rounded"
                        style={{ background: '#f8f9fa' }}
                    >
                        <Form.Text className="text-muted">
                            <strong>Phone, Email &amp; Address</strong> are
                            pulled automatically from{' '}
                            <strong>System Settings → General</strong>. Items
                            with no value are hidden automatically.
                        </Form.Text>
                    </div>

                    {/* Socials */}
                    <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                            <Form.Label className="fw-semibold mb-0">
                                Socials Section
                            </Form.Label>
                            <Form.Check
                                type="switch"
                                id="contact-socials-enabled"
                                label="Show socials"
                                checked={socialsEnabled}
                                onChange={e =>
                                    setSocialsEnabled(e.target.checked)
                                }
                            />
                        </div>

                        <Row className="g-2 mb-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Section Title</Form.Label>
                                    <Form.Control
                                        {...register('contact_socials_title')}
                                        placeholder="Follow Us"
                                        isInvalid={
                                            !!errors.contact_socials_title
                                        }
                                        disabled={!socialsEnabled}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.contact_socials_title?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>

                        {socialsError && (
                            <div className="alert alert-danger py-2 px-3 mb-2 small">
                                {socialsError}
                            </div>
                        )}

                        <div className="d-flex flex-column gap-2">
                            {socials.map((social, index) => (
                                <div
                                    key={index}
                                    className="d-flex align-items-center gap-2 p-2 border rounded"
                                    style={{ background: '#f8f9fa' }}
                                >
                                    <IconPickerField
                                        value={social.icon}
                                        onChange={name =>
                                            updateSocial(index, 'icon', name)
                                        }
                                    />
                                    <Form.Control
                                        size="sm"
                                        placeholder="URL (e.g. https://www.facebook.com/yourpage)"
                                        value={social.url}
                                        onChange={e =>
                                            updateSocial(
                                                index,
                                                'url',
                                                e.target.value
                                            )
                                        }
                                        disabled={!socialsEnabled}
                                    />
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        type="button"
                                        onClick={() => removeSocial(index)}
                                        style={{ flexShrink: 0 }}
                                    >
                                        ×
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            type="button"
                            className="mt-2"
                            onClick={addSocial}
                            disabled={!socialsEnabled}
                        >
                            + Add Social
                        </Button>
                    </div>

                    <div className="d-flex justify-content-end mt-4">
                        <PermisssionGuard
                            permission={PERMISSIONS.WEBSITE.EDIT_CONTACT}
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

/* Contact Info Card */

function ContactInfoCard({
    initialData,
}: {
    initialData: ContactSettingsData;
}) {
    const updateMutation = useUpdateContactSettings();
    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<ContactSettingsData>({ defaultValues: initialData });

    const [mapEnabled, setMapEnabled] = useState(
        initialData.map_enabled ?? true
    );

    useEffect(() => {
        reset(initialData);
        setMapEnabled(initialData.map_enabled ?? true);
    }, [initialData, reset]);

    const onSubmit = (data: ContactSettingsData) => {
        updateMutation.mutate(
            { ...data, map_enabled: mapEnabled },
            {
                onError: error => applyServerErrors(error, setError),
            }
        );
    };

    return (
        <Card>
            <Card.Header>
                <strong>Contact Information</strong>
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row className="g-3">
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Address</Form.Label>
                                <Form.Control
                                    {...register('address')}
                                    placeholder="123 Main Street, Accra, Ghana"
                                    isInvalid={!!errors.address}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.address?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Phone</Form.Label>
                                <Form.Control
                                    {...register('phone')}
                                    placeholder="+233 XX XXX XXXX"
                                    isInvalid={!!errors.phone}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.phone?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    {...register('email')}
                                    placeholder="info@example.com"
                                    isInvalid={!!errors.email}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.email?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>WhatsApp Number</Form.Label>
                                <Form.Control
                                    {...register('whatsapp_number')}
                                    placeholder="+233XXXXXXXXX"
                                    isInvalid={!!errors.whatsapp_number}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.whatsapp_number?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Office Hours</Form.Label>
                                <Form.Control
                                    {...register('hours')}
                                    placeholder="Mon–Sat, 8am–6pm"
                                    isInvalid={!!errors.hours}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.hours?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <Form.Label className="fw-semibold mb-0">
                                    Map Section
                                </Form.Label>
                                <Form.Check
                                    type="switch"
                                    id="map-enabled"
                                    label="Show map"
                                    checked={mapEnabled}
                                    onChange={e =>
                                        setMapEnabled(e.target.checked)
                                    }
                                />
                            </div>
                            <Form.Group>
                                <Form.Control
                                    {...register('map_embed_url')}
                                    placeholder="https://www.google.com/maps/embed?..."
                                    isInvalid={!!errors.map_embed_url}
                                    disabled={!mapEnabled}
                                />
                                <Form.Text className="text-muted">
                                    Google Maps embed URL - get this from Google
                                    Maps &gt; Share &gt; Embed a map
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    {errors.map_embed_url?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end mt-4">
                        <PermisssionGuard
                            permission={PERMISSIONS.WEBSITE.EDIT_CONTACT}
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

/* Branch Locations Section Card */

function BranchLocationsSectionCard({
    initialData,
}: {
    initialData: ContactSettingsData;
}) {
    const updateMutation = useUpdateContactSettings();
    const { data: activeBranchesRes } = useActiveBranches();
    const activeBranches = activeBranchesRes?.data ?? [];

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<ContactSettingsData>({ defaultValues: initialData });

    const [enabled, setEnabled] = useState(
        initialData.contact_branch_locations_enabled ?? true
    );
    const [selectedIds, setSelectedIds] = useState<string[]>(
        initialData.contact_branch_ids ?? []
    );

    useEffect(() => {
        reset(initialData);
        setEnabled(initialData.contact_branch_locations_enabled ?? true);
        setSelectedIds(initialData.contact_branch_ids ?? []);
    }, [initialData, reset]);

    const addBranch = (id: string) => {
        if (!selectedIds.includes(id)) setSelectedIds(prev => [...prev, id]);
    };

    const removeBranch = (id: string) => {
        setSelectedIds(prev => prev.filter(x => x !== id));
    };

    const onSubmit = (data: ContactSettingsData) => {
        updateMutation.mutate(
            {
                contact_branch_locations_enabled: enabled,
                contact_branch_locations_title:
                    data.contact_branch_locations_title,
                contact_branch_ids: selectedIds,
            },
            { onError: error => applyServerErrors(error, setError) }
        );
    };

    const unselectedBranches = activeBranches.filter(
        b => !selectedIds.includes(b.id)
    );

    return (
        <Card className="mb-4">
            <Card.Header>
                <strong>Branch Locations Section</strong>
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <Form.Label className="fw-semibold mb-0">
                            Branch Locations
                        </Form.Label>
                        <Form.Check
                            type="switch"
                            id="branch-locations-enabled"
                            label="Show section"
                            checked={enabled}
                            onChange={e => setEnabled(e.target.checked)}
                        />
                    </div>

                    <Row className="g-3 mb-4">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Section Title</Form.Label>
                                <Form.Control
                                    {...register(
                                        'contact_branch_locations_title'
                                    )}
                                    placeholder="Our Branches"
                                    disabled={!enabled}
                                    isInvalid={
                                        !!errors.contact_branch_locations_title
                                    }
                                />
                                <Form.Control.Feedback type="invalid">
                                    {
                                        errors.contact_branch_locations_title
                                            ?.message
                                    }
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Label className="fw-semibold">
                        Selected Branches
                    </Form.Label>

                    <div className="mb-3 d-flex flex-column gap-2">
                        {selectedIds.length === 0 && (
                            <p className="text-muted small mb-0">
                                No branches selected. Add branches using the
                                dropdown below.
                            </p>
                        )}
                        {selectedIds.map(id => {
                            const branch = activeBranches.find(
                                b => b.id === id
                            );
                            if (!branch) return null;
                            return (
                                <div
                                    key={id}
                                    className="d-flex align-items-center justify-content-between p-2 border rounded"
                                    style={{ background: '#f8f9fa' }}
                                >
                                    <div>
                                        <span className="fw-semibold">
                                            {branch.name}
                                        </span>
                                        {branch.address && (
                                            <span className="text-muted ms-2 small">
                                                {branch.address}
                                            </span>
                                        )}
                                        {branch.phone && (
                                            <span className="text-muted ms-2 small">
                                                · {branch.phone}
                                            </span>
                                        )}
                                    </div>
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        type="button"
                                        onClick={() => removeBranch(id)}
                                        disabled={!enabled}
                                        style={{ flexShrink: 0 }}
                                    >
                                        ×
                                    </Button>
                                </div>
                            );
                        })}
                    </div>

                    {unselectedBranches.length > 0 && (
                        <Form.Select
                            size="sm"
                            value=""
                            disabled={!enabled}
                            onChange={e => {
                                if (e.target.value) addBranch(e.target.value);
                            }}
                            style={{ maxWidth: 320 }}
                        >
                            <option value="">+ Add a branch…</option>
                            {unselectedBranches.map(b => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </Form.Select>
                    )}

                    <Form.Text className="d-block text-muted mt-2">
                        Phone and email for each branch are managed in{' '}
                        <strong>Settings → Branches</strong>.
                    </Form.Text>

                    <div className="d-flex justify-content-end mt-4">
                        <PermisssionGuard
                            permission={PERMISSIONS.WEBSITE.EDIT_CONTACT}
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

export default function ContactContent() {
    const title = useTitle('Contact Page');
    const { data: res, isLoading } = useContactSettings();

    if (isLoading) {
        return <SettingsFormSkeleton cards={2} />;
    }

    const data = res?.data ?? {};

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>Contact Page Content</h4>
                <p className="text-muted mb-0">
                    Manage each section of the contact page independently.
                </p>
            </div>

            <BannerSectionCard initialData={data} />
            <ContactUsSectionCard initialData={data} />
            <ContactInfoCard initialData={data} />
            <BranchLocationsSectionCard initialData={data} />
        </div>
    );
}
