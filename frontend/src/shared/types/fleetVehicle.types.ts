import type { Branch } from './branch.types';
import type { AirportPackage } from './airport-package.types';
import type { Driver } from './driver.types';

export type FleetVehicleStatus =
    | 'available'
    | 'on_trip'
    | 'maintenance'
    | 'inactive'
    | 'retired';

export type FleetServiceType = 'airport' | 'chauffeur';

export interface FleetVehiclePhoto {
    id: string;
    file_name: string;
    mime_type: string;
    size: number;
    urls: {
        original: string;
        large: string;
        medium: string;
        thumb: string;
    };
}

export interface FleetServiceAssignment {
    id: string;
    vehicle_id: string;
    service_type: FleetServiceType;
    package_id: string | null;
    category_id: string | null;
    base_price: number | null;
    is_active: boolean;
    package?: AirportPackage;
    category?: { id: string; name: string; slug: string };
    created_at: string;
    updated_at: string;
}

export interface FleetVehicle {
    id: string;
    branch_id: string;
    default_driver_id: string | null;
    is_personal_vehicle: boolean;
    make: string;
    model: string;
    year: number;
    color: string;
    license_plate: string;
    seats: number;
    transmission: 'automatic' | 'manual' | 'semi-automatic' | null;
    fuel_type: 'petrol' | 'diesel' | 'electric' | 'hybrid' | null;
    engine: string | null;
    features: string[];
    has_insurance: boolean;
    insurance_expiry_date: string | null;
    has_roadworthy: boolean;
    roadworthy_expiry_date: string | null;
    status: FleetVehicleStatus;
    is_active: boolean;
    is_featured: boolean;
    description: string | null;
    notes: string | null;
    insurance_expired: boolean;
    insurance_expires_soon: boolean;
    roadworthy_expired: boolean;
    roadworthy_expires_soon: boolean;
    default_driver?: Driver | null;
    branch?: Branch;
    service_assignments?: FleetServiceAssignment[];
    photos?: FleetVehiclePhoto[];
    created_at: string;
    updated_at: string;
}

export interface ChauffeurServiceData {
    category_id: string;
    base_price: number;
}

export interface CreateFleetVehicleData {
    branch_id: string;
    make: string;
    model: string;
    year: number;
    color: string;
    license_plate: string;
    seats: number;
    has_insurance: boolean;
    has_roadworthy: boolean;
    features?: string[];
    insurance_expiry_date?: string | null;
    roadworthy_expiry_date?: string | null;
    status?: FleetVehicleStatus;
    is_active?: boolean;
    is_featured?: boolean;
    description?: string | null;
    notes?: string | null;
    transmission?: 'automatic' | 'manual' | 'semi-automatic' | null;
    fuel_type?: 'petrol' | 'diesel' | 'electric' | 'hybrid' | null;
    engine?: string | null;
    airport_packages?: string[];
    chauffeur_service?: ChauffeurServiceData | null;
    default_driver_id?: string | null;
    is_personal_vehicle?: boolean;
}

export interface FleetVehicleFilters {
    search?: string;
    'filter[status]'?: FleetVehicleStatus;
    'filter[branch_id]'?: string;
    'filter[is_active]'?: string;
    page?: number;
    per_page?: number;
}
