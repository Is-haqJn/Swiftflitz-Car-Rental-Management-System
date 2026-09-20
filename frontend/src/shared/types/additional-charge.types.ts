export type ChargeScope = 'global' | 'category' | 'vehicle' | 'regular';
export type ChargeType = 'flat' | 'per_day';

export interface AdditionalCharge {
    id: string;
    branch_id: string | null;
    branch?: { id: string; name: string } | null;
    name: string;
    description: string | null;
    scope: ChargeScope;
    category_id: string | null;
    category?: { id: string; name: string } | null;
    vehicle_id: string | null;
    vehicle?: { id: string; name: string; license_plate: string } | null;
    charge_type: ChargeType;
    amount: number;
    currency?: string | null;
    currency_symbol?: string | null;
    stock_quantity: number | null;
    is_waivable: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateAdditionalChargeData {
    branch_id?: string | null;
    name: string;
    description?: string | null;
    scope: ChargeScope;
    category_id?: string | null;
    vehicle_id?: string | null;
    charge_type: ChargeType;
    amount: number;
    stock_quantity?: number | null;
    is_waivable?: boolean;
    is_active?: boolean;
}

export type UpdateAdditionalChargeData = Partial<CreateAdditionalChargeData>;

export interface AdditionalChargeFilters {
    page?: number;
    per_page?: number;
    'filter[branch_id]'?: string;
    'filter[scope]'?: string;
    'filter[charge_type]'?: string;
    'filter[is_active]'?: string;
    'filter[search]'?: string;
}
