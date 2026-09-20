export type DriverStatus =
    | 'available'
    | 'on_trip'
    | 'off_duty'
    | 'suspended'
    | 'inactive';

export type DriverIdType =
    | 'ghana_card'
    | 'passport'
    | 'voters_id'
    | 'drivers_license'
    | 'ssnit'
    | 'other';

export interface DriverMediaItem {
    id: number;
    file_name: string;
    mime_type: string;
    size: number;
    urls: {
        original: string;
        thumb: string | null;
        medium: string | null;
    };
}

export interface Driver {
    id: string;

    // Personal
    first_name: string;
    last_name: string;
    full_name: string;
    phone_number: string;
    email?: string | null;
    date_of_birth?: string | null;
    address?: string | null;
    city?: string | null;

    // Identity
    id_type?: DriverIdType | null;
    id_number?: string | null;
    id_expiry_date?: string | null;
    id_expired: boolean;
    id_expires_soon: boolean;

    // License
    license_number: string;
    license_class: string;
    license_expiry_date: string;
    license_verified: boolean;
    license_expired: boolean;
    license_expires_soon: boolean;

    // Emergency contact
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    emergency_contact_relation?: string | null;

    // Service assignment
    available_for_chauffeur: boolean;
    available_for_airport: boolean;

    // Status
    status: DriverStatus;
    is_active: boolean;
    is_available: boolean;

    notes?: string | null;

    // Media
    driver_photo?: DriverMediaItem | null;
    id_document?: DriverMediaItem | null;
    license_photo?: DriverMediaItem | null;

    created_at: string;
    updated_at: string;
}

export interface CreateDriverPayload {
    first_name: string;
    last_name: string;
    phone_number: string;
    date_of_birth: string;
    license_number: string;
    license_class: string;
    license_expiry_date: string;
    email?: string | null;
    address?: string | null;
    city?: string | null;
    id_type?: DriverIdType | null;
    id_number?: string | null;
    id_expiry_date?: string | null;
    license_verified?: boolean;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    emergency_contact_relation?: string | null;
    available_for_chauffeur?: boolean;
    available_for_airport?: boolean;
    status?: DriverStatus;
    notes?: string | null;
    is_active?: boolean;
}

export type UpdateDriverPayload = Partial<CreateDriverPayload>;

export interface DriverFilters {
    status?: DriverStatus;
    available_for_chauffeur?: boolean;
    available_for_airport?: boolean;
    is_active?: boolean;
    license_status?: 'expired' | 'expiring_soon';
    per_page?: number;
    page?: number;
    sort?: string;
}
