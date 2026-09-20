export interface PricingPreviewRequest {
    vehicle_id: string;
    pickup_date: string;
    return_date: string;
    customer_id?: string;
    branch_id?: string;
    pickup_location_id?: string;
    dropoff_location_id?: string;
    addons?: { id: string; quantity: number }[];
    coupon_code?: string;
    manual_discount?: number;
    manual_discount_reason?: string;
    skip_deposit?: boolean;
    young_driver?: boolean;
}

export interface AddonBreakdownItem {
    id: string;
    name: string;
    type: string;
    quantity: number;
    days: number;
    unit: number;
    amount: number;
}

export interface LocationBreakdownItem {
    type: string;
    location: string;
    amount: number;
}

export interface BreakdownLine {
    label: string;
    amount: number;
    type: string;
}

export interface PricingBreakdown {
    rentalDays: number;
    dailyRate: number;
    base: number;
    addonTotal: number;
    addonBreakdown: AddonBreakdownItem[];
    locationTotal: number;
    locationBreakdown: LocationBreakdownItem[];
    subtotal: number;
    ruleDiscountAmount: number;
    couponDiscountAmount: number;
    manualDiscountAmount: number;
    manualDiscountReason: string | null;
    totalDiscountAmount: number;
    discountedSubtotal: number;
    taxAmount: number;
    totalAmount: number;
    depositAmount: number;
    breakdown: BreakdownLine[];
}
