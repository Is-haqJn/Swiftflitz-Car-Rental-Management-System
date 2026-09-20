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
} from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useForm } from 'react-hook-form';
import { applyServerErrors } from '@/shared/libs/utils';
import type { HomepageSettingsData } from '@/shared/types';
import {
    useHomepageSettings,
    useUpdateHomepageSettings,
    useUploadHeroImage,
    useUploadWhyChooseUsBgImage,
    useUploadChauffeurImage,
    useUploadPickupProcessBgImage,
    useUploadPickupProcessBottomImage,
    useUploadTestimonialImage,
} from '@/shared/hooks/queries/useSettings';
import {
    AssetIconPickerModal,
    toAbsoluteAssetPath,
} from '@/admin/components/ui/AssetIconPickerModal';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';
import { useTitle } from '@/shared/hooks';
import { FaUser } from 'react-icons/fa6';
import { useVehicles } from '@/shared/hooks/queries/useVehicles';

const HERO_IMAGE_PATH = '/assets/images/main-slider/slide2/bg-pic1.jpg';

type WhyCard = { image_url: string; title: string; description: string };
type ProcessStep = { number: string; title: string; description: string };
type CounterCard = {
    icon_url: string;
    prefix: string;
    number: number;
    suffix: string;
    label: string;
};
type TestimonialCard = {
    image_url: string | null;
    name: string;
    position: string | null;
    details: string;
    rating: number | null;
};

const DEFAULT_PROCESS_STEPS: ProcessStep[] = [
    {
        number: '01',
        title: 'Choose A Car',
        description:
            'Check out our range of cars and choose the car of your choice',
    },
    {
        number: '02',
        title: 'Pick Up Date',
        description:
            'Check out our range of cars and choose the car of your choice',
    },
    {
        number: '03',
        title: 'Confirm Your Booking',
        description:
            'Check out our range of cars and choose the car of your choice',
    },
    {
        number: '04',
        title: 'Enjoy Driving',
        description:
            'Check out our range of cars and choose the car of your choice',
    },
];

const DEFAULT_COUNTER_CARDS: CounterCard[] = [
    {
        icon_url: 'assets/images/icons/rental.png',
        prefix: '',
        number: 4500,
        suffix: '+',
        label: 'Client Served',
    },
    {
        icon_url: 'assets/images/icons/man.png',
        prefix: '',
        number: 2750,
        suffix: '+',
        label: 'Happy Customers',
    },
    {
        icon_url: 'assets/images/icons/car-insurance.png',
        prefix: '',
        number: 600,
        suffix: '+',
        label: 'Vehicle In Stock Cars',
    },
    {
        icon_url: 'assets/images/icons/work-time.png',
        prefix: '',
        number: 12,
        suffix: '+',
        label: 'Years Experience',
    },
];

const DEFAULT_TESTIMONIAL_CARDS: TestimonialCard[] = [
    {
        image_url: 'assets/images/testimonial/pic1.jpg',
        name: 'Kevin Martin',
        position: 'Customer',
        details:
            'I Was Very Impresed Lorem posuere in miss and drana en the nisan semere sceriun amiss etiam ornare in the miss drana is lorem fermen mauris.',
        rating: 5,
    },
    {
        image_url: 'assets/images/testimonial/pic2.jpg',
        name: 'Devid Cullen',
        position: 'Customer',
        details:
            'I Was Very Impresed Lorem posuere in miss and drana en the nisan semere sceriun amiss etiam ornare in the miss drana is lorem fermen mauris.',
        rating: 5,
    },
    {
        image_url: 'assets/images/testimonial/pic3.jpg',
        name: 'Piter Has',
        position: 'Customer',
        details:
            'I Was Very Impresed Lorem posuere in miss and drana en the nisan semere sceriun amiss etiam ornare in the miss drana is lorem fermen mauris.',
        rating: 5,
    },
];

const DEFAULT_WHY_CARDS: WhyCard[] = [
    {
        image_url: 'assets/images/icons/label.png',
        title: 'Deals For Every Budget',
        description:
            'Incredible prices on every car, van, bike and package worldwide.',
    },
    {
        image_url: 'assets/images/icons/customer-support.png',
        title: '24/7 Road Assistance',
        description:
            'We are ready to assist you and provide reliable support whenever you need us.',
    },
    {
        image_url: 'assets/images/icons/parking-area.png',
        title: 'Free Pick-Up & Drop-Off',
        description:
            'Enjoy free pickup and drop-off services for a seamless rental experience.',
    },
];

/* Hero Section Card */

function HeroCard({ initialData }: { initialData: HomepageSettingsData }) {
    const updateMutation = useUpdateHomepageSettings();
    const uploadMutation = useUploadHeroImage();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<HomepageSettingsData>({ defaultValues: initialData });

    const [titleWords, setTitleWords] = useState<string[]>(
        initialData.hero_title_words ?? []
    );
    const [wordInput, setWordInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        reset(initialData);
        setTitleWords(initialData.hero_title_words ?? []);
    }, [initialData, reset]);

    const onSubmit = (data: HomepageSettingsData) => {
        updateMutation.mutate(
            { ...data, hero_title_words: titleWords },
            { onError: error => applyServerErrors(error, setError) }
        );
    };

    const addWord = () => {
        const trimmed = wordInput.trim();
        if (!trimmed) return;
        setTitleWords(prev => [...prev, trimmed]);
        setWordInput('');
    };

    const removeWord = (index: number) => {
        setTitleWords(prev => prev.filter((_, i) => i !== index));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        uploadMutation.mutate(file);
        e.target.value = '';
    };

    return (
        <Card className="mb-4">
            <Card.Header>
                <strong>Hero Section</strong>
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row className="g-3">
                        {/* Side text */}
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Side Badge Text</Form.Label>
                                <Form.Control
                                    {...register('hero_side_text')}
                                    placeholder="Premium"
                                    isInvalid={!!errors.hero_side_text}
                                />
                                <Form.Text className="text-muted">
                                    Small label above the title (e.g. "Premium")
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    {errors.hero_side_text?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        {/* Background text */}
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Background Text</Form.Label>
                                <Form.Control
                                    {...register('hero_background_text')}
                                    placeholder="For Rent"
                                    isInvalid={!!errors.hero_background_text}
                                />
                                <Form.Text className="text-muted">
                                    Large watermark text at the bottom of the
                                    hero
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    {errors.hero_background_text?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        {/* Title structure */}
                        <Col md={12}>
                            <Form.Label className="fw-semibold">
                                Hero Title
                            </Form.Label>
                            <Row className="g-2">
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label className="text-muted small">
                                            Beginning
                                        </Form.Label>
                                        <Form.Control
                                            {...register(
                                                'hero_title_beginning'
                                            )}
                                            placeholder="Your"
                                            isInvalid={
                                                !!errors.hero_title_beginning
                                            }
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {
                                                errors.hero_title_beginning
                                                    ?.message
                                            }
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label className="text-muted small">
                                            Highlight Word
                                        </Form.Label>
                                        <Form.Control
                                            {...register(
                                                'hero_title_highlight'
                                            )}
                                            placeholder="For"
                                            isInvalid={
                                                !!errors.hero_title_highlight
                                            }
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {
                                                errors.hero_title_highlight
                                                    ?.message
                                            }
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label className="text-muted small">
                                            Ending
                                        </Form.Label>
                                        <Form.Control
                                            {...register('hero_title_ending')}
                                            placeholder="Rent"
                                            isInvalid={
                                                !!errors.hero_title_ending
                                            }
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.hero_title_ending?.message}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label className="text-muted small">
                                            Rotating Words
                                        </Form.Label>
                                        <div className="d-flex gap-2">
                                            <Form.Control
                                                value={wordInput}
                                                onChange={e =>
                                                    setWordInput(e.target.value)
                                                }
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        addWord();
                                                    }
                                                }}
                                                placeholder="Add word…"
                                            />
                                            <Button
                                                variant="outline-secondary"
                                                type="button"
                                                onClick={addWord}
                                            >
                                                +
                                            </Button>
                                        </div>
                                        <div className="d-flex flex-wrap gap-1 mt-2">
                                            {titleWords.map((word, index) => (
                                                <Badge
                                                    key={index}
                                                    bg="secondary"
                                                    className="d-flex align-items-center gap-1"
                                                    style={{
                                                        cursor: 'default',
                                                    }}
                                                >
                                                    {word}
                                                    <span
                                                        role="button"
                                                        aria-label="Remove"
                                                        onClick={() =>
                                                            removeWord(index)
                                                        }
                                                        style={{
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        ×
                                                    </span>
                                                </Badge>
                                            ))}
                                        </div>
                                        <Form.Text className="text-muted">
                                            These words rotate in the title
                                            (e.g. "Choice", "Car")
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Col>

                        {/* Description */}
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Hero Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    {...register('hero_description')}
                                    isInvalid={!!errors.hero_description}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.hero_description?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        {/* CTAs */}
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Primary CTA Text</Form.Label>
                                <Form.Control
                                    {...register('hero_cta_text')}
                                    placeholder="Browse Vehicles"
                                    isInvalid={!!errors.hero_cta_text}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.hero_cta_text?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Primary CTA URL</Form.Label>
                                <Form.Control
                                    {...register('hero_cta_url')}
                                    placeholder="/listing"
                                    isInvalid={!!errors.hero_cta_url}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.hero_cta_url?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Secondary CTA Text</Form.Label>
                                <Form.Control
                                    {...register('hero_secondary_cta_text')}
                                    placeholder="Airport Transfer"
                                    isInvalid={!!errors.hero_secondary_cta_text}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.hero_secondary_cta_text?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Secondary CTA URL</Form.Label>
                                <Form.Control
                                    {...register('hero_secondary_cta_url')}
                                    placeholder="/airport"
                                    isInvalid={!!errors.hero_secondary_cta_url}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.hero_secondary_cta_url?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        {/* Hero image upload */}
                        <Col md={12}>
                            <Form.Label className="fw-semibold">
                                Hero Background Image
                            </Form.Label>
                            <div className="d-flex align-items-start gap-3">
                                <img
                                    src={
                                        initialData.hero_image_url
                                            ? `${initialData.hero_image_url}?v=${initialData.hero_image_version ?? ''}`
                                            : HERO_IMAGE_PATH
                                    }
                                    alt="Hero background"
                                    style={{
                                        width: 160,
                                        height: 90,
                                        objectFit: 'cover',
                                        borderRadius: 6,
                                        border: '1px solid #dee2e6',
                                        flexShrink: 0,
                                    }}
                                />
                                <div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="d-none"
                                        onChange={handleImageChange}
                                    />
                                    <Button
                                        variant="outline-primary"
                                        type="button"
                                        disabled={uploadMutation.isPending}
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
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

/* Hero Vehicle Badge Card */

function HeroVehicleBadgeCard({
    initialData,
}: {
    initialData: HomepageSettingsData;
}) {
    const updateMutation = useUpdateHomepageSettings();
    const { data: vehiclesRes } = useVehicles();
    const vehicles = vehiclesRes?.data ?? [];

    const {
        register,
        handleSubmit,
        reset,
        setError,
        watch,
        setValue,
        formState: { errors },
    } = useForm<HomepageSettingsData>({ defaultValues: initialData });

    useEffect(() => {
        reset(initialData);
    }, [initialData, reset]);

    const onSubmit = (data: HomepageSettingsData) => {
        updateMutation.mutate(data, {
            onError: error => applyServerErrors(error, setError),
        });
    };

    const mode = watch('hero_featured_vehicle_mode') ?? 'custom';
    const enabled = watch('hero_featured_vehicle_enabled') ?? true;
    const selectedVehicleId = watch('hero_featured_vehicle_id');

    useEffect(() => {
        if (mode === 'specific' && selectedVehicleId) {
            setValue(
                'hero_featured_vehicle_url',
                `/listings/${selectedVehicleId}`
            );
        }
    }, [selectedVehicleId, mode, setValue]);

    return (
        <Card className="mb-4">
            <Card.Header className="d-flex align-items-center gap-2">
                <strong>Hero Vehicle Badge</strong>
                <span
                    className={`badge bg-${enabled ? 'success' : 'secondary'}`}
                >
                    {enabled ? 'Visible' : 'Hidden'}
                </span>
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row className="g-3">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Enable Badge</Form.Label>
                                <Form.Check
                                    type="switch"
                                    id="hero_featured_vehicle_enabled"
                                    label="Show vehicle price badge on hero"
                                    {...register(
                                        'hero_featured_vehicle_enabled'
                                    )}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Visibility</Form.Label>
                                <Form.Select
                                    {...register(
                                        'hero_featured_vehicle_visibility'
                                    )}
                                    disabled={!enabled}
                                >
                                    <option value="all">All devices</option>
                                    <option value="desktop_only">
                                        Desktop only
                                    </option>
                                    <option value="mobile_only">
                                        Mobile only
                                    </option>
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Mode</Form.Label>
                                <Form.Select
                                    {...register('hero_featured_vehicle_mode')}
                                    disabled={!enabled}
                                >
                                    <option value="custom">Custom text</option>
                                    <option value="random">
                                        Random vehicle
                                    </option>
                                    <option value="specific">
                                        Specific vehicle
                                    </option>
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        {enabled && mode === 'custom' && (
                            <>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Vehicle Name</Form.Label>
                                        <Form.Control
                                            {...register(
                                                'hero_featured_vehicle_custom_title'
                                            )}
                                            placeholder="e.g. Harley Davidson"
                                            isInvalid={
                                                !!errors.hero_featured_vehicle_custom_title
                                            }
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {
                                                errors
                                                    .hero_featured_vehicle_custom_title
                                                    ?.message
                                            }
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Price (per day)</Form.Label>
                                        <Form.Control
                                            {...register(
                                                'hero_featured_vehicle_custom_price'
                                            )}
                                            placeholder="e.g. GHC800"
                                            isInvalid={
                                                !!errors.hero_featured_vehicle_custom_price
                                            }
                                        />
                                        <Form.Text className="text-muted">
                                            Displayed as-is (e.g. "GHC800",
                                            "$120")
                                        </Form.Text>
                                        <Form.Control.Feedback type="invalid">
                                            {
                                                errors
                                                    .hero_featured_vehicle_custom_price
                                                    ?.message
                                            }
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </>
                        )}

                        {enabled && mode === 'specific' && (
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Select Vehicle</Form.Label>
                                    <Form.Select
                                        {...register(
                                            'hero_featured_vehicle_id'
                                        )}
                                        isInvalid={
                                            !!errors.hero_featured_vehicle_id
                                        }
                                    >
                                        <option value="">
                                            -- Choose a vehicle --
                                        </option>
                                        {vehicles.map(v => (
                                            <option key={v.id} value={v.id}>
                                                {v.name} - {v.daily_rate}/day
                                            </option>
                                        ))}
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        {
                                            errors.hero_featured_vehicle_id
                                                ?.message
                                        }
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        )}

                        {enabled && mode === 'random' && (
                            <Col md={12}>
                                <Form.Text className="text-muted">
                                    A random active vehicle will be selected
                                    when you save. Save again to pick a new one.
                                </Form.Text>
                            </Col>
                        )}

                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Badge URL</Form.Label>
                                <Form.Control
                                    {...register('hero_featured_vehicle_url')}
                                    placeholder="/listings"
                                    isInvalid={
                                        !!errors.hero_featured_vehicle_url
                                    }
                                />
                                <Form.Text className="text-muted">
                                    {mode === 'specific'
                                        ? 'Auto-filled with the selected vehicle page. Edit to override.'
                                        : mode === 'random'
                                          ? 'Auto-set to the vehicle page on save. Edit to override.'
                                          : 'Where the badge links to (e.g. /listings).'}
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    {errors.hero_featured_vehicle_url?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
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

/* Counter Section Card */

function CounterSectionCard({
    initialData,
}: {
    initialData: HomepageSettingsData;
}) {
    const updateMutation = useUpdateHomepageSettings();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<HomepageSettingsData>({ defaultValues: initialData });

    const [cards, setCards] = useState<CounterCard[]>(
        (initialData.counter_cards as CounterCard[] | undefined) ??
            DEFAULT_COUNTER_CARDS
    );
    const [enabled, setEnabled] = useState(
        initialData.show_counter_section ?? true
    );
    const [visibility, setVisibility] = useState<
        'all' | 'desktop_only' | 'mobile_only'
    >(initialData.counter_visibility ?? 'all');
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerTargetIndex, setPickerTargetIndex] = useState<number | null>(
        null
    );

    useEffect(() => {
        reset(initialData);
        setCards(
            (initialData.counter_cards as CounterCard[] | undefined) ??
                DEFAULT_COUNTER_CARDS
        );
        setEnabled(initialData.show_counter_section ?? true);
        setVisibility(initialData.counter_visibility ?? 'all');
    }, [initialData, reset]);

    const openPicker = (index: number) => {
        setPickerTargetIndex(index);
        setPickerOpen(true);
    };

    const handleIconSelected = (path: string) => {
        if (pickerTargetIndex === null) return;
        setCards(prev =>
            prev.map((c, i) =>
                i === pickerTargetIndex ? { ...c, icon_url: path } : c
            )
        );
    };

    const updateCard = (
        index: number,
        field: keyof CounterCard,
        value: string | number
    ) => {
        setCards(prev =>
            prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
        );
    };

    const removeCard = (index: number) => {
        setCards(prev => prev.filter((_, i) => i !== index));
    };

    const addCard = () => {
        setCards(prev => [
            ...prev,
            {
                icon_url: 'assets/images/icons/car.png',
                prefix: '',
                number: 0,
                suffix: '+',
                label: '',
            },
        ]);
    };

    const onSubmit = (data: HomepageSettingsData) => {
        updateMutation.mutate(
            {
                show_counter_section: enabled,
                counter_visibility: visibility,
                counter_title: data.counter_title,
                counter_large_title: data.counter_large_title,
                counter_cards: cards,
            },
            { onError: error => applyServerErrors(error, setError) }
        );
    };

    return (
        <>
            <AssetIconPickerModal
                show={pickerOpen}
                onHide={() => setPickerOpen(false)}
                onSelect={handleIconSelected}
                currentValue={
                    pickerTargetIndex !== null
                        ? cards[pickerTargetIndex]?.icon_url
                        : undefined
                }
            />

            <Card className="mb-4">
                <Card.Header>
                    <strong>Counter Section</strong>
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        {/* Toggle + Visibility */}
                        <Row className="g-3 mb-3">
                            <Col md={6}>
                                <Form.Check
                                    type="switch"
                                    id="show-counter-section"
                                    label="Show Counter Section"
                                    checked={enabled}
                                    onChange={e => setEnabled(e.target.checked)}
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Visibility</Form.Label>
                                    <Form.Select
                                        value={visibility}
                                        onChange={e =>
                                            setVisibility(
                                                e.target.value as
                                                    | 'all'
                                                    | 'desktop_only'
                                                    | 'mobile_only'
                                            )
                                        }
                                    >
                                        <option value="all">All devices</option>
                                        <option value="desktop_only">
                                            Desktop only
                                        </option>
                                        <option value="mobile_only">
                                            Mobile only
                                        </option>
                                    </Form.Select>
                                    <Form.Text className="text-muted">
                                        Control which devices show this section
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="g-3 mb-4">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Title</Form.Label>
                                    <Form.Control
                                        {...register('counter_title')}
                                        isInvalid={!!errors.counter_title}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.counter_title?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Large Title</Form.Label>
                                    <Form.Control
                                        {...register('counter_large_title')}
                                        isInvalid={!!errors.counter_large_title}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.counter_large_title?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Counter Cards */}
                        <div className="mb-3">
                            <Form.Label className="fw-semibold">
                                Counter Cards
                            </Form.Label>
                            {cards.map((card, index) => (
                                <div
                                    key={index}
                                    className="border rounded p-3 mb-3"
                                >
                                    <Row className="g-2 align-items-center">
                                        <Col xs="auto">
                                            <div
                                                className="border rounded d-flex align-items-center justify-content-center"
                                                style={{
                                                    width: 48,
                                                    height: 48,
                                                    cursor: 'pointer',
                                                    overflow: 'hidden',
                                                }}
                                                onClick={() =>
                                                    openPicker(index)
                                                }
                                                title="Click to change icon"
                                            >
                                                <img
                                                    src={toAbsoluteAssetPath(
                                                        card.icon_url
                                                    )}
                                                    alt=""
                                                    style={{
                                                        width: 32,
                                                        height: 32,
                                                        objectFit: 'contain',
                                                    }}
                                                />
                                            </div>
                                        </Col>
                                        <Col xs={1}>
                                            <Form.Group>
                                                <Form.Label className="small mb-1">
                                                    Prefix
                                                </Form.Label>
                                                <Form.Control
                                                    size="sm"
                                                    value={card.prefix}
                                                    onChange={e =>
                                                        updateCard(
                                                            index,
                                                            'prefix',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="e.g. $"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col xs={2}>
                                            <Form.Group>
                                                <Form.Label className="small mb-1">
                                                    Number
                                                </Form.Label>
                                                <Form.Control
                                                    size="sm"
                                                    type="number"
                                                    min={0}
                                                    value={card.number}
                                                    onChange={e =>
                                                        updateCard(
                                                            index,
                                                            'number',
                                                            parseInt(
                                                                e.target.value,
                                                                10
                                                            ) || 0
                                                        )
                                                    }
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col xs={1}>
                                            <Form.Group>
                                                <Form.Label className="small mb-1">
                                                    Suffix
                                                </Form.Label>
                                                <Form.Control
                                                    size="sm"
                                                    value={card.suffix}
                                                    onChange={e =>
                                                        updateCard(
                                                            index,
                                                            'suffix',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="e.g. +"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col>
                                            <Form.Group>
                                                <Form.Label className="small mb-1">
                                                    Label
                                                </Form.Label>
                                                <Form.Control
                                                    size="sm"
                                                    value={card.label}
                                                    onChange={e =>
                                                        updateCard(
                                                            index,
                                                            'label',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="e.g. Happy Customers"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col
                                            xs="auto"
                                            className="d-flex align-items-end"
                                        >
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() =>
                                                    removeCard(index)
                                                }
                                                style={{ marginBottom: '0' }}
                                            >
                                                Remove
                                            </Button>
                                        </Col>
                                    </Row>
                                </div>
                            ))}
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={addCard}
                            >
                                + Add Counter
                            </Button>
                        </div>

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
        </>
    );
}

/* Testimonial Section Card */

const BLANK_TESTIMONIAL: TestimonialCard = {
    image_url: null,
    name: '',
    position: null,
    details: '',
    rating: null,
};

function TestimonialSectionCard({
    initialData,
}: {
    initialData: HomepageSettingsData;
}) {
    const updateMutation = useUpdateHomepageSettings();
    const uploadImageMutation = useUploadTestimonialImage();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<HomepageSettingsData>({ defaultValues: initialData });

    const [cards, setCards] = useState<TestimonialCard[]>(
        (initialData.testimonial_cards as TestimonialCard[] | undefined) ??
            DEFAULT_TESTIMONIAL_CARDS
    );
    const [enabled, setEnabled] = useState(
        initialData.show_testimonial_section ?? true
    );
    const [visibility, setVisibility] = useState<
        'all' | 'desktop_only' | 'mobile_only'
    >(initialData.testimonial_visibility ?? 'all');
    const [showImages, setShowImages] = useState(
        initialData.testimonial_show_images ?? true
    );
    const [showRatings, setShowRatings] = useState(
        initialData.testimonial_show_ratings ?? true
    );

    /* Modal state */
    const [showModal, setShowModal] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [draft, setDraft] = useState<TestimonialCard>(BLANK_TESTIMONIAL);

    useEffect(() => {
        reset(initialData);
        setCards(
            (initialData.testimonial_cards as TestimonialCard[] | undefined) ??
                DEFAULT_TESTIMONIAL_CARDS
        );
        setEnabled(initialData.show_testimonial_section ?? true);
        setVisibility(initialData.testimonial_visibility ?? 'all');
        setShowImages(initialData.testimonial_show_images ?? true);
        setShowRatings(initialData.testimonial_show_ratings ?? true);
    }, [initialData, reset]);

    const openAdd = () => {
        setDraft(BLANK_TESTIMONIAL);
        setEditingIndex(null);
        setShowModal(true);
    };

    const openEdit = (index: number) => {
        setDraft({ ...cards[index] });
        setEditingIndex(index);
        setShowModal(true);
    };

    const closeModal = () => setShowModal(false);

    const saveModal = () => {
        if (editingIndex === null) {
            setCards(prev => [...prev, draft]);
        } else {
            setCards(prev =>
                prev.map((c, i) => (i === editingIndex ? draft : c))
            );
        }
        setShowModal(false);
    };

    const removeCard = (index: number) => {
        setCards(prev => prev.filter((_, i) => i !== index));
    };

    const handleModalImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        uploadImageMutation.mutate(file, {
            onSuccess: res =>
                setDraft(prev => ({ ...prev, image_url: res.data.path })),
        });
        e.target.value = '';
    };

    const onSubmit = (data: HomepageSettingsData) => {
        updateMutation.mutate(
            {
                show_testimonial_section: enabled,
                testimonial_visibility: visibility,
                testimonial_title: data.testimonial_title,
                testimonial_large_title: data.testimonial_large_title,
                testimonial_show_images: showImages,
                testimonial_show_ratings: showRatings,
                testimonial_cards: cards,
            },
            { onError: error => applyServerErrors(error, setError) }
        );
    };

    return (
        <>
            <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <strong>Testimonial Section</strong>
                    <Form.Check
                        type="switch"
                        id="show-testimonial-section"
                        label="Show Section"
                        checked={enabled}
                        onChange={e => setEnabled(e.target.checked)}
                    />
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        {/* Visibility */}
                        <Row className="g-3 mb-4">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Visibility</Form.Label>
                                    <Form.Select
                                        value={visibility}
                                        onChange={e =>
                                            setVisibility(
                                                e.target.value as
                                                    | 'all'
                                                    | 'desktop_only'
                                                    | 'mobile_only'
                                            )
                                        }
                                    >
                                        <option value="all">All devices</option>
                                        <option value="desktop_only">
                                            Desktop only
                                        </option>
                                        <option value="mobile_only">
                                            Mobile only
                                        </option>
                                    </Form.Select>
                                    <Form.Text className="text-muted">
                                        Control which devices show this section
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="g-3 mb-4">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Title</Form.Label>
                                    <Form.Control
                                        {...register('testimonial_title')}
                                        isInvalid={!!errors.testimonial_title}
                                        placeholder="Testimonial"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.testimonial_title?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Large Title</Form.Label>
                                    <Form.Control
                                        {...register('testimonial_large_title')}
                                        isInvalid={
                                            !!errors.testimonial_large_title
                                        }
                                        placeholder="What Our Customers Say"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {
                                            errors.testimonial_large_title
                                                ?.message
                                        }
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Check
                                    type="switch"
                                    id="testimonial-show-images"
                                    label="Show Images on All Cards"
                                    checked={showImages}
                                    onChange={e =>
                                        setShowImages(e.target.checked)
                                    }
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Check
                                    type="switch"
                                    id="testimonial-show-ratings"
                                    label="Show Star Ratings on All Cards"
                                    checked={showRatings}
                                    onChange={e =>
                                        setShowRatings(e.target.checked)
                                    }
                                />
                            </Col>
                        </Row>

                        {/* Testimonial list */}
                        <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="fw-semibold small text-muted">
                                    Testimonials ({cards.length})
                                </span>
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={openAdd}
                                >
                                    + Add Testimonial
                                </Button>
                            </div>

                            {cards.length === 0 ? (
                                <p className="text-muted small">
                                    No testimonials yet. Add one above.
                                </p>
                            ) : (
                                <table className="table table-sm table-bordered mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: 48 }}></th>
                                            <th>Name</th>
                                            <th>Position</th>
                                            <th style={{ width: 80 }}>
                                                Rating
                                            </th>
                                            <th style={{ width: 110 }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cards.map((card, index) => (
                                            <tr
                                                key={index}
                                                className="align-middle"
                                            >
                                                <td className="text-center">
                                                    {card.image_url ? (
                                                        <img
                                                            src={toAbsoluteAssetPath(
                                                                card.image_url
                                                            )}
                                                            alt={card.name}
                                                            style={{
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius:
                                                                    '50%',
                                                                objectFit:
                                                                    'cover',
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="text-muted">
                                                            -
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {card.name || (
                                                        <em className="text-muted">
                                                            Unnamed
                                                        </em>
                                                    )}
                                                </td>
                                                <td>
                                                    {card.position || (
                                                        <span className="text-muted">
                                                            -
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {card.rating != null ? (
                                                        <span>
                                                            {'★'.repeat(
                                                                card.rating
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted">
                                                            -
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-1">
                                                        <Button
                                                            variant="outline-secondary"
                                                            size="sm"
                                                            onClick={() =>
                                                                openEdit(index)
                                                            }
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() =>
                                                                removeCard(
                                                                    index
                                                                )
                                                            }
                                                        >
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

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

            {/* Add / Edit Testimonial Modal */}
            <Modal show={showModal} onHide={closeModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingIndex === null
                            ? 'Add Testimonial'
                            : 'Edit Testimonial'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="g-3">
                        {/* Photo */}
                        <Col xs={12}>
                            <Form.Label className="fw-semibold">
                                Photo
                            </Form.Label>
                            <div className="d-flex align-items-center gap-3">
                                {draft.image_url ? (
                                    <img
                                        src={toAbsoluteAssetPath(
                                            draft.image_url
                                        )}
                                        alt="preview"
                                        style={{
                                            width: 64,
                                            height: 64,
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: '1px solid #dee2e6',
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: 64,
                                            height: 64,
                                            borderRadius: '50%',
                                            background: '#f0f0f0',
                                            border: '1px dashed #ccc',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 22,
                                            color: '#aaa',
                                        }}
                                    >
                                        <FaUser />
                                    </div>
                                )}
                                <div className="d-flex flex-column gap-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="d-none"
                                        ref={fileInputRef}
                                        onChange={handleModalImageSelect}
                                    />
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        disabled={uploadImageMutation.isPending}
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                    >
                                        {uploadImageMutation.isPending
                                            ? 'Uploading…'
                                            : draft.image_url
                                              ? 'Change Photo'
                                              : 'Upload Photo'}
                                    </Button>
                                    {draft.image_url && (
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="text-danger p-0"
                                            onClick={() =>
                                                setDraft(prev => ({
                                                    ...prev,
                                                    image_url: null,
                                                }))
                                            }
                                        >
                                            Remove photo
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Col>

                        {/* Name */}
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Name</Form.Label>
                                <Form.Control
                                    value={draft.name}
                                    onChange={e =>
                                        setDraft(prev => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. Kevin Martin"
                                />
                            </Form.Group>
                        </Col>

                        {/* Position */}
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    Position{' '}
                                    <span className="text-muted fw-normal">
                                        (optional)
                                    </span>
                                </Form.Label>
                                <Form.Control
                                    value={draft.position ?? ''}
                                    onChange={e =>
                                        setDraft(prev => ({
                                            ...prev,
                                            position: e.target.value || null,
                                        }))
                                    }
                                    placeholder="e.g. Customer"
                                />
                            </Form.Group>
                        </Col>

                        {/* Details */}
                        <Col xs={12}>
                            <Form.Group>
                                <Form.Label>Testimonial Details</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    value={draft.details}
                                    onChange={e =>
                                        setDraft(prev => ({
                                            ...prev,
                                            details: e.target.value,
                                        }))
                                    }
                                    placeholder="What the customer said…"
                                />
                            </Form.Group>
                        </Col>

                        {/* Star rating */}
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>
                                    Star Rating{' '}
                                    <span className="text-muted fw-normal">
                                        (1–5, optional)
                                    </span>
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    min={1}
                                    max={5}
                                    value={draft.rating ?? ''}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setDraft(prev => ({
                                            ...prev,
                                            rating:
                                                val === '' ? null : Number(val),
                                        }));
                                    }}
                                    placeholder="5"
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeModal}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={saveModal}
                        disabled={uploadImageMutation.isPending}
                    >
                        {editingIndex === null ? 'Add' : 'Save Changes'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

/* Features Section Card */

function FeaturesCard({ initialData }: { initialData: HomepageSettingsData }) {
    const updateMutation = useUpdateHomepageSettings();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<HomepageSettingsData>({ defaultValues: initialData });

    useEffect(() => {
        reset(initialData);
    }, [initialData, reset]);

    const onSubmit = (data: HomepageSettingsData) => {
        updateMutation.mutate(
            {
                features_title: data.features_title,
                features_subtitle: data.features_subtitle,
                features_description: data.features_description,
            },
            { onError: error => applyServerErrors(error, setError) }
        );
    };

    return (
        <Card className="mb-4">
            <Card.Header>
                <strong>Features Section</strong>
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Features Title</Form.Label>
                                <Form.Control
                                    {...register('features_title')}
                                    placeholder="Why Choose Us"
                                    isInvalid={!!errors.features_title}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.features_title?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Features Subtitle</Form.Label>
                                <Form.Control
                                    {...register('features_subtitle')}
                                    isInvalid={!!errors.features_subtitle}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.features_subtitle?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Features Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    {...register('features_description')}
                                    isInvalid={!!errors.features_description}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.features_description?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
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

/* Categories Section Card */

function CategoriesCard({
    initialData,
}: {
    initialData: HomepageSettingsData;
}) {
    const updateMutation = useUpdateHomepageSettings();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<HomepageSettingsData>({ defaultValues: initialData });

    useEffect(() => {
        reset(initialData);
    }, [initialData, reset]);

    const onSubmit = (data: HomepageSettingsData) => {
        updateMutation.mutate(
            {
                categories_title: data.categories_title,
                categories_large_title: data.categories_large_title,
            },
            { onError: error => applyServerErrors(error, setError) }
        );
    };

    return (
        <Card className="mb-4">
            <Card.Header>
                <strong>Categories Section</strong>
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row className="g-3">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Section Title</Form.Label>
                                <Form.Control
                                    {...register('categories_title')}
                                    placeholder="Categories"
                                    isInvalid={!!errors.categories_title}
                                />
                                <Form.Text className="text-muted">
                                    Small label above the heading
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    {errors.categories_title?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={8}>
                            <Form.Group>
                                <Form.Label>Large Title</Form.Label>
                                <Form.Control
                                    {...register('categories_large_title')}
                                    placeholder="A Look At All Types Of Vehicles"
                                    isInvalid={!!errors.categories_large_title}
                                />
                                <Form.Text className="text-muted">
                                    Main heading displayed above the carousel
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    {errors.categories_large_title?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
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

/* Featured Section Card */

function FeaturedCard({ initialData }: { initialData: HomepageSettingsData }) {
    const updateMutation = useUpdateHomepageSettings();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<HomepageSettingsData>({ defaultValues: initialData });

    useEffect(() => {
        reset(initialData);
    }, [initialData, reset]);

    const onSubmit = (data: HomepageSettingsData) => {
        updateMutation.mutate(
            {
                featured_title: data.featured_title,
                featured_large_title: data.featured_large_title,
                featured_empty_text: data.featured_empty_text,
            },
            { onError: error => applyServerErrors(error, setError) }
        );
    };

    return (
        <Card className="mb-4">
            <Card.Header>
                <strong>Featured Vehicles Section</strong>
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row className="g-3">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Section Title</Form.Label>
                                <Form.Control
                                    {...register('featured_title')}
                                    placeholder="Choose your car"
                                    isInvalid={!!errors.featured_title}
                                />
                                <Form.Text className="text-muted">
                                    Small label above the heading
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    {errors.featured_title?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={8}>
                            <Form.Group>
                                <Form.Label>Large Title</Form.Label>
                                <Form.Control
                                    {...register('featured_large_title')}
                                    placeholder="Our Featured Vehicles"
                                    isInvalid={!!errors.featured_large_title}
                                />
                                <Form.Text className="text-muted">
                                    Main heading displayed above the carousel
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    {errors.featured_large_title?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Empty State Text</Form.Label>
                                <Form.Control
                                    {...register('featured_empty_text')}
                                    placeholder="No featured vehicles at the moment."
                                    isInvalid={!!errors.featured_empty_text}
                                />
                                <Form.Text className="text-muted">
                                    Shown when no vehicles are marked as
                                    featured
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    {errors.featured_empty_text?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
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

/* About Section Toggle Card */

function AboutSectionCard({
    initialData,
}: {
    initialData: HomepageSettingsData;
}) {
    const updateMutation = useUpdateHomepageSettings();
    const [enabled, setEnabled] = useState(
        initialData.show_about_section ?? true
    );

    useEffect(() => {
        setEnabled(initialData.show_about_section ?? true);
    }, [initialData]);

    const handleSave = () => {
        updateMutation.mutate({ show_about_section: enabled });
    };

    return (
        <Card className="mb-4">
            <Card.Header>
                <strong>About Us Section</strong>
            </Card.Header>
            <Card.Body>
                <Form.Check
                    type="switch"
                    id="show-about-section"
                    label="Show About Us section on homepage"
                    checked={enabled}
                    onChange={e => setEnabled(e.target.checked)}
                    className="mb-1"
                />
                <Form.Text className="text-muted">
                    Toggle this off to hide the About Us section from the
                    homepage entirely. Content is managed under{' '}
                    <a href="/admin/content/about">About Page Content</a>.
                </Form.Text>

                <div className="d-flex justify-content-end mt-4">
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
                                : 'Save Settings'}
                        </Button>
                    </PermisssionGuard>
                </div>
            </Card.Body>
        </Card>
    );
}

/* Why Choose Us Card */

function WhyChooseUsCard({
    initialData,
}: {
    initialData: HomepageSettingsData;
}) {
    const updateMutation = useUpdateHomepageSettings();
    const uploadBgMutation = useUploadWhyChooseUsBgImage();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<HomepageSettingsData>({ defaultValues: initialData });

    const [cards, setCards] = useState<WhyCard[]>(
        initialData.why_cards ?? DEFAULT_WHY_CARDS
    );
    const [enabled, setEnabled] = useState(
        initialData.show_why_choose_us_section ?? true
    );
    const [visibility, setVisibility] = useState<
        'all' | 'desktop_only' | 'mobile_only'
    >(initialData.why_choose_us_visibility ?? 'all');
    const [bgImageUrl, setBgImageUrl] = useState<string | null | undefined>(
        initialData.whychooseus_bg_image_url
    );
    const [bgPreviewVersion, setBgPreviewVersion] = useState(Date.now());
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerTargetIndex, setPickerTargetIndex] = useState<number | null>(
        null
    );
    const bgFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        reset(initialData);
        setCards(initialData.why_cards ?? DEFAULT_WHY_CARDS);
        setEnabled(initialData.show_why_choose_us_section ?? true);
        setVisibility(initialData.why_choose_us_visibility ?? 'all');
        setBgImageUrl(initialData.whychooseus_bg_image_url);
    }, [initialData, reset]);

    const openPicker = (index: number) => {
        setPickerTargetIndex(index);
        setPickerOpen(true);
    };

    const handleIconSelected = (path: string) => {
        if (pickerTargetIndex === null) return;
        setCards(prev =>
            prev.map((c, i) =>
                i === pickerTargetIndex ? { ...c, image_url: path } : c
            )
        );
    };

    const updateCard = (index: number, field: keyof WhyCard, value: string) => {
        setCards(prev =>
            prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
        );
    };

    const removeCard = (index: number) => {
        setCards(prev => prev.filter((_, i) => i !== index));
    };

    const addCard = () => {
        setCards(prev => [
            ...prev,
            {
                image_url: 'assets/images/icons/car.png',
                title: '',
                description: '',
            },
        ]);
    };

    const handleBgImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        uploadBgMutation.mutate(file, {
            onSuccess: res => {
                setBgImageUrl(res?.data?.whychooseus_bg_image_url ?? null);
                setBgPreviewVersion(Date.now());
            },
        });
        e.target.value = '';
    };

    const onSubmit = (data: HomepageSettingsData) => {
        const filledCards = cards.filter(
            c => c.title?.trim() || c.description?.trim()
        );
        updateMutation.mutate(
            {
                why_title: data.why_title,
                why_large_title: data.why_large_title,
                why_cards: filledCards,
                show_why_choose_us_section: enabled,
                why_choose_us_visibility: visibility,
            },
            { onError: error => applyServerErrors(error, setError) }
        );
    };

    return (
        <>
            <AssetIconPickerModal
                show={pickerOpen}
                onHide={() => setPickerOpen(false)}
                onSelect={handleIconSelected}
                currentValue={
                    pickerTargetIndex !== null
                        ? cards[pickerTargetIndex]?.image_url
                        : undefined
                }
            />

            <Card className="mb-4">
                <Card.Header>
                    <strong>Why Choose Us Section</strong>
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        {/* Toggle + Visibility */}
                        <Row className="g-3 mb-3">
                            <Col md={6}>
                                <Form.Check
                                    type="switch"
                                    id="show-why-choose-us-section"
                                    label="Show this section on the homepage"
                                    checked={enabled}
                                    onChange={e => setEnabled(e.target.checked)}
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Visibility</Form.Label>
                                    <Form.Select
                                        value={visibility}
                                        onChange={e =>
                                            setVisibility(
                                                e.target.value as
                                                    | 'all'
                                                    | 'desktop_only'
                                                    | 'mobile_only'
                                            )
                                        }
                                    >
                                        <option value="all">All devices</option>
                                        <option value="desktop_only">
                                            Desktop only
                                        </option>
                                        <option value="mobile_only">
                                            Mobile only
                                        </option>
                                    </Form.Select>
                                    <Form.Text className="text-muted">
                                        Control which devices show this section
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="g-3 mb-3">
                            {/* Section title */}
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Section Title</Form.Label>
                                    <Form.Control
                                        {...register('why_title')}
                                        placeholder="One step towards you"
                                        isInvalid={!!errors.why_title}
                                    />
                                    <Form.Text className="text-muted">
                                        Small label above the heading
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.why_title?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            {/* Large title */}
                            <Col md={8}>
                                <Form.Group>
                                    <Form.Label>Large Title</Form.Label>
                                    <Form.Control
                                        {...register('why_large_title')}
                                        placeholder="Let's Your Adventure Begin"
                                        isInvalid={!!errors.why_large_title}
                                    />
                                    <Form.Text className="text-muted">
                                        Main heading displayed in the section
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.why_large_title?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            {/* Bg image */}
                            <Col md={12}>
                                <Form.Label className="fw-semibold">
                                    Background Image
                                </Form.Label>
                                <div className="d-flex align-items-start gap-3">
                                    <img
                                        src={
                                            bgImageUrl
                                                ? `${bgImageUrl}?v=${bgPreviewVersion}`
                                                : undefined
                                        }
                                        alt="Why Choose Us background"
                                        style={{
                                            width: 160,
                                            height: 90,
                                            objectFit: 'cover',
                                            borderRadius: 6,
                                            border: '1px solid #dee2e6',
                                            flexShrink: 0,
                                        }}
                                    />
                                    <div>
                                        <input
                                            ref={bgFileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="d-none"
                                            onChange={handleBgImageChange}
                                        />
                                        <Button
                                            variant="outline-primary"
                                            type="button"
                                            disabled={
                                                uploadBgMutation.isPending
                                            }
                                            onClick={() =>
                                                bgFileInputRef.current?.click()
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

                        {/* Cards */}
                        <Form.Label className="fw-semibold">Cards</Form.Label>
                        <div className="d-flex flex-column gap-3 mb-3">
                            {cards.map((card, index) => (
                                <div
                                    key={index}
                                    className="border rounded p-3 position-relative"
                                    style={{ background: '#f8f9fa' }}
                                >
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        type="button"
                                        className="position-absolute"
                                        style={{ top: 10, right: 10 }}
                                        onClick={() => removeCard(index)}
                                    >
                                        Remove
                                    </Button>

                                    <Row className="g-2">
                                        {/* Icon preview + picker */}
                                        <Col md={12} className="mb-1">
                                            <Form.Label className="small text-muted">
                                                Icon
                                            </Form.Label>
                                            <div className="d-flex align-items-center gap-3">
                                                <img
                                                    src={toAbsoluteAssetPath(
                                                        card.image_url
                                                    )}
                                                    alt="card icon"
                                                    style={{
                                                        width: 48,
                                                        height: 48,
                                                        objectFit: 'contain',
                                                        border: '1px solid #dee2e6',
                                                        borderRadius: 6,
                                                        background: '#fff',
                                                        padding: 4,
                                                    }}
                                                />
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    type="button"
                                                    onClick={() =>
                                                        openPicker(index)
                                                    }
                                                >
                                                    Change Icon
                                                </Button>
                                            </div>
                                        </Col>

                                        {/* Title */}
                                        <Col md={5}>
                                            <Form.Group>
                                                <Form.Label className="small text-muted">
                                                    Title
                                                </Form.Label>
                                                <Form.Control
                                                    size="sm"
                                                    value={card.title}
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

                                        {/* Description */}
                                        <Col md={7}>
                                            <Form.Group>
                                                <Form.Label className="small text-muted">
                                                    Description
                                                </Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    size="sm"
                                                    rows={2}
                                                    value={card.description}
                                                    onChange={e =>
                                                        updateCard(
                                                            index,
                                                            'description',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Card description"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </div>
                            ))}
                        </div>

                        <Button
                            variant="outline-secondary"
                            type="button"
                            size="sm"
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
        </>
    );
}

/* Chauffeur Section Card */

function ChauffeurSectionCard({
    initialData,
}: {
    initialData: HomepageSettingsData;
}) {
    const updateMutation = useUpdateHomepageSettings();
    const uploadMutation = useUploadChauffeurImage();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<HomepageSettingsData>({ defaultValues: initialData });

    const [enabled, setEnabled] = useState(
        initialData.show_chauffeur_section ?? true
    );
    const [visibility, setVisibility] = useState<
        'all' | 'desktop_only' | 'mobile_only'
    >(initialData.chauffeur_visibility ?? 'all');
    const [chauffeurImageUrl, setChauffeurImageUrl] = useState<
        string | null | undefined
    >(initialData.chauffeur_image_url);
    const [previewVersion, setPreviewVersion] = useState(Date.now());
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        reset(initialData);
        setEnabled(initialData.show_chauffeur_section ?? true);
        setVisibility(initialData.chauffeur_visibility ?? 'all');
        setChauffeurImageUrl(initialData.chauffeur_image_url);
    }, [initialData, reset]);

    const onSubmit = (data: HomepageSettingsData) => {
        updateMutation.mutate(
            {
                chauffeur_title: data.chauffeur_title,
                chauffeur_large_title: data.chauffeur_large_title,
                chauffeur_cta_text: data.chauffeur_cta_text,
                chauffeur_cta_url: data.chauffeur_cta_url,
                show_chauffeur_section: enabled,
                chauffeur_visibility: visibility,
            },
            { onError: error => applyServerErrors(error, setError) }
        );
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        uploadMutation.mutate(file, {
            onSuccess: res => {
                setChauffeurImageUrl(res?.data?.chauffeur_image_url ?? null);
                setPreviewVersion(Date.now());
            },
        });
        e.target.value = '';
    };

    return (
        <Card className="mb-4">
            <Card.Header>
                <strong>Chauffeur Services</strong>
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    {/* Toggle + Visibility */}
                    <Row className="g-3 mb-3">
                        <Col md={6}>
                            <Form.Check
                                type="switch"
                                id="show-chauffeur-section"
                                label="Show this section on the homepage"
                                checked={enabled}
                                onChange={e => setEnabled(e.target.checked)}
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Visibility</Form.Label>
                                <Form.Select
                                    value={visibility}
                                    onChange={e =>
                                        setVisibility(
                                            e.target.value as
                                                | 'all'
                                                | 'desktop_only'
                                                | 'mobile_only'
                                        )
                                    }
                                >
                                    <option value="all">All devices</option>
                                    <option value="desktop_only">
                                        Desktop only
                                    </option>
                                    <option value="mobile_only">
                                        Mobile only
                                    </option>
                                </Form.Select>
                                <Form.Text className="text-muted">
                                    Control which devices show this section
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="g-3">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Section Title</Form.Label>
                                <Form.Control
                                    {...register('chauffeur_title')}
                                    placeholder="Car Brands"
                                    isInvalid={!!errors.chauffeur_title}
                                />
                                <Form.Text className="text-muted">
                                    Small label above the heading
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    {errors.chauffeur_title?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        <Col md={8}>
                            <Form.Group>
                                <Form.Label>Large Title</Form.Label>
                                <Form.Control
                                    {...register('chauffeur_large_title')}
                                    placeholder="Explore Our Premium Brands"
                                    isInvalid={!!errors.chauffeur_large_title}
                                />
                                <Form.Text className="text-muted">
                                    Main heading displayed in the section
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    {errors.chauffeur_large_title?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Button Text</Form.Label>
                                <Form.Control
                                    {...register('chauffeur_cta_text')}
                                    placeholder="View All Brands"
                                    isInvalid={!!errors.chauffeur_cta_text}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.chauffeur_cta_text?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Button URL</Form.Label>
                                <Form.Control
                                    {...register('chauffeur_cta_url')}
                                    placeholder="/fleet"
                                    isInvalid={!!errors.chauffeur_cta_url}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.chauffeur_cta_url?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        <Col md={12}>
                            <Form.Label className="fw-semibold">
                                Section Image
                            </Form.Label>
                            <div className="d-flex align-items-start gap-3">
                                <img
                                    src={
                                        chauffeurImageUrl
                                            ? `${chauffeurImageUrl}?v=${previewVersion}`
                                            : undefined
                                    }
                                    alt="Chauffeur section"
                                    style={{
                                        width: 160,
                                        height: 90,
                                        objectFit: 'cover',
                                        borderRadius: 6,
                                        border: '1px solid #dee2e6',
                                        flexShrink: 0,
                                    }}
                                />
                                <div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="d-none"
                                        onChange={handleImageChange}
                                    />
                                    <Button
                                        variant="outline-primary"
                                        type="button"
                                        disabled={uploadMutation.isPending}
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
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

/* Pickup Process Section Card */

function PickupProcessSectionCard({
    initialData,
}: {
    initialData: HomepageSettingsData;
}) {
    const updateMutation = useUpdateHomepageSettings();
    const uploadBgMutation = useUploadPickupProcessBgImage();
    const uploadBottomMutation = useUploadPickupProcessBottomImage();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<HomepageSettingsData>({ defaultValues: initialData });

    const [enabled, setEnabled] = useState(
        initialData.show_pickup_process_section ?? true
    );
    const [visibility, setVisibility] = useState<
        'all' | 'desktop_only' | 'mobile_only'
    >(initialData.pickup_process_visibility ?? 'all');
    const [steps, setSteps] = useState<ProcessStep[]>(
        (initialData.pickup_process_steps as ProcessStep[] | undefined) ??
            DEFAULT_PROCESS_STEPS
    );
    const [bgImageUrl, setBgImageUrl] = useState<string | null | undefined>(
        initialData.pickup_process_bg_image_url
    );
    const [bottomImageUrl, setBottomImageUrl] = useState<
        string | null | undefined
    >(initialData.pickup_process_bottom_image_url);
    const [bgPreviewVersion, setBgPreviewVersion] = useState(Date.now());
    const [bottomPreviewVersion, setBottomPreviewVersion] = useState(
        Date.now()
    );
    const bgFileInputRef = useRef<HTMLInputElement>(null);
    const bottomFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        reset(initialData);
        setEnabled(initialData.show_pickup_process_section ?? true);
        setVisibility(initialData.pickup_process_visibility ?? 'all');
        setSteps(
            (initialData.pickup_process_steps as ProcessStep[] | undefined) ??
                DEFAULT_PROCESS_STEPS
        );
        setBgImageUrl(initialData.pickup_process_bg_image_url);
        setBottomImageUrl(initialData.pickup_process_bottom_image_url);
    }, [initialData, reset]);

    const updateStep = (
        index: number,
        field: keyof ProcessStep,
        value: string
    ) => {
        setSteps(prev =>
            prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
        );
    };

    const removeStep = (index: number) => {
        setSteps(prev => prev.filter((_, i) => i !== index));
    };

    const addStep = () => {
        setSteps(prev => [...prev, { number: '', title: '', description: '' }]);
    };

    const handleBgImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        uploadBgMutation.mutate(file, {
            onSuccess: res => {
                setBgImageUrl(res?.data?.pickup_process_bg_image_url ?? null);
                setBgPreviewVersion(Date.now());
            },
        });
        e.target.value = '';
    };

    const handleBottomImageChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        uploadBottomMutation.mutate(file, {
            onSuccess: res => {
                setBottomImageUrl(
                    res?.data?.pickup_process_bottom_image_url ?? null
                );
                setBottomPreviewVersion(Date.now());
            },
        });
        e.target.value = '';
    };

    const onSubmit = (data: HomepageSettingsData) => {
        updateMutation.mutate(
            {
                show_pickup_process_section: enabled,
                pickup_process_visibility: visibility,
                pickup_process_title: data.pickup_process_title,
                pickup_process_large_title: data.pickup_process_large_title,
                pickup_process_steps: steps,
            },
            { onError: error => applyServerErrors(error, setError) }
        );
    };

    return (
        <Card className="mb-4">
            <Card.Header>
                <strong>Pickup Process Section</strong>
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    {/* Toggle + Visibility */}
                    <Row className="g-3 mb-3">
                        <Col md={6}>
                            <Form.Check
                                type="switch"
                                id="show-pickup-process-section"
                                label="Show this section on the homepage"
                                checked={enabled}
                                onChange={e => setEnabled(e.target.checked)}
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Visibility</Form.Label>
                                <Form.Select
                                    value={visibility}
                                    onChange={e =>
                                        setVisibility(
                                            e.target.value as
                                                | 'all'
                                                | 'desktop_only'
                                                | 'mobile_only'
                                        )
                                    }
                                >
                                    <option value="all">All devices</option>
                                    <option value="desktop_only">
                                        Desktop only
                                    </option>
                                    <option value="mobile_only">
                                        Mobile only
                                    </option>
                                </Form.Select>
                                <Form.Text className="text-muted">
                                    Control which devices show this section
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="g-3 mb-3">
                        {/* Section title */}
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Section Title</Form.Label>
                                <Form.Control
                                    {...register('pickup_process_title')}
                                    placeholder="How it Work"
                                    isInvalid={!!errors.pickup_process_title}
                                />
                                <Form.Text className="text-muted">
                                    Small label above the heading
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    {errors.pickup_process_title?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        {/* Large title */}
                        <Col md={8}>
                            <Form.Group>
                                <Form.Label>Large Title</Form.Label>
                                <Form.Control
                                    {...register('pickup_process_large_title')}
                                    placeholder="Following Working Steps"
                                    isInvalid={
                                        !!errors.pickup_process_large_title
                                    }
                                />
                                <Form.Text className="text-muted">
                                    Main heading displayed in the section
                                </Form.Text>
                                <Form.Control.Feedback type="invalid">
                                    {errors.pickup_process_large_title?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        {/* BG image */}
                        <Col md={6}>
                            <Form.Label className="fw-semibold">
                                Background Image
                            </Form.Label>
                            <div className="d-flex align-items-start gap-3">
                                <img
                                    src={
                                        bgImageUrl
                                            ? `${bgImageUrl}?v=${bgPreviewVersion}`
                                            : `/assets/images/step-bg.jpg?v=${bgPreviewVersion}`
                                    }
                                    alt="Pickup process background"
                                    style={{
                                        width: 160,
                                        height: 90,
                                        objectFit: 'cover',
                                        borderRadius: 6,
                                        border: '1px solid #dee2e6',
                                        flexShrink: 0,
                                    }}
                                />
                                <div>
                                    <input
                                        ref={bgFileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="d-none"
                                        onChange={handleBgImageChange}
                                    />
                                    <Button
                                        variant="outline-primary"
                                        type="button"
                                        disabled={uploadBgMutation.isPending}
                                        onClick={() =>
                                            bgFileInputRef.current?.click()
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

                        {/* Bottom image */}
                        <Col md={6}>
                            <Form.Label className="fw-semibold">
                                Bottom Image
                            </Form.Label>
                            <div className="d-flex align-items-start gap-3">
                                <img
                                    src={
                                        bottomImageUrl
                                            ? `${bottomImageUrl}?v=${bottomPreviewVersion}`
                                            : `/assets/images/adv-car.png?v=${bottomPreviewVersion}`
                                    }
                                    alt="Pickup process bottom"
                                    style={{
                                        width: 160,
                                        height: 90,
                                        objectFit: 'cover',
                                        borderRadius: 6,
                                        border: '1px solid #dee2e6',
                                        flexShrink: 0,
                                    }}
                                />
                                <div>
                                    <input
                                        ref={bottomFileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="d-none"
                                        onChange={handleBottomImageChange}
                                    />
                                    <Button
                                        variant="outline-primary"
                                        type="button"
                                        disabled={
                                            uploadBottomMutation.isPending
                                        }
                                        onClick={() =>
                                            bottomFileInputRef.current?.click()
                                        }
                                    >
                                        {uploadBottomMutation.isPending ? (
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

                    {/* Steps */}
                    <Form.Label className="fw-semibold">
                        Process Steps
                    </Form.Label>
                    <div className="d-flex flex-column gap-3 mb-3">
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className="border rounded p-3 position-relative"
                                style={{ background: '#f8f9fa' }}
                            >
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    type="button"
                                    className="position-absolute"
                                    style={{ top: 10, right: 10 }}
                                    onClick={() => removeStep(index)}
                                >
                                    Remove
                                </Button>

                                <Row className="g-2">
                                    <Col md={2}>
                                        <Form.Group>
                                            <Form.Label className="small text-muted">
                                                Number
                                            </Form.Label>
                                            <Form.Control
                                                size="sm"
                                                value={step.number}
                                                onChange={e =>
                                                    updateStep(
                                                        index,
                                                        'number',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="01"
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label className="small text-muted">
                                                Title
                                            </Form.Label>
                                            <Form.Control
                                                size="sm"
                                                value={step.title}
                                                onChange={e =>
                                                    updateStep(
                                                        index,
                                                        'title',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Step title"
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="small text-muted">
                                                Description
                                            </Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                size="sm"
                                                rows={2}
                                                value={step.description}
                                                onChange={e =>
                                                    updateStep(
                                                        index,
                                                        'description',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Step description"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </div>
                        ))}
                    </div>

                    <Button
                        variant="outline-secondary"
                        type="button"
                        size="sm"
                        className="mb-4"
                        onClick={addStep}
                    >
                        + Add Step
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

export default function HomepageContent() {
    const title = useTitle('Homepage Content');
    const { data: res, isLoading } = useHomepageSettings();

    if (isLoading) {
        return <SettingsFormSkeleton cards={2} />;
    }

    const data = res?.data ?? {};

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>Homepage Content</h4>
                <p className="text-muted mb-0">
                    Manage each section of the homepage independently.
                </p>
            </div>

            <HeroCard initialData={data} />
            <HeroVehicleBadgeCard initialData={data} />
            <CategoriesCard initialData={data} />
            <FeaturedCard initialData={data} />
            <AboutSectionCard initialData={data} />
            <WhyChooseUsCard initialData={data} />
            <ChauffeurSectionCard initialData={data} />
            <PickupProcessSectionCard initialData={data} />
            <CounterSectionCard initialData={data} />
            <TestimonialSectionCard initialData={data} />
            <FeaturesCard initialData={data} />
        </div>
    );
}
