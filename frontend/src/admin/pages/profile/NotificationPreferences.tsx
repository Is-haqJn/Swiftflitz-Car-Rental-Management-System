import { useEffect } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useForm } from 'react-hook-form';
import { applyServerErrors } from '@/shared/libs/utils';
import type { NotificationSettings } from '@/shared/types';
import {
    useNotificationSettings,
    useUpdateNotificationSettings,
} from '@/shared/hooks/queries/useNotifications';
import { useTitle } from '@/shared/hooks';

interface ToggleRowProps {
    label: string;
    description?: string;
    emailKey: keyof NotificationSettings;
    pushKey: keyof NotificationSettings;
    register: ReturnType<typeof useForm<NotificationSettings>>['register'];
}

function ToggleRow({
    label,
    description,
    emailKey,
    pushKey,
    register,
}: ToggleRowProps) {
    return (
        <tr>
            <td>
                <div className="fw-semibold">{label}</div>
                {description && (
                    <small className="text-muted">{description}</small>
                )}
            </td>
            <td>
                <div className="d-flex justify-content-center">
                    <Form.Check
                        type="switch"
                        id={emailKey}
                        {...register(emailKey)}
                    />
                </div>
            </td>
            <td>
                <div className="d-flex justify-content-center">
                    <Form.Check
                        type="switch"
                        id={pushKey}
                        {...register(pushKey)}
                    />
                </div>
            </td>
        </tr>
    );
}

export default function NotificationPreferences() {
    const title = useTitle('Notification Preferences');
    const { data: settingsRes, isLoading } = useNotificationSettings();
    const updateMutation = useUpdateNotificationSettings();

    const { register, handleSubmit, reset, setError } =
        useForm<NotificationSettings>();

    useEffect(() => {
        if (settingsRes?.data) {
            reset(settingsRes.data);
        }
    }, [settingsRes, reset]);

    const onSubmit = (data: NotificationSettings) => {
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
                <h4>Notification Preferences</h4>
                <p className="text-muted mb-0">
                    Manage your personal notification preferences. These
                    settings only affect your account.
                </p>
            </div>

            <Card>
                <Card.Header>
                    <Card.Title>My Notification Preferences</Card.Title>
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <div className="table-responsive">
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th style={{ width: '60%' }}>Event</th>
                                        <th className="tw:text-center!">
                                            Email
                                        </th>
                                        <th className="tw:text-center!">
                                            In-App
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <ToggleRow
                                        label="New Booking"
                                        description="When a new rental is created"
                                        emailKey="email_new_booking"
                                        pushKey="new_booking"
                                        register={register}
                                    />
                                    <ToggleRow
                                        label="Overdue Rental"
                                        description="When a rental becomes overdue"
                                        emailKey="email_overdue_alert"
                                        pushKey="overdue_alert"
                                        register={register}
                                    />
                                    <ToggleRow
                                        label="Return Reminder"
                                        description="Reminder before a rental return date"
                                        emailKey="email_return_reminder"
                                        pushKey="return_reminder"
                                        register={register}
                                    />
                                    <ToggleRow
                                        label="Quote Request"
                                        description="When a customer submits a quote request"
                                        emailKey="email_quote_request"
                                        pushKey="quote_request"
                                        register={register}
                                    />
                                    <ToggleRow
                                        label="Vehicle Expiry"
                                        description="When a vehicle document is expiring"
                                        emailKey="email_vehicle_expiry"
                                        pushKey="vehicle_expiry"
                                        register={register}
                                    />
                                    <ToggleRow
                                        label="Pickup Reminder"
                                        description="Reminder when a rental pickup date is approaching"
                                        emailKey="email_pickup_reminder"
                                        pushKey="pickup_reminder"
                                        register={register}
                                    />
                                    <ToggleRow
                                        label="Rental Status Change"
                                        description="When a rental status changes (confirmed, returned, completed)"
                                        emailKey="email_rental_status_change"
                                        pushKey="rental_status_change"
                                        register={register}
                                    />
                                    <ToggleRow
                                        label="Payment Confirmation"
                                        description="When a payment is recorded on your rental"
                                        emailKey="email_payment_confirmation"
                                        pushKey="payment_confirmation"
                                        register={register}
                                    />
                                    <ToggleRow
                                        label="Document Expiry Alert"
                                        description="When a vehicle or driver document is expiring"
                                        emailKey="email_document_expiry_alert"
                                        pushKey="document_expiry_alert"
                                        register={register}
                                    />
                                </tbody>
                            </table>
                        </div>

                        <div className="d-flex justify-content-end mt-3">
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending
                                    ? 'Saving...'
                                    : 'Save Preferences'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
}
