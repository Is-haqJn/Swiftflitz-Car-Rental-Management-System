import { useEffect } from 'react';
import { Card, Form, Row, Col, Button } from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useForm } from 'react-hook-form';
import { applyServerErrors } from '@/shared/libs/utils';
import type { SeoSettingsData } from '@/shared/types';
import {
    useSeoSettings,
    useUpdateSeoSettings,
} from '@/shared/hooks/queries/useSettings';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';
import { useTitle } from '@/shared/hooks';

export default function SeoSettings() {
    const title = useTitle('SEO Settings');
    const { data: res, isLoading } = useSeoSettings();
    const updateMutation = useUpdateSeoSettings();
    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<SeoSettingsData>();

    useEffect(() => {
        if (res?.data) reset(res.data);
    }, [res, reset]);

    const onSubmit = (data: SeoSettingsData) => {
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
                <h4>SEO Settings</h4>
                <p className="text-muted mb-0">
                    Meta tags, Open Graph, and analytics integration.
                </p>
            </div>

            <Card>
                <Card.Body>
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Meta Title</Form.Label>
                                    <Form.Control
                                        {...register('meta_title')}
                                        placeholder="My Car Rental - Best Rates in Ghana"
                                        isInvalid={!!errors.meta_title}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.meta_title?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Meta Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        {...register('meta_description')}
                                        placeholder="Affordable car rentals in Ghana..."
                                        isInvalid={!!errors.meta_description}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.meta_description?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Meta Keywords</Form.Label>
                                    <Form.Control
                                        {...register('meta_keywords')}
                                        placeholder="car rental, ghana, affordable, vehicle hire"
                                        isInvalid={!!errors.meta_keywords}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.meta_keywords?.message}
                                    </Form.Control.Feedback>
                                    <Form.Text className="text-muted">
                                        Comma-separated keywords
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>OG Image URL</Form.Label>
                                    <Form.Control
                                        {...register('og_image')}
                                        placeholder="https://..."
                                        isInvalid={!!errors.og_image}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.og_image?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Google Analytics ID</Form.Label>
                                    <Form.Control
                                        {...register('google_analytics_id')}
                                        placeholder="G-XXXXXXXXXX"
                                        isInvalid={!!errors.google_analytics_id}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.google_analytics_id?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>
                                        Google Tag Manager ID
                                    </Form.Label>
                                    <Form.Control
                                        {...register('google_tag_manager_id')}
                                        placeholder="GTM-XXXXXXX"
                                        isInvalid={
                                            !!errors.google_tag_manager_id
                                        }
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.google_tag_manager_id?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Facebook Pixel ID</Form.Label>
                                    <Form.Control
                                        {...register('facebook_pixel_id')}
                                        placeholder="1234567890"
                                        isInvalid={!!errors.facebook_pixel_id}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.facebook_pixel_id?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Robots</Form.Label>
                                    <Form.Select {...register('robots')}>
                                        <option value="index, follow">
                                            index, follow (default)
                                        </option>
                                        <option value="noindex, nofollow">
                                            noindex, nofollow
                                        </option>
                                        <option value="index, nofollow">
                                            index, nofollow
                                        </option>
                                        <option value="noindex, follow">
                                            noindex, follow
                                        </option>
                                    </Form.Select>
                                    <Form.Text className="text-muted">
                                        Controls how search engines index this
                                        site.
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="d-flex justify-content-end mt-4">
                            <PermisssionGuard
                                permission={PERMISSIONS.SETTINGS.EDIT_SEO}
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
        </div>
    );
}
