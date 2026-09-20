import { useEffect, useRef, useState } from 'react';
import { Card, Form, Row, Col, Button, InputGroup } from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { applyServerErrors } from '@/shared/libs/utils';
import type { GeneralSettingsData } from '@/shared/types';
import {
    useGeneralSettings,
    useUpdateGeneralSettings,
    settingsKeys,
} from '@/shared/hooks/queries/useSettings';
import { useTusMultiUpload } from '@/shared/hooks/useTusMultiUpload';
import TusUploadToast from '@/shared/components/ui/TusUploadToast';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';
import { useTitle } from '@/shared/hooks';

export default function GeneralSettings() {
    const title = useTitle('General Settings');
    const { data: res, isLoading } = useGeneralSettings();
    const updateMutation = useUpdateGeneralSettings();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const {
        register,
        handleSubmit,
        reset,
        setError,
        setValue,
        watch,
        formState: { errors },
    } = useForm<GeneralSettingsData>();

    const [copied, setCopied] = useState(false);

    const maintenanceMode = watch('maintenance_mode') ?? false;
    const bypassToken = watch('maintenance_bypass_token');
    const bypassUrl = bypassToken
        ? `${window.location.origin}/?bypass=${bypassToken}&ref=maintenance`
        : null;

    const handleCopyBypass = () => {
        if (!bypassUrl) return;
        navigator.clipboard.writeText(bypassUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const primaryColor = watch('primary_color') ?? '#000000';
    const secondaryColor = watch('secondary_color') ?? '#000000';
    const secondaryColor2 = watch('secondary_color_2') ?? '#000000';
    const tertiaryColor = watch('tertiary_color') ?? '#000000';

    useEffect(() => {
        if (res?.data) {
            reset(res.data);
            setImagePreview(res.data.site_image_url ?? null);
        }
    }, [res, reset]);

    const tus = useTusMultiUpload({
        endpoint: '/api/v1/uploads/tus',
        entityType: 'site_image',
        extraMetadata: {},
    });

    // Auto-refresh settings after image upload completes
    useEffect(() => {
        if (!tus.allSucceeded || tus.files.length === 0) return;

        queryClient.invalidateQueries({ queryKey: settingsKeys.general });
        if (imagePreview?.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(null);
        tus.clearAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tus.allSucceeded]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (imagePreview?.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview);
        }

        const preview = URL.createObjectURL(file);
        setImagePreview(preview);
        tus.addFiles([file]);
        tus.startAll();
        e.target.value = '';
    };

    const onSubmit = (data: GeneralSettingsData) => {
        updateMutation.mutate(data, {
            onError: error => applyServerErrors(error, setError),
        });
    };

    if (isLoading) {
        return <SettingsFormSkeleton />;
    }

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>General Settings</h4>
                <p className="text-muted mb-0">
                    Site name, contact, currency, timezone, branding colours,
                    and site image.
                </p>
            </div>

            <Card>
                <Card.Body>
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Site Name</Form.Label>
                                    <Form.Control
                                        {...register('site_name')}
                                        isInvalid={!!errors.site_name}
                                        placeholder="My Car Rental"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.site_name?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Tagline</Form.Label>
                                    <Form.Control
                                        {...register('site_tagline')}
                                        isInvalid={!!errors.site_tagline}
                                        placeholder="Drive with confidence"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.site_tagline?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Site Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        {...register('site_email')}
                                        isInvalid={!!errors.site_email}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.site_email?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Site Phone</Form.Label>
                                    <Form.Control
                                        {...register('site_phone')}
                                        isInvalid={!!errors.site_phone}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.site_phone?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Address</Form.Label>
                                    <Form.Control
                                        {...register('site_address')}
                                        isInvalid={!!errors.site_address}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.site_address?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Currency Code</Form.Label>
                                    <Form.Control
                                        {...register('currency')}
                                        isInvalid={!!errors.currency}
                                        placeholder="GHS"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.currency?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Currency Symbol</Form.Label>
                                    <Form.Control
                                        {...register('currency_symbol')}
                                        isInvalid={!!errors.currency_symbol}
                                        placeholder="₵"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.currency_symbol?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Timezone</Form.Label>
                                    <Form.Control
                                        {...register('timezone')}
                                        isInvalid={!!errors.timezone}
                                        placeholder="Africa/Accra"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.timezone?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            {/* Branding Colours */}
                            <Col md={12}>
                                <hr className="my-1" />
                                <p className="fw-semibold mb-3">
                                    Branding Colours
                                </p>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Primary Color</Form.Label>
                                    <div className="d-flex align-items-center gap-2">
                                        <input
                                            type="color"
                                            value={primaryColor}
                                            onChange={e =>
                                                setValue(
                                                    'primary_color',
                                                    e.target.value
                                                )
                                            }
                                            style={{
                                                width: 44,
                                                height: 38,
                                                padding: 2,
                                                border: '1px solid #ced4da',
                                                borderRadius: 6,
                                                cursor: 'pointer',
                                            }}
                                        />
                                        <Form.Control
                                            {...register('primary_color')}
                                            placeholder="#1d4ed8"
                                            isInvalid={!!errors.primary_color}
                                        />
                                    </div>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.primary_color?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Secondary Color</Form.Label>
                                    <div className="d-flex align-items-center gap-2">
                                        <input
                                            type="color"
                                            value={secondaryColor}
                                            onChange={e =>
                                                setValue(
                                                    'secondary_color',
                                                    e.target.value
                                                )
                                            }
                                            style={{
                                                width: 44,
                                                height: 38,
                                                padding: 2,
                                                border: '1px solid #ced4da',
                                                borderRadius: 6,
                                                cursor: 'pointer',
                                            }}
                                        />
                                        <Form.Control
                                            {...register('secondary_color')}
                                            placeholder="#6366f1"
                                            isInvalid={!!errors.secondary_color}
                                        />
                                    </div>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.secondary_color?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Secondary Color 2</Form.Label>
                                    <div className="d-flex align-items-center gap-2">
                                        <input
                                            type="color"
                                            value={secondaryColor2}
                                            onChange={e =>
                                                setValue(
                                                    'secondary_color_2',
                                                    e.target.value
                                                )
                                            }
                                            style={{
                                                width: 44,
                                                height: 38,
                                                padding: 2,
                                                border: '1px solid #ced4da',
                                                borderRadius: 6,
                                                cursor: 'pointer',
                                            }}
                                        />
                                        <Form.Control
                                            {...register('secondary_color_2')}
                                            placeholder="#8b5cf6"
                                            isInvalid={
                                                !!errors.secondary_color_2
                                            }
                                        />
                                    </div>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.secondary_color_2?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Tertiary Color</Form.Label>
                                    <div className="d-flex align-items-center gap-2">
                                        <input
                                            type="color"
                                            value={tertiaryColor}
                                            onChange={e =>
                                                setValue(
                                                    'tertiary_color',
                                                    e.target.value
                                                )
                                            }
                                            style={{
                                                width: 44,
                                                height: 38,
                                                padding: 2,
                                                border: '1px solid #ced4da',
                                                borderRadius: 6,
                                                cursor: 'pointer',
                                            }}
                                        />
                                        <Form.Control
                                            {...register('tertiary_color')}
                                            placeholder="#f59e0b"
                                            isInvalid={!!errors.tertiary_color}
                                        />
                                    </div>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.tertiary_color?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            {/* Site Image */}
                            <Col md={12}>
                                <hr className="my-1" />
                                <p className="fw-semibold mb-3">Site Image</p>
                            </Col>
                            <Col md={12}>
                                <div className="d-flex align-items-start gap-4">
                                    {/* Preview */}
                                    <div
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        style={{
                                            width: 160,
                                            height: 100,
                                            borderRadius: 8,
                                            border: '2px dashed #d1d5db',
                                            background: '#f9fafb',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Site"
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                        ) : (
                                            <i
                                                className="fa fa-image text-muted"
                                                style={{ fontSize: 32 }}
                                            />
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-muted small mb-2">
                                            Used as a representative site image
                                            (hero section, OG image, etc.).
                                            Accepts JPEG, PNG, or WebP.
                                        </p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="d-none"
                                            onChange={handleImageSelect}
                                        />
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                        >
                                            Choose Image
                                        </Button>
                                    </div>
                                </div>
                            </Col>

                            {/* Maintenance Mode */}
                            <Col md={12}>
                                <hr className="my-1" />
                                <p className="fw-semibold mb-3">
                                    Maintenance Mode
                                </p>
                            </Col>
                            <Col md={12}>
                                <Form.Check
                                    type="switch"
                                    id="maintenance-mode-switch"
                                    label={
                                        maintenanceMode
                                            ? 'Maintenance mode is ON - public site is restricted'
                                            : 'Maintenance mode is OFF'
                                    }
                                    {...register('maintenance_mode')}
                                />
                                <Form.Text className="text-muted">
                                    When enabled, unauthenticated visitors see a
                                    maintenance screen. Logged-in users are
                                    unaffected.
                                </Form.Text>
                            </Col>
                            {maintenanceMode && bypassUrl && (
                                <Col md={12}>
                                    <Form.Label className="small fw-semibold text-muted mb-1">
                                        Bypass Link
                                    </Form.Label>
                                    <InputGroup size="sm">
                                        <Form.Control
                                            readOnly
                                            value={bypassUrl}
                                            className="font-monospace small"
                                        />
                                        <Button
                                            variant={
                                                copied
                                                    ? 'success'
                                                    : 'outline-secondary'
                                            }
                                            onClick={handleCopyBypass}
                                        >
                                            {copied ? 'Copied!' : 'Copy'}
                                        </Button>
                                    </InputGroup>
                                    <Form.Text className="text-muted">
                                        Share this link to grant temporary
                                        access while maintenance is active.
                                    </Form.Text>
                                </Col>
                            )}
                        </Row>

                        <div className="d-flex justify-content-end mt-4">
                            <PermisssionGuard
                                permission={PERMISSIONS.SETTINGS.EDIT_GENERAL}
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
                </Card.Body>
            </Card>

            <TusUploadToast
                files={tus.files}
                onPause={tus.pauseFile}
                onResume={tus.resumeFile}
                onRemove={tus.removeFile}
            />
        </div>
    );
}
