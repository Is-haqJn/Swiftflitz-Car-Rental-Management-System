export interface AirportPackage {
    id: string;
    name: string;
    description: string | null;
    features: string[];
    is_available_for_pickup: boolean;
    is_available_for_dropoff: boolean;
    auto_assign_vehicle: boolean;
    is_active: boolean;
    assignments_count?: number;
    package_photo: {
        urls: { original: string; thumb: string; medium: string };
    } | null;
    created_at: string;
    updated_at: string;
}

export interface CreateAirportPackageData {
    name: string;
    description?: string;
    features: string[];
    is_available_for_pickup: boolean;
    is_available_for_dropoff: boolean;
    auto_assign_vehicle: boolean;
    is_active: boolean;
}

export type UpdateAirportPackageData = Partial<CreateAirportPackageData>;

export interface AirportPackageFilters {
    page?: number;
    per_page?: number;
    is_active?: string;
    search?: string;
}
