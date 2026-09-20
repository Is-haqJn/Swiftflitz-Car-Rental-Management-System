// Individual setting from database
export interface Setting {
    id: number;
    key: string;
    value: string;
    type: 'string' | 'boolean' | 'integer' | 'json' | 'text';
    group: string;
}

// Grouped settings as key-value pairs
export interface SiteSettings {
    site_name: string;
    site_description: string;
    site_tagline: string;
    site_logo: string;
    site_favicon: string;
    site_logo_dark: string;
}

export interface ContactSettings {
    contact_email: string;
    contact_phone: string;
    contact_phone_secondary: string;
    contact_address: string;
    contact_city: string;
    contact_country: string;
    contact_map_embed: string;
    contact_working_hours: string;
}

export interface SocialSettings {
    social_facebook: string;
    social_twitter: string;
    social_linkedin: string;
    social_instagram: string;
    social_youtube: string;
    social_tiktok: string;
    social_whatsapp: string;
}

export interface SeoSettings {
    seo_title: string;
    seo_description: string;
    seo_keywords: string;
    seo_og_image: string;
    google_analytics_id: string;
    google_tag_manager_id: string;
}

export interface EmailSettings {
    from_name: string;
    from_address: string;
    mailer: string;
    host: string;
    port: number;
    username: string;
    password: string;
    encryption: string;
}

export interface RentalSettings {
    rental_min_duration: number;
    rental_max_duration: number;
    rental_deposit_percentage: number;
    rental_cancellation_hours: number;
    rental_late_fee_per_day: number;
    rental_currency: string;
    rental_tax_percentage: number;
    rental_terms_conditions: string;
}

export interface AppearanceSettings {
    primary_color: string;
    secondary_color: string;
    font_family: string;
    footer_text: string;
    footer_copyright: string;
    custom_css: string;
    custom_js: string;
}

// All settings combined
export interface AllSettings {
    site: SiteSettings;
    contact: ContactSettings;
    social: SocialSettings;
    seo: SeoSettings;
    email: EmailSettings;
    rental: RentalSettings;
    appearance: AppearanceSettings;
}

// For public website (non-sensitive settings only)
export interface PublicSettings {
    site_name: string;
    site_description: string;
    site_tagline: string;
    site_logo: string;
    site_favicon: string;
    site_logo_dark: string;
    contact_email: string;
    contact_phone: string;
    contact_address: string;
    contact_city: string;
    contact_country: string;
    contact_working_hours: string;
    contact_map_embed: string;
    social_facebook: string;
    social_twitter: string;
    social_linkedin: string;
    social_instagram: string;
    social_youtube: string;
    social_whatsapp: string;
    primary_color: string;
    secondary_color: string;
    footer_text: string;
    footer_copyright: string;
}

// Update payload
export type UpdateSettingsPayload = Record<string, string | number | boolean>;

// Settings group names
export type SettingsGroup =
    | 'site'
    | 'contact'
    | 'social'
    | 'seo'
    | 'email'
    | 'rental'
    | 'appearance';

/* Admin Settings (Spatie Laravel Settings groups) */
export interface S3SettingsData {
    aws_access_key_id?: string | null;
    aws_secret_access_key?: string | null;
    aws_default_region?: string | null;
    aws_bucket?: string | null;
    aws_url?: string | null;
    aws_endpoint?: string | null;
    use_path_style_endpoint?: boolean;
}

export interface GeneralSettingsData {
    site_name?: string;
    site_tagline?: string;
    site_email?: string;
    site_phone?: string;
    site_address?: string;
    currency?: string;
    currency_symbol?: string;
    timezone?: string;
    maintenance_mode?: boolean;
    maintenance_bypass_token?: string | null;
    primary_color?: string | null;
    secondary_color?: string | null;
    secondary_color_2?: string | null;
    tertiary_color?: string | null;
    site_image_url?: string | null;
    storage_disk?: 'media' | 's3';
}

export interface RentalSettingsData {
    min_rental_days?: number;
    max_rental_days?: number;
    booking_advance_days?: number;
    require_license_verification?: boolean;
    allow_public_booking?: boolean;
    auto_confirm_bookings?: boolean;
    overdue_check_hour?: number;
    return_reminder_hours_before?: string;
    allow_online_booking?: boolean;
    booking_requires_confirmation?: boolean;
    booking_grace_period_hours?: number;
    vat_enabled?: boolean;
    vat_rate?: number;
    coupon_code_prefix?: string;
    pickup_window_start?: string;
    pickup_window_end?: string;
    return_time_threshold?: number | null;
    documents_required?: boolean;
}

export interface PricingSettingsData {
    base_pricing_unit?: string;
    default_daily_rate?: number;
    weekly_discount_percentage?: number;
    monthly_discount_percentage?: number;
    airport_pickup_fee?: number;
    weekend_surcharge?: number;
    apply_weekend_surcharge?: boolean;
    deposit_percentage?: number;
    charge_deposit?: boolean;
    global_security_deposit?: number;
    deposit_enforcement_mode?: 'flexible' | 'strict';
    show_prices_on_website?: boolean;
    early_return_refund_rate?: number;
    quote_expiry_hours?: number;
    payment_strict_mode?: boolean;
    online_deposit_enabled?: boolean;
    online_deposit_percentage?: number;
    balance_due_window_hours?: number;
    allow_deposit_waive?: boolean;
    vehicle_switch_fee?: number | null;
    global_young_driver_age_threshold?: number | null;
    global_young_driver_deposit?: number | null;
}

export interface AirportCancellationSettingsData {
    free_cancellation_hours?: number;
    cancellation_fee_type?: 'flat' | 'percentage';
    cancellation_fee_amount?: number;
}

export interface CancellationSettingsData {
    free_cancellation_window_hours?: number;
    no_show_grace_period_hours?: number;
    before_pickup_cancellation_fee?: number;
    modification_fee?: number;
    modification_free_window_hours?: number;
    after_pickup_cancellation_fee?: number;
    cancellation_cutoff_days?: number;
}

export interface EarlyReturnSettingsData {
    early_return_refund_enabled?: boolean;
    early_return_charge_enabled?: boolean;
    early_return_charge_type?: 'flat' | 'category';
    early_return_flat_rate?: number;
    early_return_threshold_days?: number;
}

export interface OverdueSettingsData {
    overdue_start_type?: 'exact' | 'grace_period';
    grace_period_minutes?: number;
    overdue_hourly_rate?: number;
    prep_buffer_hours?: number;
    overdue_threshold_hours?: number;
    allow_overdue_waive?: boolean;
    full_day_late_return_waiver?: boolean;
}

export interface EmailSettingsData {
    mailer?: string;
    host?: string;
    port?: number;
    encryption?: string;
    username?: string;
    password?: string;
    from_address?: string;
    from_name?: string;
    notify_customers?: boolean;
    notify_branch_managers?: boolean;
    notify_admins?: boolean;
    send_admin_new_booking?: boolean;
    send_admin_rental_cancelled?: boolean;
    send_admin_pickup_reminder?: boolean;
    send_admin_return_reminder?: boolean;
    send_admin_overdue_alert?: boolean;
    send_admin_payment_confirmation?: boolean;
    send_admin_rental_status_change?: boolean;
    send_admin_airport_booking?: boolean;
    send_admin_airport_booking_cancelled?: boolean;
    send_admin_chauffeur_booking?: boolean;
    send_admin_chauffeur_booking_cancelled?: boolean;
    send_admin_chauffeur_pickup_reminder?: boolean;
}

export interface WhatsAppSettingsData {
    enabled?: boolean;
    access_token?: string;
    phone_number_id?: string;
    business_account_id?: string;
    test_mode?: boolean;
    test_phone_number?: string;
    admin_only_mode?: boolean;
    admin_phone_number?: string;
    admin_only_phone_number?: string;
    mirror_mode?: boolean;
    notify_customers?: boolean;
    notify_branch_managers?: boolean;
    notify_admins?: boolean;
    send_new_booking?: boolean;
    send_return_reminder?: boolean;
    send_overdue_alert?: boolean;
    send_pickup_reminder?: boolean;
    send_payment_confirmation?: boolean;
    send_admin_new_booking?: boolean;
    send_admin_rental_cancelled?: boolean;
    send_admin_pickup_reminder?: boolean;
    send_admin_return_reminder?: boolean;
    send_admin_overdue_alert?: boolean;
    send_admin_payment_confirmation?: boolean;
    send_admin_rental_status_change?: boolean;
    send_admin_airport_booking?: boolean;
    send_admin_airport_booking_cancelled?: boolean;
    send_admin_chauffeur_booking?: boolean;
    send_admin_chauffeur_booking_cancelled?: boolean;
    send_admin_chauffeur_pickup_reminder?: boolean;
    send_airport_booking?: boolean;
    send_airport_booking_cancelled?: boolean;
    send_airport_booking_status_changed?: boolean;
    send_chauffeur_booking?: boolean;
    send_chauffeur_booking_cancelled?: boolean;
    send_chauffeur_booking_status_changed?: boolean;
    send_chauffeur_pickup_reminder?: boolean;
    send_rental_cancelled?: boolean;
    send_driver_document_expiry?: boolean;
    send_rental_status_change?: boolean;
    send_vehicle_expiry?: boolean;
    send_quote_request?: boolean;
    send_document_expiry_alert?: boolean;
    app_secret?: string;
    webhook_verify_token?: string;
}

export interface SmsSettingsData {
    enabled?: boolean;
    default_provider?: 'arkessel' | 'twilio' | 'nalo' | 'hubtel';
    test_mode?: boolean;
    test_phone_number?: string;
    admin_only_mode?: boolean;
    admin_phone_number?: string;
    admin_only_phone_number?: string;
    mirror_mode?: boolean;
    notify_customers?: boolean;
    notify_branch_managers?: boolean;
    notify_admins?: boolean;
    send_new_booking?: boolean;
    send_return_reminder?: boolean;
    send_overdue_alert?: boolean;
    send_pickup_reminder?: boolean;
    send_payment_confirmation?: boolean;
    send_admin_new_booking?: boolean;
    send_admin_rental_cancelled?: boolean;
    send_admin_pickup_reminder?: boolean;
    send_admin_return_reminder?: boolean;
    send_admin_overdue_alert?: boolean;
    send_admin_payment_confirmation?: boolean;
    send_admin_rental_status_change?: boolean;
    send_admin_airport_booking?: boolean;
    send_admin_airport_booking_cancelled?: boolean;
    send_admin_chauffeur_booking?: boolean;
    send_admin_chauffeur_booking_cancelled?: boolean;
    send_admin_chauffeur_pickup_reminder?: boolean;
    send_airport_booking?: boolean;
    send_airport_booking_cancelled?: boolean;
    send_airport_booking_status_changed?: boolean;
    send_chauffeur_booking?: boolean;
    send_chauffeur_booking_cancelled?: boolean;
    send_chauffeur_booking_status_changed?: boolean;
    send_chauffeur_pickup_reminder?: boolean;
    send_rental_cancelled?: boolean;
    send_driver_document_expiry?: boolean;
    send_rental_status_change?: boolean;
    send_vehicle_expiry?: boolean;
    send_quote_request?: boolean;
    send_document_expiry_alert?: boolean;
    arkessel_api_key?: string;
    arkessel_sender_id?: string;
    twilio_account_sid?: string;
    twilio_auth_token?: string;
    twilio_from_number?: string;
    nalo_api_key?: string;
    nalo_sender_id?: string;
    hubtel_sms_client_id?: string;
    hubtel_sms_client_secret?: string;
    hubtel_sms_sender_id?: string;
}

export interface SeoSettingsData {
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    og_image?: string;
    google_analytics_id?: string;
    google_tag_manager_id?: string;
    facebook_pixel_id?: string;
    robots?: string;
}

export interface PaymentSettingsData {
    payment_provider?: string;
    paystack_public_key?: string;
    paystack_secret_key?: string;
    stripe_public_key?: string;
    stripe_secret_key?: string;
    hubtel_client_id?: string;
    hubtel_client_secret?: string;
    hubtel_merchant_account_number?: string;
    enable_online_payments?: boolean;
    enable_paystack?: boolean;
    enable_stripe?: boolean;
    enable_hubtel?: boolean;
    payment_currency?: string;
    paystack_logo_url?: string | null;
    stripe_logo_url?: string | null;
    hubtel_logo_url?: string | null;
}

/** Public payment configuration - no secret keys, safe to expose without auth */
export interface PublicPaymentConfig {
    payment_provider: string;
    paystack_public_key: string | null;
    stripe_public_key: string | null;
    hubtel_client_id: string | null;
    payment_currency: string;
    enable_online_payments: boolean;
    enable_paystack: boolean;
    enable_stripe: boolean;
    enable_hubtel: boolean;
    paystack_logo_url: string | null;
    stripe_logo_url: string | null;
    hubtel_logo_url: string | null;
    support_email: string | null;
    support_phone: string | null;
}

export interface SystemInfo {
    php_version: string;
    laravel_version: string;
    environment: string;
    debug_mode: boolean;
    timezone: string;
    database_driver: string;
    cache_driver: string;
    queue_driver: string;
}
