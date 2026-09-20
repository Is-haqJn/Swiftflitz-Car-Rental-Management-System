export interface ChauffeurCustomer {
    id: string;
    full_name: string;
    email: string | null;
    phone: string;
    expected_destination: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateChauffeurCustomerData {
    full_name: string;
    email?: string;
    phone: string;
    expected_destination?: string;
}

export interface UpdateChauffeurCustomerData {
    full_name?: string;
    email?: string | null;
    phone?: string;
    expected_destination?: string | null;
}

export interface ChauffeurCustomerFilters {
    page?: number;
    per_page?: number;
    'filter[full_name]'?: string;
    'filter[email]'?: string;
    'filter[phone]'?: string;
    sort?: string;
}
