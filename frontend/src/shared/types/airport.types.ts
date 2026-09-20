export interface Airport {
    id: string;
    name: string;
    city: string;
    country: string;
    is_active: boolean;
    is_default: boolean;
    vat_rate: string | null;
    locations_count?: number;
    created_at: string;
    updated_at: string;
}

export interface CreateAirportData {
    name: string;
    city: string;
    country: string;
    is_active: boolean;
    vat_rate?: number | null;
    branch_ids?: string[];
}

export type UpdateAirportData = Partial<CreateAirportData>;

export interface AirportFilters {
    page?: number;
    per_page?: number;
    search?: string;
    is_active?: string;
}
