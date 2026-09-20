/* Status Types */
export type RentalStatus =
    | 'pending'
    | 'confirmed'
    | 'active'
    | 'overdue'
    | 'returned'
    | 'completed'
    | 'cancelled';

export type RentalPaymentStatus =
    | 'pending'
    | 'partially_paid'
    | 'paid'
    | 'refunded'
    | 'overdue';

export type RentalSource =
    | 'website'
    | 'phone'
    | 'walk_in'
    | 'referral'
    | 'quote_request';

export type InspectionType = 'pickup' | 'return' | 'swap';

export type DepositStatus =
    | 'pending'
    | 'held'
    | 'refunded'
    | 'forfeited'
    | 'uncollected';

export type SettlementStatus = 'pending' | 'settled';
export type DamageSettlementStatus = 'pending' | 'settled' | 'forfeited';

/* Video Media */
export interface RentalVideoMedia {
    id: number;
    url: string;
    stream_url: string;
    thumbnail_url: string | null;
    mime_type: string;
    video_deleted: boolean;
}

/* Inspection */
export interface RentalInspection {
    id: string;
    rental_id: string;
    type: InspectionType;
    inspector_id: string | null;
    inspector: { id: string; name: string } | null;
    fuel_level: string | null;
    mileage: number | null;
    condition_notes: string | null;
    damage_noted: boolean;
    damage_types: string[] | null;
    damage_severity: 'minor' | 'moderate' | 'severe' | null;
    damage_description: string | null;
    photos: string[];
    swap_vehicle_id: string | null;
    created_at: string;
    updated_at: string;
}

/* Main Rental */
export interface Rental {
    id: string;
    reference: string;

    // Ownership
    branch_id: string | null;
    branch: { id: string; name: string } | null;
    vehicle_id: string;
    vehicle: {
        id: string;
        name: string;
        license_plate: string;
        daily_rate: number;
        category?: { id: string; name: string } | null;
    } | null;
    customer_id: string;
    customer: {
        id: string;
        name: string;
        email: string;
        phone: string;
        profile_status:
            | 'incomplete'
            | 'pending_review'
            | 'verified'
            | 'rejected'
            | null;
        address: string | null;
        license_number: string | null;
        license_expiry_date: string | null;
        id_type: string | null;
        id_number: string | null;
        id_expiry_date: string | null;
        license_images: { url: string }[];
        id_document_images: { url: string }[];
    } | null;
    manager_id: string | null;
    confirmed_by: string | null;
    source: RentalSource;

    // Status
    status: RentalStatus;
    payment_status: RentalPaymentStatus;

    // Scheduling
    pickup_date: string;
    pickup_time: string;
    return_date: string;
    return_time: string;
    actual_pickup_date: string | null;
    actual_return_date: string | null;
    extension_days: number | null;
    early_pickup_days: number | null;
    original_return_date: string | null;
    max_extend_date: string | null;

    // Location
    pickup_location: string | null;
    dropoff_location: string | null;
    pickup_location_id: string | null;
    dropoff_location_id: string | null;

    // Pricing snapshot
    rental_days: number;
    daily_rate: number;
    base_cost: number;
    extras_cost: number;
    additional_charges: number;
    location_charge: number;
    subtotal: number;
    vat_amount: number | null;
    total_cost: number;

    // Discounts
    rule_discount_amount: number;
    coupon_discount_amount: number;
    manual_discount_amount: number;
    manual_discount_reason: string | null;
    total_discount_amount: number;
    coupon_applied: {
        id: string;
        code: string;
        name: string;
        type: string;
        value: number;
        discount_amount: number;
    } | null;
    applied_charges_breakdown: Array<{
        label: string;
        amount: number;
        type: string;
        is_per_day?: boolean;
        unit_rate?: number;
        quantity?: number;
    }> | null;

    // Payment
    amount_paid: number;
    amount_due: number; // computed by API

    // Currency (branch-specific)
    currency: string | null;
    currency_symbol: string | null;
    exchange_rate: number | null;

    // Security deposit
    security_deposit_amount: number | null;
    security_deposit_status: DepositStatus | null;
    skip_security_deposit: boolean;
    deposit_paid: number;
    deposit_refunded: number;
    deposit_applied_to_balance: number;
    deposit_refunded_at: string | null;
    deposit_waived: boolean;
    deposit_waiver_reason: string | null;

    // Fees
    overdue_fee: number | null;
    late_pickup_fee: number | null;
    vehicle_switch_fee: number | null;

    // Overdue
    is_overdue: boolean;
    overdue_minutes: number | null;
    overdue_waived: boolean;
    overdue_waiver_reason: string | null;
    overdue_breakdown: {
        minutes: number;
        type: 'hourly' | 'daily';
        units: number;
        rate: number;
        charge: number; // vehicle rate × units only
        per_day_addons_charge: number; // 0 for hourly; addon total for daily
        per_day_addons_rate: number; // 0 for hourly; sum of per-day addon unit_rates
    } | null;

    // Early return
    is_early_return: boolean;
    actual_rental_days: number | null;
    early_return_refund: number | null;
    early_return_charge: number | null;
    early_return_charge_waived: boolean;
    early_return_charge_waived_by: string | null;
    early_return_charge_waiver_reason: string | null;
    early_return_reason: string | null;

    // Settlement
    settlement_status: SettlementStatus | null;
    damage_settlement_status: DamageSettlementStatus | null;

    // Damage
    has_damage: boolean;
    estimated_repair_cost: number | null;
    actual_repair_cost: number | null;
    damage_balance_due: number | null;

    // Notes
    customer_notes: string | null;
    admin_notes: string | null;

    // Cancellation
    cancellation_reason: string | null;
    cancellation_fee: number | null;
    days_used_cost: number | null;
    refund_amount: number | null;
    refund_status: 'pending' | 'approved' | 'waived' | null;
    cancellation_amount_owed: number | null;
    cancellation_debt_waived: boolean;
    cancellation_deposit_deduction: number | null;
    cancellation_debt_paid: number | null;
    cancelled_by_type: 'customer' | 'business' | null;
    cancelled_at: string | null;

    // Relationships
    inspections?: RentalInspection[];
    pickup_videos?: RentalVideoMedia[] | null;
    return_videos?: RentalVideoMedia[] | null;

    created_at: string;
    updated_at: string;
}

/* Create / Update */
export interface CreateRentalData {
    vehicle_id: string;
    customer_id: string;
    branch_id?: string | null;
    pickup_date: string;
    pickup_time?: string;
    return_date: string;
    return_time?: string;
    source?: RentalSource;
    pickup_location_id?: string | null;
    dropoff_location_id?: string | null;
    addons?: Array<{ id: string; quantity: number }>;
    coupon_code?: string | null;
    manual_discount_amount?: number;
    manual_discount_reason?: string | null;
    skip_security_deposit?: boolean;
    young_driver_override?: boolean | null;
    initial_payment?: number;
    collect_deposit_now?: boolean;
    customer_notes?: string | null;
    admin_notes?: string | null;
}

export interface UpdateRentalData {
    pickup_date?: string;
    pickup_time?: string;
    return_date?: string;
    return_time?: string;
    source?: RentalSource;
    pickup_location_id?: string | null;
    dropoff_location_id?: string | null;
    customer_notes?: string | null;
    admin_notes?: string | null;
}

/* Action Payloads */
export interface ProcessPickupData {
    fuel_level?: string;
    mileage?: number;
    condition_notes?: string;
    damage_noted?: boolean;
    damage_types?: string[];
    damage_severity?: string;
    damage_description?: string;
    photo_tus_tokens?: string[];
    early_pickup_option?: 'shift_return_date' | 'keep_return_date';
    late_pickup_fee?: number;
    amount_paid?: number;
    collect_deposit?: boolean;
}

export interface ProcessReturnData {
    fuel_level?: string;
    mileage?: number;
    condition_notes?: string;
    damage_noted?: boolean;
    estimated_repair_cost?: number;
    early_return_reason?: string;
    waive_early_return_charge?: boolean;
    early_return_charge_waiver_reason?: string;
    photo_tus_tokens?: string[];
    damage_types?: string[];
    damage_severity?: string;
    damage_description?: string;
    amount_paid?: number;
}

export interface ApproveReturnData {
    force_settle?: boolean;
}

export interface CancelRentalData {
    reason?: string;
    cancelled_by_type?: 'customer' | 'business';
}

export interface CancelPreview {
    cancellation_fee: number;
    days_used_cost: number;
    total_deduction: number;
    refund_amount: number;
    cancellation_amount_owed: number;
    deposit_paid: number;
    reason: 'free_window' | 'late_cancellation' | 'after_pickup';
}

export interface SettleRentalData {
    amount: number;
    payment_method?: string;
    notes?: string;
}

export interface SettleDamageData {
    actual_repair_cost: number;
    outcome: 'settled' | 'forfeited';
    balance_collected_now?: boolean;
    notes?: string;
}

export interface RecordRepairCostData {
    estimated_repair_cost: number;
}

export interface SwitchVehicleData {
    vehicle_id: string;
    reason?: string;
}

export interface ExtendRentalData {
    new_return_date: string;
    reason?: string;
}

export interface ExtendPreview {
    extension_days: number;
    original_return_date: string;
    new_return_date: string;
    extension_base_cost: number;
    extension_extras_cost: number;
    extension_vat: number;
    extension_total: number;
    old_total_cost: number;
    new_total_cost: number;
    amount_paid: number;
    new_amount_due: number;
    live_overdue_waived: number;
    max_extend_date: string | null;
    next_booking_starts: string | null;
}

export interface SettleRefundData {
    action:
        | 'approved'
        | 'waived'
        | 'deduct_deposit'
        | 'waive_debt'
        | 'mark_received';
    refund_amount?: number;
    notes?: string;
}

/* Quote Requests */
export type QuoteRequestStatus =
    | 'pending'
    | 'contacted'
    | 'quoted'
    | 'sent'
    | 'pending_review'
    | 'converted'
    | 'cancelled';

export interface QuoteRequest {
    id: string;
    reference: string;
    name: string;
    email: string;
    phone: string | null;
    rental_days: number | null;
    expected_pickup_date: string | null;
    pickup_date: string | null;
    return_date: string | null;
    vehicle_preference: string | null;
    message: string | null;
    admin_notes: string | null;
    status: QuoteRequestStatus;
    quote_token: string | null;
    token_expires_at: string | null;
    contacted_at: string | null;
    quoted_at: string | null;
    sent_at: string | null;
    confirmed_at: string | null;
    vehicle_id: string | null;
    customer_id: string | null;
    branch_id: string | null;
    pickup_location_id: string | null;
    converted_rental_id: string | null;
    admin_base_price: number | null;
    requested_addon_ids: string[] | null;
    vehicle: {
        id: string;
        name: string;
        license_plate: string;
        daily_rate: number;
        price_visible: boolean;
        thumbnail: string | null;
        category?: { id: string; name: string } | null;
    } | null;
    customer: {
        id: string;
        name: string;
        email: string;
        phone: string | null;
        alt_phone: string | null;
        license_number: string | null;
        license_expiry_date: string | null;
        id_type: string | null;
        id_number: string | null;
    } | null;
    pickup_location: { id: string; name: string } | null;
    converted_rental: {
        id: string;
        reference: string;
        status: string;
    } | null;
    // Identity resolution conflict fields
    conflict_type: 'license_mismatch' | 'license_registered' | null;
    pending_customer_data: Record<string, string | null> | null;
    conflicting_customer_id: string | null;
    conflicting_customer: {
        id: string;
        name: string;
        email: string;
        phone: string | null;
        license_number: string | null;
        profile_status: string | null;
    } | null;
    pricing: {
        rental_days: number;
        daily_rate: number;
        base_cost: number;
        additional_charges: number;
        location_charge: number;
        subtotal: number;
        total_discount_amount: number;
        discounted_subtotal: number;
        tax_amount: number;
        vat_amount?: number | null;
        total_cost: number;
        security_deposit_amount: number;
        breakdown: Array<{ label: string; amount: number; type: string }>;
    } | null;
    created_at: string;
    updated_at: string;
}

export interface QuoteRequestFilters {
    'filter[status]'?: QuoteRequestStatus;
    'filter[branch_id]'?: string;
    'filter[search]'?: string;
    per_page?: number;
    page?: number;
    sort?: string;
}

export interface GenerateQuoteData {
    vehicle_id?: string | null;
    admin_notes?: string | null;
    admin_base_price?: number | null;
}

export interface ConvertQuoteData {
    customer_id: string;
    pickup_time?: string;
    return_time?: string;
    dropoff_location_id?: string | null;
    amount_paid?: number | null;
    admin_notes?: string | null;
}

export interface PublicSubmitQuoteData {
    name: string;
    email: string;
    phone?: string | null;
    vehicle_id?: string | null;
    vehicle_preference?: string | null;
    pickup_date?: string | null;
    return_date?: string | null;
    pickup_location_id?: string | null;
    message?: string | null;
}

export interface PublicConfirmQuoteData {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    customer_alt_phone?: string;
    customer_address?: string;
    customer_date_of_birth?: string;
    license_number: string;
    license_expiry_date: string;
    id_type: string;
    id_number: string;
    pickup_time: string;
    return_time: string;
    dropoff_location_id?: string | null;
    customer_notes?: string;
}

/* Filters */
export interface RentalFilters {
    page?: number;
    per_page?: number;
    'filter[status]'?: string;
    'filter[payment_status]'?: string;
    'filter[branch_id]'?: string;
    'filter[vehicle_id]'?: string;
    'filter[customer_id]'?: string;
    'filter[source]'?: string;
    'filter[search]'?: string;
    'filter[pickup_date_from]'?: string;
    'filter[pickup_date_to]'?: string;
    sort?: string;
}
