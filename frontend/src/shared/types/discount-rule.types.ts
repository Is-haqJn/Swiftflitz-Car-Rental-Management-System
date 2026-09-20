export type DiscountType = 'percentage' | 'flat';

export type DiscountConditionType =
    | 'none'
    | 'rental_duration_days'
    | 'days_before_pickup'
    | 'booking_source'
    | 'customer_completed_rentals'
    | 'base_amount'
    | 'vehicle_id'
    | 'category_id';

export type DiscountUsageType = 'rule' | 'manual';

export interface DiscountRule {
    id: string;
    branch_id: string | null;
    branch?: {
        id: string;
        name: string;
        currency_symbol?: string | null;
    } | null;
    name: string;
    description: string | null;
    discount_type: DiscountType;
    discount_value: number;
    condition_type: DiscountConditionType;
    condition_value: string | null;
    condition_vehicle?: {
        id: string;
        name: string;
        license_plate: string;
    } | null;
    condition_category?: { id: string; name: string } | null;
    is_stackable: boolean;
    is_active: boolean;
    valid_from: string | null;
    valid_to: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateDiscountRuleData {
    branch_id?: string | null;
    name: string;
    description?: string | null;
    discount_type: DiscountType;
    discount_value: number;
    condition_type: DiscountConditionType;
    condition_value?: string | null;
    is_stackable?: boolean;
    is_active?: boolean;
    valid_from?: string | null;
    valid_to?: string | null;
}

export type UpdateDiscountRuleData = Partial<CreateDiscountRuleData>;

export interface DiscountRuleFilters {
    page?: number;
    per_page?: number;
    'filter[branch_id]'?: string;
    'filter[discount_type]'?: string;
    'filter[condition_type]'?: string;
    'filter[is_active]'?: string;
    'filter[search]'?: string;
}

export interface DiscountUsageFilters {
    page?: number;
    per_page?: number;
    'filter[discount_type]'?: string;
    'filter[discount_rule_id]'?: string;
}

export interface RentalDiscountUsage {
    id: string;
    rental_id: string;
    discount_rule_id: string | null;
    applied_by: string | null;
    discount_type: DiscountUsageType;
    amount: number;
    note: string | null;
    discount_rule?: {
        id: string;
        name: string;
        discount_type: DiscountType;
    } | null;
    applied_by_user?: { id: string; name: string } | null;
    rental?: { id: string; reference: string } | null;
    created_at: string;
    updated_at: string;
}
