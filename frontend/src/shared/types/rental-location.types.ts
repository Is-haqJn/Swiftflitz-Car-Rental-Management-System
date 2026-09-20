export interface RentalLocation {
    id: string;
    branch_id: string | null;
    branch?: {
        id: string;
        name: string;
        currency_symbol?: string | null;
        exchange_rate?: number | null;
    };
    name: string;
    pickup_charge: number | null;
    dropoff_charge: number | null;
    is_default: boolean;
    is_pickup: boolean;
    is_dropoff: boolean;
    is_chauffeur: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateRentalLocationData {
    branch_id: string;
    name: string;
    pickup_charge?: number | null;
    dropoff_charge?: number | null;
    is_default?: boolean;
    is_pickup?: boolean;
    is_dropoff?: boolean;
    is_active?: boolean;
}

export type UpdateRentalLocationData = Partial<
    Omit<CreateRentalLocationData, 'branch_id'>
>;

export interface RentalLocationFilters {
    page?: number;
    per_page?: number;
    'filter[branch_id]'?: string;
    'filter[is_active]'?: string;
    'filter[is_pickup]'?: string;
    'filter[is_dropoff]'?: string;
    'filter[is_chauffeur]'?: string;
    'filter[search]'?: string;
}
