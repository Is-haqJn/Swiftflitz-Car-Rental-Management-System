export interface AirportCustomer {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    bookings_count: number;
    created_at: string;
    updated_at: string;
}

export interface CreateAirportCustomerData {
    full_name: string;
    email: string;
    phone: string;
}

export type UpdateAirportCustomerData = Partial<CreateAirportCustomerData>;

export interface AirportCustomerFilters {
    page?: number;
    per_page?: number;
    'filter[full_name]'?: string;
    'filter[email]'?: string;
    'filter[phone]'?: string;
}
