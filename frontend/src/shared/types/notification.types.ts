export interface AppNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    action_url?: string | null;
    read_at?: string | null;
    created_at: string;
}

export interface NotificationSettings {
    id?: string;
    user_id?: string;
    // In-app / push toggles (match backend column names)
    new_booking: boolean;
    overdue_alert: boolean;
    return_reminder: boolean;
    quote_request: boolean;
    vehicle_expiry: boolean;
    pickup_reminder: boolean;
    // Email toggles
    email_new_booking: boolean;
    email_overdue_alert: boolean;
    email_return_reminder: boolean;
    email_quote_request: boolean;
    email_vehicle_expiry: boolean;
    email_pickup_reminder: boolean;
    // System-wide only - controls customer-facing quote confirmation email
    email_quote_confirmation?: boolean;
    // System-wide only - controls "your quote is ready" email sent to the customer
    email_quote_ready?: boolean;
    // Rental status change (confirmed, returned, completed)
    rental_status_change?: boolean;
    email_rental_status_change?: boolean;
    // Payment recorded/confirmed
    payment_confirmation?: boolean;
    email_payment_confirmation?: boolean;
    // Vehicle/driver document expiry alert
    document_expiry_alert?: boolean;
    email_document_expiry_alert?: boolean;
    // WhatsApp toggles (system-wide)
    whatsapp_new_booking?: boolean;
    whatsapp_return_reminder?: boolean;
    whatsapp_overdue_alert?: boolean;
    whatsapp_quote_request?: boolean;
    whatsapp_vehicle_expiry?: boolean;
    whatsapp_pickup_reminder?: boolean;
    whatsapp_rental_status_change?: boolean;
    whatsapp_payment_confirmation?: boolean;
    whatsapp_document_expiry_alert?: boolean;
    whatsapp_admin_new_booking?: boolean;
    whatsapp_rental_cancelled?: boolean;
    whatsapp_airport_booking?: boolean;
    whatsapp_airport_booking_cancelled?: boolean;
    whatsapp_airport_booking_status_changed?: boolean;
    whatsapp_chauffeur_booking?: boolean;
    whatsapp_chauffeur_booking_cancelled?: boolean;
    whatsapp_chauffeur_booking_status_changed?: boolean;
    whatsapp_chauffeur_pickup_reminder?: boolean;
    whatsapp_driver_document_expiry?: boolean;
    // SMS toggles (system-wide)
    sms_new_booking?: boolean;
    sms_return_reminder?: boolean;
    sms_overdue_alert?: boolean;
    sms_quote_request?: boolean;
    sms_vehicle_expiry?: boolean;
    sms_pickup_reminder?: boolean;
    sms_rental_status_change?: boolean;
    sms_payment_confirmation?: boolean;
    sms_document_expiry_alert?: boolean;
    sms_admin_new_booking?: boolean;
    sms_rental_cancelled?: boolean;
    sms_airport_booking?: boolean;
    sms_airport_booking_cancelled?: boolean;
    sms_airport_booking_status_changed?: boolean;
    sms_chauffeur_booking?: boolean;
    sms_chauffeur_booking_cancelled?: boolean;
    sms_chauffeur_booking_status_changed?: boolean;
    sms_chauffeur_pickup_reminder?: boolean;
    sms_driver_document_expiry?: boolean;
    // In-app toggles for new types
    airport_booking?: boolean;
    airport_booking_cancelled?: boolean;
    airport_booking_status_changed?: boolean;
    chauffeur_booking?: boolean;
    chauffeur_booking_cancelled?: boolean;
    chauffeur_booking_status_changed?: boolean;
    chauffeur_pickup_reminder?: boolean;
    rental_cancelled?: boolean;
    driver_document_expiry?: boolean;
    // Email toggles for new types
    email_rental_cancelled?: boolean;
    email_airport_booking?: boolean;
    email_airport_booking_cancelled?: boolean;
    email_chauffeur_booking?: boolean;
    email_chauffeur_booking_cancelled?: boolean;
    email_chauffeur_pickup_reminder?: boolean;
    email_driver_document_expiry?: boolean;
}
