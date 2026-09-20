import type { Airport } from './airport.types';
import type { User } from './users.types';

export interface Branch {
    id: string;
    name: string;
    code?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    description?: string | null;
    is_active: boolean;
    currency?: string | null;
    currency_symbol?: string | null;
    exchange_rate?: number | null;
    show_converted_price?: boolean | null;
    has_airport_service: boolean;
    airport_id?: string | null;
    airport?: Airport;
    managers?: User[];
    vehicles_count?: number;
    created_at: string;
    updated_at: string;
}

export interface CreateBranchData {
    name: string;
    code?: string;
    address?: string;
    phone?: string;
    email?: string;
    description?: string;
    is_active: boolean;
    currency?: string | null;
    currency_symbol?: string | null;
    exchange_rate?: number | null;
    show_converted_price?: boolean;
    has_airport_service?: boolean;
    airport_id?: string | null;
}

export type UpdateBranchData = Partial<CreateBranchData>;

export interface BranchFilters {
    page?: number;
    per_page?: number;
    search?: string;
    is_active?: boolean | string;
}
