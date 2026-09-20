import type { Airport } from './airport.types';
import type { Branch } from './branch.types';

export type AirportLocationType = 'terminal' | 'area';

export interface AirportLocation {
    id: string;
    location_type: AirportLocationType;
    airport_id: string | null;
    branch_id: string | null;
    name: string;
    has_charge: boolean;
    charge_amount: string | null;
    is_active: boolean;
    airport?: Airport;
    branch?: Branch;
    created_at: string;
    updated_at: string;
}

export interface CreateAirportLocationData {
    location_type: AirportLocationType;
    name: string;
    airport_id?: string | null;
    branch_id?: string | null;
    has_charge: boolean;
    charge_amount?: number | null;
    is_active: boolean;
}

export type UpdateAirportLocationData = Partial<CreateAirportLocationData>;

export interface AirportLocationFilters {
    page?: number;
    per_page?: number;
    is_active?: string;
    location_type?: AirportLocationType;
}
