// customer.types.ts
// Types for Customer management system

import type { Branch } from './branch.types';
import type { Rental } from './';

export type IdType =
    | 'ghana_card'
    | 'passport'
    | 'voter_id'
    | 'drivers_license'
    | 'nhis'
    | 'other';

export interface EmergencyContact {
    name: string;
    phone: string;
    relationship: string;
}

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    alt_phone?: string;
    address: string;
    license_number: string;
    license_expiry_date: string | null; // Date string 'YYYY-MM-DD'
    id_type: IdType;
    id_number: string;
    date_of_birth?: string; // Date string 'YYYY-MM-DD'
    emergency_contact?: EmergencyContact;
    notes?: string;
    is_blacklisted: boolean;
    blacklist_reason?: string;

    // Identity & verification
    profile_status: 'incomplete' | 'pending_review' | 'verified' | 'rejected';
    id_expiry_date?: string | null;
    verified_at?: string | null;
    verified_by?: string | null;

    // Media (Spatie)
    license_images?: CustomerDocument[];
    id_document_images?: CustomerDocument[];
    passport_images?: CustomerDocument[];
    additional_documents?: CustomerDocument[];

    branch_count?: number;
    branches?: Branch[];
    rentals?: Rental[];
    rentals_count?: number;

    created_at: string;
    updated_at: string;
}

export interface CustomerDocument {
    id: number;
    collection_name:
        | 'license_images'
        | 'id_document_images'
        | 'passport'
        | 'additional_documents';
    urls: {
        original: string;
        large: string;
        medium: string;
        thumb: string;
    };
    file_name: string;
    mime_type: string;
    size: number;
    created_at: string;
}

export interface CreateCustomerData {
    // Required fields
    name: string;
    email: string;
    phone: string;

    // Profile fields (optional when using document request link flow)
    address?: string;
    license_number?: string;
    license_expiry_date?: string;
    id_type?: IdType;
    id_number?: string;

    // Optional fields
    alt_phone?: string;
    date_of_birth?: string;
    emergency_contact?: EmergencyContact;
    notes?: string;
    is_blacklisted?: boolean;
    blacklist_reason?: string;
}

export type UpdateCustomerData = Partial<CreateCustomerData>;

export interface CustomerLookupResult {
    id: string;
    name: string;
    email: string;
    phone: string;
    license_number: string;
    date_of_birth?: string | null;
    /** true if the customer is linked to the requesting manager's branch */
    is_in_branch: boolean;
}

export interface CustomerFilters {
    search?: string;
    id_type?: IdType;
    is_blacklisted?: boolean;
    license_expiring?: boolean; // Filter for expiring licenses
    license_expired?: boolean; // Filter for expired licenses
    license_status?: 'valid' | 'expiring_soon' | 'expired'; // Combined filter for license status
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
    // Spatie QB filter fields
    'filter[email]'?: string;
    'filter[name]'?: string;
    'filter[branch_id]'?: string;
}

export interface CustomerDocument {
    id: number;
    collection: string;
    file_name: string;
    mime_type: string;
    size: number;
    urls: {
        original: string;
        large: string;
        medium: string;
        thumb: string;
    };
    created_at: string;
}

// API Response Shapes
// export interface ApiResponse<T> {
//     status: string;
//     message: string;
//     data: T;
// }

// export interface NestedApiResponse<T> {
//     status: string;
//     message: string;
//     data: {
//         data: T;
//     };
// }

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
