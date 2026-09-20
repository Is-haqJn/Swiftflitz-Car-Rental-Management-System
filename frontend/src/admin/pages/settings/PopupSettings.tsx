import { useEffect, useRef, useState } from 'react';
import { Card, Form, Row, Col, Button, Badge, Image } from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useForm } from 'react-hook-form';
import { applyServerErrors } from '@/shared/libs/utils';
import type { PopupSettingsData } from '@/shared/types';
import {
    usePopupSettings,
    useUpdatePopupSettings,
    useUploadPromoImage,
} from '@/shared/hooks/queries/useSettings';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';
import { useTitle } from '@/shared/hooks';

export default function PopupSettings() {
    const title = useTitle('Popup Settings');
    const { data: res, isLoading } = usePopupSettings();
    const updateMutation = useUpdatePopupSettings();
    const uploadPromoImageMutation = useUploadPromoImage();
    const promoImageInputRef = useRef<HTMLInputElement>(null);
    const [localPromoUrl, setLocalPromoUrl] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setError,
        watch,
        setValue,
        formState: { errors },
    } = useForm<PopupSettingsData>();

    useEffect(() => {
        if (res?.data) {
            reset(res.data);
        }
    }, [res, reset]);

    const promoImagePreview =
        localPromoUrl ?? res?.data?.promo_image_url ?? null;

    const onSubmit = (data: PopupSettingsData) => {
        updateMutation.mutate(data, {
            onError: error => applyServerErrors(error, setError),
        });
    };

    const handlePromoImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        setLocalPromoUrl(previewUrl);
        uploadPromoImageMutation.mutate(file, {
            onSuccess: data => {
                URL.revokeObjectURL(previewUrl);
                const url = data.data?.promo_image_url ?? null;
                setLocalPromoUrl(url);
                setValue('promo_image_url', url);
            },
            onError: () => {
                URL.revokeObjectURL(previewUrl);
                setLocalPromoUrl(null);
            },
        });
        e.target.value = '';
    };

    if (isLoading) {
        return <SettingsFormSkeleton cards={2} />;
    }

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>Popup Settings</h4>
                <p className="text-muted mb-0">
                    Configure promotional and announcement popups shown on the
                    homepage.
                </p>
            </div>

            <Form onSubmit={handleSubmit(onSubmit)}>
                {/* Promo Popup */}
                <Card className="mb-4">
                    <Card.Header className="d-flex align-items-center gap-2">
                        <strong>Promo Popup</strong>
                        <Badge
                            bg={
                                watch('promo_enabled') ? 'success' : 'secondary'
                            }
                        >
                            {watch('promo_enabled') ? 'Enabled' : 'Disabled'}
                        </Badge>
                    </Card.Header>
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Enable Promo Popup</Form.Label>
                                    <Form.Check
                                        type="switch"
                                        id="promo_enabled"
                                        label="Show promo popup on homepage"
                                        {...register('promo_enabled')}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Frequency</Form.Label>
                                    <Form.Select
                                        {...register('promo_frequency')}
                                    >
                                        <option value="once_per_day">
                                            Once per day
                                        </option>
                                        <option value="always">
                                            On every page load
                                        </option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Delay (seconds)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min={0}
                                        max={30}
                                        {...register('promo_delay_seconds', {
                                            valueAsNumber: true,
                                        })}
                                        isInvalid={!!errors.promo_delay_seconds}
                                    />
                                    <Form.Text className="text-muted">
                                        How many seconds after page load before
                                        the popup appears.
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.promo_delay_seconds?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Discount Code</Form.Label>
                                    <Form.Control
                                        {...register('promo_code')}
                                        placeholder="e.g. SAVE10"
                                        isInvalid={!!errors.promo_code}
                                    />
                                    <Form.Text className="text-muted">
                                        Leave blank to hide the copy code badge.
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.promo_code?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Title</Form.Label>
                                    <Form.Control
                                        {...register('promo_title')}
                                        placeholder="Special Offer"
                                        isInvalid={!!errors.promo_title}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.promo_title?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        {...register('promo_description')}
                                        placeholder="Book now and enjoy exclusive savings on your rental."
                                        isInvalid={!!errors.promo_description}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.promo_description?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Button Label</Form.Label>
                                    <Form.Control
                                        {...register('promo_button_label')}
                                        placeholder="Book Now"
                                        isInvalid={!!errors.promo_button_label}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.promo_button_label?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Button URL</Form.Label>
                                    <Form.Control
                                        {...register('promo_button_url')}
                                        placeholder="/listings"
                                        isInvalid={!!errors.promo_button_url}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.promo_button_url?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>
                                        Promo Image (optional)
                                    </Form.Label>
                                    <div className="d-flex align-items-center gap-3">
                                        {promoImagePreview && (
                                            <Image
                                                src={promoImagePreview}
                                                alt="Promo preview"
                                                style={{
                                                    width: 120,
                                                    height: 80,
                                                    objectFit: 'cover',
                                                    borderRadius: 6,
                                                }}
                                            />
                                        )}
                                        <div>
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={() =>
                                                    promoImageInputRef.current?.click()
                                                }
                                                disabled={
                                                    uploadPromoImageMutation.isPending
                                                }
                                            >
                                                {uploadPromoImageMutation.isPending
                                                    ? 'Uploading...'
                                                    : promoImagePreview
                                                      ? 'Change Image'
                                                      : 'Upload Image'}
                                            </Button>
                                            {promoImagePreview && (
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="text-danger ms-2"
                                                    onClick={() => {
                                                        setLocalPromoUrl(null);
                                                        setValue(
                                                            'promo_image_url',
                                                            null
                                                        );
                                                    }}
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                            <Form.Text className="d-block text-muted mt-1">
                                                Displayed on the right side of
                                                the promo popup.
                                            </Form.Text>
                                        </div>
                                    </div>
                                    <input
                                        ref={promoImageInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="d-none"
                                        onChange={handlePromoImageChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Announcement Popup */}
                <Card className="mb-4">
                    <Card.Header className="d-flex align-items-center gap-2">
                        <strong>Announcement Popup</strong>
                        <Badge
                            bg={
                                watch('announcement_enabled')
                                    ? 'success'
                                    : 'secondary'
                            }
                        >
                            {watch('announcement_enabled')
                                ? 'Enabled'
                                : 'Disabled'}
                        </Badge>
                    </Card.Header>
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>
                                        Enable Announcement Popup
                                    </Form.Label>
                                    <Form.Check
                                        type="switch"
                                        id="announcement_enabled"
                                        label="Show announcement popup on homepage"
                                        {...register('announcement_enabled')}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Frequency</Form.Label>
                                    <Form.Select
                                        {...register('announcement_frequency')}
                                    >
                                        <option value="once_per_day">
                                            Once per day
                                        </option>
                                        <option value="always">
                                            On every page load
                                        </option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Delay (seconds)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min={0}
                                        max={30}
                                        {...register(
                                            'announcement_delay_seconds',
                                            { valueAsNumber: true }
                                        )}
                                        isInvalid={
                                            !!errors.announcement_delay_seconds
                                        }
                                    />
                                    <Form.Text className="text-muted">
                                        How many seconds after page load before
                                        the popup appears.
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {
                                            errors.announcement_delay_seconds
                                                ?.message
                                        }
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Title</Form.Label>
                                    <Form.Control
                                        {...register('announcement_title')}
                                        placeholder="Important Notice"
                                        isInvalid={!!errors.announcement_title}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.announcement_title?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Body</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={4}
                                        {...register('announcement_body')}
                                        placeholder="Your announcement message here..."
                                        isInvalid={!!errors.announcement_body}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.announcement_body?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

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
                                ? 'Saving...'
                                : 'Save Settings'}
                        </Button>
                    </PermisssionGuard>
                </div>
            </Form>
        </div>
    );
}
