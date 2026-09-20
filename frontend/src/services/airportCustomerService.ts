import { apiClient } from '@/shared/api/apiClient';
import type {
    AirportCustomer,
    CreateAirportCustomerData,
    UpdateAirportCustomerData,
    AirportCustomerFilters,
} from '@/shared/types/airport-customer.types';
import type { ApiResponse, PaginatedResponse } from '@/shared/types';

export const airportCustomerService = {
    async list(
        filters: AirportCustomerFilters = {}
    ): Promise<PaginatedResponse<AirportCustomer>> {
        return apiClient.get<PaginatedResponse<AirportCustomer>>(
            '/airport-customers',
            { params: filters }
        );
    },

    async get(id: string): Promise<ApiResponse<AirportCustomer>> {
        return apiClient.get<ApiResponse<AirportCustomer>>(
            `/airport-customers/${id}`
        );
    },

    async lookup(email: string): Promise<ApiResponse<AirportCustomer | null>> {
        return apiClient.get<ApiResponse<AirportCustomer | null>>(
            '/airport-customers/lookup',
            { params: { email } }
        );
    },

    async create(
        data: CreateAirportCustomerData
    ): Promise<ApiResponse<AirportCustomer>> {
        return apiClient.post<ApiResponse<AirportCustomer>>(
            '/airport-customers',
            data
        );
    },

    async update(
        id: string,
        data: UpdateAirportCustomerData
    ): Promise<ApiResponse<AirportCustomer>> {
        return apiClient.put<ApiResponse<AirportCustomer>>(
            `/airport-customers/${id}`,
            data
        );
    },

    async delete(id: string): Promise<ApiResponse<null>> {
        return apiClient.delete<ApiResponse<null>>(`/airport-customers/${id}`);
    },
};
