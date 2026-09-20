import { useEffect, useState } from 'react';
import { Card, Form, Row, Col, Button } from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useForm } from 'react-hook-form';
import { applyServerErrors } from '@/shared/libs/utils';
import type {
    FooterSettingsData,
    FooterOpeningHourItem,
    FooterQuickLinkItem,
} from '@/shared/types';
import {
    useFooterSettings,
    useUpdateFooterSettings,
} from '@/shared/hooks/queries/useSettings';
import { PermisssionGuard } from '@/shared/components/common/PermissionGuard';
import { PERMISSIONS } from '@/shared/config/permissions';
import { useTitle } from '@/shared/hooks';

const DEFAULT_OPENING_HOURS: FooterOpeningHourItem[] = [
    { days: 'Monday - Friday', time: '09:00 AM - 09:00 PM' },
    { days: 'Saturday', time: '09:00 AM - 07:00 PM' },
    { days: 'Sunday', time: 'Closed' },
];

const DEFAULT_QUICK_LINKS: FooterQuickLinkItem[] = [
    { name: 'About Us', url: '/about' },
    { name: "FAQ's", url: '/faqs' },
    { name: 'Services', url: '/services' },
    { name: 'Team', url: '/team' },
    { name: 'Contact', url: '/contact' },
];

export default function FooterContent() {
    const title = useTitle('Footer Content');
    const { data: res, isLoading } = useFooterSettings();
    const updateMutation = useUpdateFooterSettings();
    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<FooterSettingsData>();

    const [socialsEnabled, setSocialsEnabled] = useState(true);
    const [legalEnabled, setLegalEnabled] = useState(true);
    const [openingHours, setOpeningHours] = useState<FooterOpeningHourItem[]>(
        DEFAULT_OPENING_HOURS
    );
    const [quickLinks, setQuickLinks] =
        useState<FooterQuickLinkItem[]>(DEFAULT_QUICK_LINKS);

    useEffect(() => {
        if (res?.data) {
            reset(res.data);
            setSocialsEnabled(res.data.footer_socials_enabled ?? true);
            setLegalEnabled(res.data.footer_legal_enabled ?? true);
            setOpeningHours(res.data.opening_hours ?? DEFAULT_OPENING_HOURS);
            setQuickLinks(res.data.quick_links ?? DEFAULT_QUICK_LINKS);
        }
    }, [res, reset]);

    const updateOpeningHour = (
        index: number,
        field: keyof FooterOpeningHourItem,
        value: string
    ) => {
        setOpeningHours(prev =>
            prev.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        );
    };

    const addOpeningHour = () =>
        setOpeningHours(prev => [...prev, { days: '', time: '' }]);
    const removeOpeningHour = (index: number) =>
        setOpeningHours(prev => prev.filter((_, i) => i !== index));

    const updateQuickLink = (
        index: number,
        field: keyof FooterQuickLinkItem,
        value: string
    ) => {
        setQuickLinks(prev =>
            prev.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        );
    };

    const addQuickLink = () =>
        setQuickLinks(prev => [...prev, { name: '', url: '' }]);
    const removeQuickLink = (index: number) =>
        setQuickLinks(prev => prev.filter((_, i) => i !== index));

    const onSubmit = (data: FooterSettingsData) => {
        updateMutation.mutate(
            {
                ...data,
                footer_socials_enabled: socialsEnabled,
                footer_legal_enabled: legalEnabled,
                opening_hours: openingHours,
                quick_links: quickLinks,
            },
            { onError: error => applyServerErrors(error, setError) }
        );
    };

    if (isLoading) {
        return <SettingsFormSkeleton cards={2} />;
    }

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>Footer Content</h4>
                <p className="text-muted mb-0">
                    Tagline, copyright text, opening hours, quick links, and
                    social icon visibility.
                </p>
            </div>

            <Card>
                <Card.Body>
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <Row className="g-3">
                            {/* Tagline & Copyright */}
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
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Copyright Text</Form.Label>
                                    <Form.Control
                                        {...register('copyright')}
                                        placeholder="© 2025 Swiftflitz. All rights reserved."
                                        isInvalid={!!errors.copyright}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.copyright?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            {/* Opening Hours */}
                            <Col md={12}>
                                <hr />
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <strong>Opening Hours</strong>
                                </div>
                                <Row className="g-2 mb-2">
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label>
                                                Section Title
                                            </Form.Label>
                                            <Form.Control
                                                {...register(
                                                    'opening_hours_title'
                                                )}
                                                placeholder="Opening Hours"
                                                isInvalid={
                                                    !!errors.opening_hours_title
                                                }
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {
                                                    errors.opening_hours_title
                                                        ?.message
                                                }
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <div className="d-flex flex-column gap-2">
                                    {openingHours.map((item, index) => (
                                        <div
                                            key={index}
                                            className="d-flex align-items-center gap-2 p-2 border rounded"
                                            style={{ background: '#f8f9fa' }}
                                        >
                                            <Form.Control
                                                size="sm"
                                                placeholder="Days (e.g. Monday - Friday)"
                                                value={item.days}
                                                onChange={e =>
                                                    updateOpeningHour(
                                                        index,
                                                        'days',
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            <Form.Control
                                                size="sm"
                                                placeholder="Time (e.g. 09:00 AM - 09:00 PM)"
                                                value={item.time}
                                                onChange={e =>
                                                    updateOpeningHour(
                                                        index,
                                                        'time',
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                type="button"
                                                onClick={() =>
                                                    removeOpeningHour(index)
                                                }
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
                                    onClick={addOpeningHour}
                                >
                                    + Add Row
                                </Button>
                            </Col>

                            {/* Quick Links */}
                            <Col md={12}>
                                <hr />
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <strong>Quick Links</strong>
                                </div>
                                <Row className="g-2 mb-2">
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label>
                                                Section Title
                                            </Form.Label>
                                            <Form.Control
                                                {...register(
                                                    'quick_links_title'
                                                )}
                                                placeholder="Quick Links"
                                                isInvalid={
                                                    !!errors.quick_links_title
                                                }
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {
                                                    errors.quick_links_title
                                                        ?.message
                                                }
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <div className="d-flex flex-column gap-2">
                                    {quickLinks.map((item, index) => (
                                        <div
                                            key={index}
                                            className="d-flex align-items-center gap-2 p-2 border rounded"
                                            style={{ background: '#f8f9fa' }}
                                        >
                                            <Form.Control
                                                size="sm"
                                                placeholder="Link name (e.g. About Us)"
                                                value={item.name}
                                                onChange={e =>
                                                    updateQuickLink(
                                                        index,
                                                        'name',
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            <Form.Control
                                                size="sm"
                                                placeholder="URL (e.g. /about)"
                                                value={item.url}
                                                onChange={e =>
                                                    updateQuickLink(
                                                        index,
                                                        'url',
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                type="button"
                                                onClick={() =>
                                                    removeQuickLink(index)
                                                }
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
                                    onClick={addQuickLink}
                                >
                                    + Add Link
                                </Button>
                            </Col>

                            {/* Legal Block */}
                            <Col md={12}>
                                <hr />
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <strong>Legal / Policy Block</strong>
                                    <Form.Check
                                        type="switch"
                                        id="footer-legal-enabled"
                                        label="Show in footer"
                                        checked={legalEnabled}
                                        onChange={e =>
                                            setLegalEnabled(e.target.checked)
                                        }
                                    />
                                </div>
                                {legalEnabled && (
                                    <Row className="g-2">
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>
                                                    Section Title
                                                </Form.Label>
                                                <Form.Control
                                                    {...register(
                                                        'footer_legal_title'
                                                    )}
                                                    placeholder="Legal"
                                                    isInvalid={
                                                        !!errors.footer_legal_title
                                                    }
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {
                                                        errors
                                                            .footer_legal_title
                                                            ?.message
                                                    }
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                        <Col md={12}>
                                            <div
                                                className="p-3 border rounded"
                                                style={{
                                                    background: '#f8f9fa',
                                                }}
                                            >
                                                <Form.Text className="text-muted">
                                                    This block always shows{' '}
                                                    <strong>
                                                        Terms &amp; Conditions
                                                    </strong>{' '}
                                                    and{' '}
                                                    <strong>
                                                        Privacy Policy
                                                    </strong>{' '}
                                                    links automatically.
                                                </Form.Text>
                                            </div>
                                        </Col>
                                    </Row>
                                )}
                            </Col>

                            {/* Social Icons */}
                            <Col md={12}>
                                <hr />
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <strong>Social Icons</strong>
                                    <Form.Check
                                        type="switch"
                                        id="footer-socials-enabled"
                                        label="Show social icons in footer"
                                        checked={socialsEnabled}
                                        onChange={e =>
                                            setSocialsEnabled(e.target.checked)
                                        }
                                    />
                                </div>
                                <div
                                    className="p-3 border rounded"
                                    style={{ background: '#f8f9fa' }}
                                >
                                    <Form.Text className="text-muted">
                                        Social icons are pulled from the{' '}
                                        <strong>Contact Page</strong> settings.
                                        To add, remove, or edit them, go to{' '}
                                        <strong>
                                            Content → Contact Page → Contact Us
                                            Section → Socials
                                        </strong>
                                        .
                                    </Form.Text>
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
