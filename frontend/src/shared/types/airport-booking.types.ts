import type { AirportCustomer } from './airport-customer.types';

export type AirportBookingStatus =
    | 'pending'
    | 'payment_received'
    | 'confirmed'
    | 'driver_assigned'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'no_show';

export type AirportPaymentStatus = 'pending' | 'paid' | 'refunded';
export type AirportBookingDirection = 'pickup' | 'dropoff';
export type AirportBookingSource = 'online' | 'staff';
export type AirportAssignmentMode = 'manual' | 'automatic';

export type AirportPaymentMethod =
    | 'cash'
    | 'mobile_money'
    | 'bank_transfer'
    | 'offline_transfer';

export interface AirportBooking {
    id: string;
    booking_reference: string;
    direction: AirportBookingDirection;
    booking_status: AirportBookingStatus;
    payment_status: AirportPaymentStatus;
    booking_source: AirportBookingSource;
    assignment_mode: AirportAssignmentMode;
    payment_method: AirportPaymentMethod | null;
    payment_reference: string | null;
    passenger_name: string;
    passenger_phone: string;
    passenger_count: number;
    flight_number: string | null;
    airline: string | null;
    scheduled_at: string;
    specific_address: string | null;
    staff_notes: string | null;
    package_rate_snapshot: number;
    area_charge_snapshot: number;
    vat_rate_snapshot: number;
    vat_amount: number;
    coupon_discount_snapshot: number;
    total_amount: number;
    cancellation_fee_applied: number | null;
    cancelled_at: string | null;
    is_cancellable: boolean;

    // Relationships
    branch?: { id: string; name: string } | null;
    airport?: { id: string; name: string; city: string } | null;
    package?: { id: string; name: string; features: string[] } | null;
    airport_customer?: AirportCustomer | null;
    terminal_location?: {
        id: string;
        name: string;
        location_type: string;
    } | null;
    area_location?: {
        id: string;
        name: string;
        has_charge: boolean;
        charge_amount: number;
    } | null;
    vehicle?: {
        id: string;
        make: string;
        model: string;
        license_plate: string;
        color: string;
    } | null;
    driver?: { id: string; name: string; phone: string } | null;
    created_by?: { id: string; name: string } | null;
    cancelled_by?: { id: string; name: string } | null;
    booking_records?: BookingRecord[];

    currency?: string | null;
    currency_symbol?: string | null;
    exchange_rate?: number | null;
    branch_id?: string | null;

    created_at: string;
    updated_at: string;
}

export interface CreateAirportBookingData {
    // Booking details
    branch_id: string;
    direction: AirportBookingDirection;
    package_assignment_id: string;
    terminal_location_id: string;
    area_location_id: string;
    scheduled_at: string;
    passenger_name?: string;
    passenger_phone?: string;
    passenger_count: number;
    specific_address?: string;
    flight_number?: string;
    airline?: string;
    assignment_mode?: AirportAssignmentMode;
    staff_notes?: string;
    // Customer details
    customer_full_name: string;
    customer_email: string;
    customer_phone: string;
    // Optional payment
    payment_method?: AirportPaymentMethod;
    payment_reference?: string;
    // Optional coupon
    coupon_code?: string;
}

export interface UpdateAirportBookingData {
    passenger_name?: string;
    passenger_phone?: string;
    passenger_count?: number;
    flight_number?: string | null;
    airline?: string | null;
    specific_address?: string | null;
    staff_notes?: string | null;
}

export type AssignmentTarget =
    | 'driver_only'
    | 'vehicle_only'
    | 'driver_and_vehicle';

export interface BookingRecord {
    id: string;
    action: 'trip_started' | 'trip_completed';
    performed_by: { id: string; name: string } | null;
    created_at: string;
}

export interface AssignDriverData {
    driver_id?: string;
    vehicle_id?: string;
    assignment_mode?: AirportAssignmentMode;
}

export interface RecordPaymentData {
    payment_method: AirportPaymentMethod;
    payment_reference?: string;
}

export interface CancelBookingData {
    reason?: string;
}

export interface AirportBookingFilters {
    page?: number;
    per_page?: number;
    'filter[booking_status]'?: AirportBookingStatus;
    'filter[payment_status]'?: AirportPaymentStatus;
    'filter[direction]'?: AirportBookingDirection;
    'filter[branch_id]'?: string;
    'filter[airport_id]'?: string;
    'filter[scheduled_at_from]'?: string;
    'filter[scheduled_at_to]'?: string;
    'filter[search]'?: string;
    sort?: string;
}
