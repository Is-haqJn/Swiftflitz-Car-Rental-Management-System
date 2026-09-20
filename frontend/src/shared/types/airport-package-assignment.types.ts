import type { Airport } from './airport.types';
import type { AirportPackage } from './airport-package.types';

export interface AirportPackageAssignment {
    id: string;
    package_id: string;
    airport_id: string;
    base_price: string;
    vat_rate?: number;
    vat_inclusive_price?: number;
    is_active: boolean;
    package?: AirportPackage;
    airport?: Airport;
    currency?: string | null;
    currency_symbol?: string | null;
    exchange_rate?: number | null;
    show_converted_price?: boolean | null;
    global_currency?: string | null;
    global_currency_symbol?: string | null;
    base_price_global?: number | null;
    created_at: string;
    updated_at: string;
}

export interface CreateAirportPackageAssignmentData {
    package_id: string;
    airport_id: string;
    base_price: number;
    is_active: boolean;
}

export type UpdateAirportPackageAssignmentData =
    Partial<CreateAirportPackageAssignmentData>;

export interface AirportPackageAssignmentFilters {
    page?: number;
    per_page?: number;
    airport_id?: string;
    is_active?: string;
}
