import type { Category } from './category.types';
import type { ApiResponse } from '.';
import type { Branch } from './branch.types';

export type VehicleStatus =
    | 'available'
    | 'rented'
    | 'maintenance'
    | 'returned'
    | 'pending_approval'
    | 'unavailable'
    | 'retired';

// ══════════════════════════════════════════════════════════════
// Vehicle - Matches DB schema exactly
// ══════════════════════════════════════════════════════════════
export interface Vehicle {
    id: string;

    // Branch
    branch_id?: string | null;
    branch?: Branch;

    // Required fields (NOT NULL in DB)
    category: Category;
    name: string;
    make: string;
    model: string;
    year: number;
    roadworthy_expiry_date: string; // ISO date string
    insurance_expiry_date: string; // ISO date string
    license_plate: string;
    color: string; // NOT NULL in DB
    seats: number; // NOT NULL in DB
    daily_rate: number; // NOT NULL (after migration)
    status: VehicleStatus;

    // Optional fields (nullable or have defaults in DB)
    vin?: string; // nullable
    fuel_type?: 'petrol' | 'diesel' | 'electric' | 'hybrid'; // default: 'petrol'
    engine_size?: string; // nullable
    odometer?: number; // default: 0
    has_insurance?: boolean; // default: false
    has_roadworthy?: boolean; // default: false
    transmission?: 'manual' | 'automatic'; // default: 'automatic'
    features?: string[]; // nullable (JSON)
    security_deposit?: number | null; // nullable - overrides category/global
    young_driver_age_threshold?: number | null;
    young_driver_deposit?: number | null;
    resolved_young_driver_age_threshold?: number | null;
    resolved_young_driver_deposit?: number | null;
    price_visible?: boolean; // default: false
    description?: string; // nullable
    condition_notes?: string; // nullable
    is_featured?: boolean; // default: false

    // Media
    images?: VehicleImage[];

    // Availability - date ranges where this vehicle is already booked (+ 1-day prep buffer on each end)
    unavailable_dates?: Array<{ rental_id?: string; from: string; to: string }>;

    // True when in Maintenance AND there is a returned/completed rental with pending damage settlement
    has_pending_damage_settlement?: boolean;

    // True when vehicle has at least one non-cancelled/non-completed rental
    is_booked?: boolean;

    // Timestamps
    created_at: string;
    updated_at: string;
}

// ══════════════════════════════════════════════════════════════
// CreateVehicleData - For API payloads
// Matches required fields from DB schema
// ══════════════════════════════════════════════════════════════
export interface CreateVehicleData {
    // Required fields
    category_id: string;
    branch_id?: string | null;
    name: string;
    make: string;
    model: string;
    year: number;
    roadworthy_expiry_date: string; // ISO date string
    insurance_expiry_date: string; // ISO date string
    license_plate: string;
    color: string; // Required (NOT NULL in DB)
    seats: number; // Required (NOT NULL in DB)
    daily_rate: number; // Required (NOT NULL after migration)

    // Optional fields
    vin?: string;
    fuel_type?: 'petrol' | 'diesel' | 'electric' | 'hybrid';
    engine_size?: string;
    odometer?: number;
    has_insurance?: boolean;
    has_roadworthy?: boolean;
    transmission?: 'manual' | 'automatic';
    features?: string[];
    security_deposit?: number | null;
    young_driver_age_threshold?: number | null;
    young_driver_deposit?: number | null;
    price_visible?: boolean;
    status?: string;
    description?: string;
    condition_notes?: string;
    is_featured?: boolean;
}

export type UpdateVehicleData = Partial<CreateVehicleData>;

/* Vehicle Image (Spatie Media) */
export interface VehicleImage {
    id: number;
    urls: {
        original: string;
        large: string;
        medium: string;
        thumb: string;
    };
    sort_order: number;
    is_primary: boolean;
    file_name: string;
    mime_type: string;
    size: number;
    created_at: string;
}

/* Filters (query params for list endpoint) */
export interface VehicleFilters {
    search?: string;
    category_id?: string;
    branch_id?: string;
    status?: VehicleStatus; // Changed to VehicleStatus type
    fuel_type?: string;
    transmission?: string;
    color?: string;
    seats?: number;
    min_price?: number;
    max_price?: number;
    min_year?: number;
    max_year?: number;
    is_featured?: boolean;
    roadworthy_expiry_status?: 'expired' | 'expiring_soon';
    insurance_expiry_status?: 'expired' | 'expiring_soon';
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
}

/* Vehicle Expenses */
export interface VehicleExpenseReceipt {
    id: number;
    url: string;
    name: string;
    mime_type: string;
}

export interface VehicleExpense {
    id: number;
    vehicle_id: string;
    type: 'petty' | 'maintenance';
    amount: number;
    description?: string;
    expense_date?: string;
    receipts: VehicleExpenseReceipt[];
    created_at: string;
}

export interface StoreExpensePayload {
    vehicle_id: string;
    type: 'petty' | 'maintenance';
    amount: number;
    description?: string;
    expense_date?: string;
    receipts?: File[];
    /** TUS upload tokens for pre-uploaded receipt files (alternative to receipts[]) */
    receipt_tus_tokens?: string[];
}

export interface CompleteMaintenancePayload {
    amount?: number;
    description?: string;
    expense_date?: string;
    receipts?: File[];
    /** TUS upload tokens for pre-uploaded receipt files (alternative to receipts[]) */
    receipt_tus_tokens?: string[];
}

/* API Response Shapes */
// export interface ApiResponse<T> {
//     status: string;
//     message: string;
//     data: T;
// }

export interface NestedApiResponse<T> {
    status: string;
    message: string;
    data: {
        data: T;
    };
}

export type VehicleResponse = ApiResponse<Vehicle>;
export type VehiclesListResponse = ApiResponse<Vehicle[]>;

// export interface PaginationMeta {
//     current_page: number;
//     from: number | null;
//     last_page: number;
//     path: string;
//     per_page: number;
//     to: number | null;
//     total: number;
// }

// export interface PaginationLinks {
//     first: string | null;
//     last: string | null;
//     prev: string | null;
//     next: string | null;
// }

// export interface PaginatedResponse<T> {
//     status: string;
//     message: string;
//     data: T[];
//     meta: PaginationMeta;
//     links: PaginationLinks;
// }
