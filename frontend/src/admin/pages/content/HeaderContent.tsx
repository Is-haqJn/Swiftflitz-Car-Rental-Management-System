import { useEffect } from 'react';
import { Card, Form, Row, Col, Button } from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useForm } from 'react-hook-form';
import { applyServerErrors } from '@/shared/libs/utils';
import type { HeaderSettingsData } from '@/shared/types';
import {
    useHeaderSettings,
    useUpdateHeaderSettings,
} from '@/shared/hooks/queries/useSettings';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';
import { useTitle } from '@/shared/hooks';

export default function HeaderContent() {
    const title = useTitle('Header Content');
    const { data: res, isLoading } = useHeaderSettings();
    const updateMutation = useUpdateHeaderSettings();
    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<HeaderSettingsData>();

    useEffect(() => {
        if (res?.data) reset(res.data);
    }, [res, reset]);

    const onSubmit = (data: HeaderSettingsData) => {
        updateMutation.mutate(data, {
            onError: error => applyServerErrors(error, setError),
        });
    };

    if (isLoading) {
        return <SettingsFormSkeleton cards={2} />;
    }

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>Header Content</h4>
                <p className="text-muted mb-0">
                    Logo, tagline, contact info, and call-to-action for the site
                    header.
                </p>
            </div>

            <Card>
                <Card.Body>
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Logo URL</Form.Label>
                                    <Form.Control
                                        {...register('logo_url')}
                                        placeholder="https://..."
                                        isInvalid={!!errors.logo_url}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.logo_url?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Tagline</Form.Label>
                                    <Form.Control
                                        {...register('tagline')}
                                        placeholder="Your trusted car rental partner"
                                        isInvalid={!!errors.tagline}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.tagline?.message}
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
                                    <Form.Label>CTA Button Text</Form.Label>
                                    <Form.Control
                                        {...register('cta_text')}
                                        placeholder="Book Now"
                                        isInvalid={!!errors.cta_text}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.cta_text?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>CTA Button URL</Form.Label>
                                    <Form.Control
                                        {...register('cta_url')}
                                        placeholder="/vehicles"
                                        isInvalid={!!errors.cta_url}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.cta_url?.message}
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
