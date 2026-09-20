export interface DashboardStats {
    rentals: {
        active: number;
        overdue: number;
        pending: number;
        confirmed: number;
    };
    revenue: {
        this_month: number;
        pending_payments: number;
        currency_symbol: string | null;
        currency_code: string | null;
    };
    vehicles: {
        total: number;
        available: number;
        in_use: number;
        utilization_rate: number;
    };
    customers: {
        total: number;
        new_this_month: number;
    };
    quotes: {
        pending: number;
    };
    airport_bookings?: {
        pending: number;
        this_month: number;
    };
    chauffeur_bookings?: {
        pending: number;
        this_month: number;
    };
}

export interface RevenueTrendPoint {
    period: string;
    revenue: number;
    count: number;
}

export interface VehicleUtilizationItem {
    id: string;
    name: string;
    license_plate: string;
    category?: string;
    status: string;
    total_rentals: number;
}

export interface RecentRental {
    id: string;
    reference: string;
    customer?: string;
    vehicle?: string;
    status: string;
    total_cost?: number;
    created_at: string;
}

export interface RecentQuote {
    id: string;
    reference: string;
    name: string;
    vehicle?: string;
    status: string;
    created_at: string;
}

export interface UpcomingReturn {
    id: string;
    reference: string;
    customer: { name?: string; phone?: string };
    vehicle: { name?: string; license_plate?: string };
    return_date: string;
    days_overdue?: number;
}
