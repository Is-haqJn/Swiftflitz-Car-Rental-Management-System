export type CouponDiscountType = 'percentage' | 'fixed';
export type CouponBehaviourType = 'standard' | 'first_time';
export type CouponScopeType =
    | 'rental'
    | 'chauffeur'
    | 'airport'
    | 'airport_package'
    | 'vehicle'
    | 'fleet_vehicle'
    | 'category';

export interface CouponScope {
    id?: number;
    scope_type: CouponScopeType;
    scope_id: string | null;
}

export interface DiscountCoupon {
    id: string;
    code: string;
    coupon_type: CouponBehaviourType;
    name: string;
    description: string | null;
    type: CouponDiscountType;
    value: number;
    valid_days: number | null;
    expires_at: string | null;
    max_uses: number | null;
    max_uses_per_customer: number | null;
    used_count: number;
    min_rental_days: number | null;
    min_rental_amount: number | null;
    is_auto_generated: boolean;
    is_active: boolean;
    scopes?: CouponScope[];
    created_by: string | null;
    created_by_user?: { id: string; name: string } | null;
    created_at: string;
    updated_at: string;
}

export interface CreateCouponData {
    code?: string | null;
    coupon_type: CouponBehaviourType;
    name: string;
    description?: string | null;
    type: CouponDiscountType;
    value: number;
    valid_days?: number | null;
    max_uses?: number | null;
    max_uses_per_customer?: number | null;
    min_rental_days?: number | null;
    min_rental_amount?: number | null;
    is_active?: boolean;
    scopes?: CouponScope[];
}

export type UpdateCouponData = Partial<Omit<CreateCouponData, 'code'>>;

export interface CouponFilters {
    page?: number;
    per_page?: number;
    'filter[is_active]'?: string;
    'filter[type]'?: string;
    'filter[coupon_type]'?: string;
    'filter[search]'?: string;
    'filter[expired]'?: string;
    'filter[used]'?: string;
}
