import { useEffect } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { SettingsFormSkeleton } from '@adminComponents/skeletons/SettingsFormSkeleton';
import { useTitle } from '@/shared/hooks';
import { useForm } from 'react-hook-form';
import { applyServerErrors } from '@/shared/libs/utils';
import type { NotificationSettings as NotificationSettingsType } from '@/shared/types';
import {
    useNotificationSystemSettings,
    useUpdateNotificationSystemSettings,
    useWhatsAppSettings,
    useSmsSettings,
} from '@/shared/hooks/queries/useSettings';

interface ToggleRowProps {
    label: string;
    description?: string;
    emailKey?: keyof NotificationSettingsType;
    pushKey?: keyof NotificationSettingsType;
    whatsappKey?: keyof NotificationSettingsType;
    smsKey?: keyof NotificationSettingsType;
    register: ReturnType<typeof useForm<NotificationSettingsType>>['register'];
    showWhatsApp: boolean;
    showSms: boolean;
}

function ToggleRow({
    label,
    description,
    emailKey,
    pushKey,
    whatsappKey,
    smsKey,
    register,
    showWhatsApp,
    showSms,
}: ToggleRowProps) {
    return (
        <tr>
            <td>
                <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>
                    {label}
                </div>
                {description && (
                    <small
                        className="text-muted d-block"
                        style={{ fontSize: '0.75rem', lineHeight: 1.3 }}
                    >
                        {description}
                    </small>
                )}
            </td>
            <td className="text-center align-middle">
                {emailKey ? (
                    <Form.Check
                        type="switch"
                        id={emailKey}
                        {...register(emailKey)}
                    />
                ) : (
                    <span className="text-muted">-</span>
                )}
            </td>
            <td className="text-center align-middle">
                {pushKey ? (
                    <Form.Check
                        type="switch"
                        id={pushKey}
                        {...register(pushKey)}
                    />
                ) : (
                    <span className="text-muted">-</span>
                )}
            </td>
            {showWhatsApp && (
                <td className="text-center align-middle">
                    {whatsappKey ? (
                        <Form.Check
                            type="switch"
                            id={whatsappKey}
                            {...register(whatsappKey)}
                        />
                    ) : (
                        <span className="text-muted">-</span>
                    )}
                </td>
            )}
            {showSms && (
                <td className="text-center align-middle">
                    {smsKey ? (
                        <Form.Check
                            type="switch"
                            id={smsKey}
                            {...register(smsKey)}
                        />
                    ) : (
                        <span className="text-muted">-</span>
                    )}
                </td>
            )}
        </tr>
    );
}

interface SectionHeaderProps {
    label: string;
    colSpan: number;
}

function SectionHeader({ label, colSpan }: SectionHeaderProps) {
    return (
        <tr>
            <td colSpan={colSpan} className="table-light py-1">
                <small className="text-muted fw-semibold">{label}</small>
            </td>
        </tr>
    );
}

export default function NotificationSettings() {
    const title = useTitle('Notification Settings');
    const { data: settingsRes, isLoading } = useNotificationSystemSettings();
    const updateMutation = useUpdateNotificationSystemSettings();
    const { data: whatsAppRes } = useWhatsAppSettings();
    const { data: smsRes } = useSmsSettings();

    const showWhatsApp = whatsAppRes?.data?.enabled === true;
    const showSms = smsRes?.data?.enabled === true;

    const totalCols = 3 + (showWhatsApp ? 1 : 0) + (showSms ? 1 : 0);

    const { register, handleSubmit, reset, setError } =
        useForm<NotificationSettingsType>();

    useEffect(() => {
        if (settingsRes?.data) {
            reset(settingsRes.data);
        }
    }, [settingsRes, reset]);

    const onSubmit = (data: NotificationSettingsType) => {
        updateMutation.mutate(data, {
            onError: error => applyServerErrors(error, setError),
        });
    };

    if (isLoading) {
        return <SettingsFormSkeleton cards={2} />;
    }

    const rowProps = {
        register,
        showWhatsApp,
        showSms,
    };

    return (
        <div className="pb-4">
            {title}
            <div className="page-titles mb-3">
                <h4>Notification Settings</h4>
                <p className="text-muted mb-0">
                    Configure system-wide notification channels. These settings
                    apply globally - disabling a channel here stops all users
                    from receiving that notification type.
                </p>
            </div>

            <Card>
                <Card.Header>
                    <Card.Title>System-Wide Notification Channels</Card.Title>
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <div className="table-responsive">
                            <table className="table table-bordered table-sm mb-0">
                                <thead>
                                    <tr>
                                        <th>Event</th>
                                        <th
                                            className="text-center"
                                            style={{
                                                width: 75,
                                                minWidth: 75,
                                                fontSize: '0.8rem',
                                            }}
                                        >
                                            Email
                                        </th>
                                        <th
                                            className="text-center"
                                            style={{
                                                width: 75,
                                                minWidth: 75,
                                                fontSize: '0.8rem',
                                            }}
                                        >
                                            In-App
                                        </th>
                                        {showWhatsApp && (
                                            <th
                                                className="text-center"
                                                style={{
                                                    width: 90,
                                                    minWidth: 90,
                                                    fontSize: '0.8rem',
                                                }}
                                            >
                                                WhatsApp
                                            </th>
                                        )}
                                        {showSms && (
                                            <th
                                                className="text-center"
                                                style={{
                                                    width: 65,
                                                    minWidth: 65,
                                                    fontSize: '0.8rem',
                                                }}
                                            >
                                                SMS
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Rentals */}
                                    <SectionHeader
                                        label="Rentals"
                                        colSpan={totalCols}
                                    />
                                    <ToggleRow
                                        label="New Booking"
                                        description="When a new rental is created"
                                        emailKey="email_new_booking"
                                        pushKey="new_booking"
                                        whatsappKey="whatsapp_new_booking"
                                        smsKey="sms_new_booking"
                                        {...rowProps}
                                    />
                                    <ToggleRow
                                        label="Rental Cancelled"
                                        description="When a rental booking is cancelled"
                                        emailKey="email_rental_cancelled"
                                        pushKey="rental_cancelled"
                                        whatsappKey="whatsapp_rental_cancelled"
                                        smsKey="sms_rental_cancelled"
                                        {...rowProps}
                                    />
                                    <ToggleRow
                                        label="Overdue Rental"
                                        description="When a rental becomes overdue"
                                        emailKey="email_overdue_alert"
                                        pushKey="overdue_alert"
                                        whatsappKey="whatsapp_overdue_alert"
                                        smsKey="sms_overdue_alert"
                                        {...rowProps}
                                    />
                                    <ToggleRow
                                        label="Return Reminder"
                                        description="Reminder before a rental return date"
                                        emailKey="email_return_reminder"
                                        pushKey="return_reminder"
                                        whatsappKey="whatsapp_return_reminder"
                                        smsKey="sms_return_reminder"
                                        {...rowProps}
                                    />
                                    <ToggleRow
                                        label="Pickup Reminder"
                                        description="When a rental pickup date is approaching"
                                        emailKey="email_pickup_reminder"
                                        pushKey="pickup_reminder"
                                        whatsappKey="whatsapp_pickup_reminder"
                                        smsKey="sms_pickup_reminder"
                                        {...rowProps}
                                    />
                                    <ToggleRow
                                        label="Rental Status Change"
                                        description="When a rental status changes"
                                        emailKey="email_rental_status_change"
                                        pushKey="rental_status_change"
                                        whatsappKey="whatsapp_rental_status_change"
                                        smsKey="sms_rental_status_change"
                                        {...rowProps}
                                    />
                                    <ToggleRow
                                        label="Payment Confirmation"
                                        description="When a payment is recorded on a rental"
                                        emailKey="email_payment_confirmation"
                                        pushKey="payment_confirmation"
                                        whatsappKey="whatsapp_payment_confirmation"
                                        smsKey="sms_payment_confirmation"
                                        {...rowProps}
                                    />

                                    {/* Airport Bookings */}
                                    <SectionHeader
                                        label="Airport Bookings"
                                        colSpan={totalCols}
                                    />
                                    <ToggleRow
                                        label="New Airport Booking"
                                        description="When a new airport transfer booking is created"
                                        emailKey="email_airport_booking"
                                        pushKey="airport_booking"
                                        whatsappKey="whatsapp_airport_booking"
                                        smsKey="sms_airport_booking"
                                        {...rowProps}
                                    />
                                    <ToggleRow
                                        label="Airport Booking Cancelled"
                                        description="When an airport transfer booking is cancelled"
                                        emailKey="email_airport_booking_cancelled"
                                        pushKey="airport_booking_cancelled"
                                        whatsappKey="whatsapp_airport_booking_cancelled"
                                        smsKey="sms_airport_booking_cancelled"
                                        {...rowProps}
                                    />
                                    <ToggleRow
                                        label="Airport Booking Status Changed"
                                        description="When an airport booking status changes (admin alert)"
                                        pushKey="airport_booking_status_changed"
                                        whatsappKey="whatsapp_airport_booking_status_changed"
                                        smsKey="sms_airport_booking_status_changed"
                                        {...rowProps}
                                    />

                                    {/* Chauffeur Bookings */}
                                    <SectionHeader
                                        label="Chauffeur Bookings"
                                        colSpan={totalCols}
                                    />
                                    <ToggleRow
                                        label="New Chauffeur Booking"
                                        description="When a new chauffeur booking is created"
                                        emailKey="email_chauffeur_booking"
                                        pushKey="chauffeur_booking"
                                        whatsappKey="whatsapp_chauffeur_booking"
                                        smsKey="sms_chauffeur_booking"
                                        {...rowProps}
                                    />
                                    <ToggleRow
                                        label="Chauffeur Booking Cancelled"
                                        description="When a chauffeur booking is cancelled"
                                        emailKey="email_chauffeur_booking_cancelled"
                                        pushKey="chauffeur_booking_cancelled"
                                        whatsappKey="whatsapp_chauffeur_booking_cancelled"
                                        smsKey="sms_chauffeur_booking_cancelled"
                                        {...rowProps}
                                    />
                                    <ToggleRow
                                        label="Chauffeur Booking Status Changed"
                                        description="When a chauffeur booking status changes (admin alert)"
                                        pushKey="chauffeur_booking_status_changed"
                                        whatsappKey="whatsapp_chauffeur_booking_status_changed"
                                        smsKey="sms_chauffeur_booking_status_changed"
                                        {...rowProps}
                                    />
                                    <ToggleRow
                                        label="Chauffeur Pickup Reminder"
                                        description="Reminder for upcoming chauffeur pickups"
                                        emailKey="email_chauffeur_pickup_reminder"
                                        pushKey="chauffeur_pickup_reminder"
                                        whatsappKey="whatsapp_chauffeur_pickup_reminder"
                                        smsKey="sms_chauffeur_pickup_reminder"
                                        {...rowProps}
                                    />

                                    {/* Vehicles & Drivers */}
                                    <SectionHeader
                                        label="Vehicles & Drivers"
                                        colSpan={totalCols}
                                    />
                                    <ToggleRow
                                        label="Vehicle Expiry"
                                        description="When a vehicle document is expiring"
                                        emailKey="email_vehicle_expiry"
                                        pushKey="vehicle_expiry"
                                        whatsappKey="whatsapp_vehicle_expiry"
                                        smsKey="sms_vehicle_expiry"
                                        {...rowProps}
                                    />
                                    <ToggleRow
                                        label="Driver Document Expiry"
                                        description="When a driver license or ID document is expiring"
                                        emailKey="email_driver_document_expiry"
                                        pushKey="driver_document_expiry"
                                        whatsappKey="whatsapp_driver_document_expiry"
                                        smsKey="sms_driver_document_expiry"
                                        {...rowProps}
                                    />
                                    <ToggleRow
                                        label="Document Expiry Alert"
                                        description="General document expiry alert"
                                        emailKey="email_document_expiry_alert"
                                        pushKey="document_expiry_alert"
                                        whatsappKey="whatsapp_document_expiry_alert"
                                        smsKey="sms_document_expiry_alert"
                                        {...rowProps}
                                    />

                                    {/* Quotes */}
                                    <SectionHeader
                                        label="Quotes"
                                        colSpan={totalCols}
                                    />
                                    <ToggleRow
                                        label="Quote Request (Admin)"
                                        description="When a customer submits a quote request"
                                        emailKey="email_quote_request"
                                        pushKey="quote_request"
                                        whatsappKey="whatsapp_quote_request"
                                        smsKey="sms_quote_request"
                                        {...rowProps}
                                    />
                                    <ToggleRow
                                        label="Quote Confirmation (Customer)"
                                        description="Confirmation sent to customer after submitting a quote"
                                        emailKey="email_quote_confirmation"
                                        {...rowProps}
                                    />
                                    <ToggleRow
                                        label="Quote Ready (Customer)"
                                        description="Sent to customer when their quote has been prepared"
                                        emailKey="email_quote_ready"
                                        {...rowProps}
                                    />

                                    {/* Admin alerts */}
                                    <SectionHeader
                                        label="Admin Alerts"
                                        colSpan={totalCols}
                                    />
                                    <ToggleRow
                                        label="Admin New Booking Alert"
                                        description="Alert sent to the admin phone when a new booking is created"
                                        whatsappKey="whatsapp_admin_new_booking"
                                        smsKey="sms_admin_new_booking"
                                        {...rowProps}
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
                                    : 'Save Settings'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
}
