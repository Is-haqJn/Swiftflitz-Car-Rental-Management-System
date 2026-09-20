export type ChauffeurBookingStatus =
    | 'pending'
    | 'confirmed'
    | 'driver_assigned'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'no_show';

export type ChauffeurPaymentStatus = 'pending' | 'paid' | 'refunded' | 'waived';

export type ChauffeurPaymentMethod =
    | 'cash'
    | 'mobile_money'
    | 'bank_transfer'
    | 'offline_transfer';

export interface ChauffeurPickupLog {
    id: string;
    confirmed_at: string | null;
    pickup_location: string | null;
    odometer_reading: number | null;
    customer_present: boolean;
    driver_notes: string | null;
}

export interface ChauffeurReturnLog {
    id: string;
    returned_at: string | null;
    odometer_reading: number | null;
    condition_notes: string | null;
    overtime_minutes: number;
}

export interface BookingRecord {
    id: string;
    action: string;
    notes: string | null;
    performed_by: { id: string; name: string } | null;
    created_at: string;
}

export interface ChauffeurBooking {
    id: string;
    booking_reference: string;
    booking_status: ChauffeurBookingStatus;
    payment_status: ChauffeurPaymentStatus;
    payment_method: ChauffeurPaymentMethod | null;
    payment_reference: string | null;
    pickup_time: string;
    return_time: string;
    actual_pickup_time: string | null;
    actual_return_time: string | null;
    base_price_snapshot: number;
    pickup_charge_snapshot: number;
    vat_rate_snapshot: number;
    vat_amount: number;
    coupon_discount_snapshot: number;
    overtime_hours: number;
    overtime_charge: number;
    total_amount: number;
    cancellation_fee_applied: number | null;
    no_show_fee_applied: number | null;
    cancelled_at: string | null;
    staff_notes: string | null;
    refund_note: string | null;
    is_cancellable: boolean;

    // Relationships
    branch?: { id: string; name: string } | null;
    chauffeur_customer?: {
        id: string;
        full_name: string;
        email: string | null;
        phone: string;
        expected_destination: string | null;
    } | null;
    pickup_location?: {
        id: string;
        name: string;
        charge: number | null;
    } | null;
    vehicle?: {
        id: string;
        make: string;
        model: string;
        license_plate: string;
        color: string;
    } | null;
    driver?: {
        id: string;
        name: string;
        phone: string;
        email: string | null;
    } | null;
    created_by?: { id: string; name: string } | null;
    cancelled_by?: { id: string; name: string } | null;
    booking_records?: BookingRecord[];
    pickup_log?: ChauffeurPickupLog | null;
    return_log?: ChauffeurReturnLog | null;

    /* Currency fields */
    currency?: string | null;
    currency_symbol?: string | null;
    exchange_rate?: number | null;
    branch_id?: string | null;

    created_at: string;
    updated_at: string;
}

export interface CreateChauffeurBookingData {
    branch_id: string;
    vehicle_id: string;
    pickup_location_id?: string;
    pickup_time: string;
    return_time?: string;
    customer_full_name: string;
    customer_email?: string;
    customer_phone: string;
    customer_expected_destination?: string;
    payment_method?: ChauffeurPaymentMethod;
    payment_reference?: string;
    staff_notes?: string;
}

export interface UpdateChauffeurBookingData {
    staff_notes?: string | null;
}

export interface AssignChauffeurDriverData {
    driver_id: string;
}

export interface RecordChauffeurPaymentData {
    payment_method: ChauffeurPaymentMethod;
    payment_reference?: string;
}

export interface CancelChauffeurBookingData {
    reason?: string;
}

export interface ChauffeurPickupLogData {
    pickup_location?: string;
    odometer_reading?: number;
    customer_present?: boolean;
    driver_notes?: string;
}

export interface ChauffeurReturnLogData {
    odometer_reading?: number;
    condition_notes?: string;
}

export interface ChauffeurBookingFilters {
    page?: number;
    per_page?: number;
    'filter[booking_status]'?: ChauffeurBookingStatus;
    'filter[payment_status]'?: ChauffeurPaymentStatus;
    'filter[branch_id]'?: string;
    'filter[customer_full_name]'?: string;
    'filter[pickup_time_from]'?: string;
    'filter[pickup_time_to]'?: string;
    sort?: string;
}
