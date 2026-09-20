import { apiClient } from '@/shared/api/apiClient';
import type {
    ChauffeurCustomer,
    CreateChauffeurCustomerData,
    UpdateChauffeurCustomerData,
    ChauffeurCustomerFilters,
} from '@/shared/types/chauffeur-customer.types';
import type { ApiResponse, PaginatedResponse } from '@/shared/types';

export const chauffeurCustomerService = {
    async list(
        filters: ChauffeurCustomerFilters = {}
    ): Promise<PaginatedResponse<ChauffeurCustomer>> {
        return apiClient.get<PaginatedResponse<ChauffeurCustomer>>(
            '/chauffeur-customers',
            { params: filters }
        );
    },

    async lookup(email: string): Promise<ApiResponse<ChauffeurCustomer>> {
        return apiClient.get<ApiResponse<ChauffeurCustomer>>(
            '/chauffeur-customers/lookup',
            { params: { email } }
        );
    },

    async get(id: string): Promise<ApiResponse<ChauffeurCustomer>> {
        return apiClient.get<ApiResponse<ChauffeurCustomer>>(
            `/chauffeur-customers/${id}`
        );
    },

    async create(
        data: CreateChauffeurCustomerData
    ): Promise<ApiResponse<ChauffeurCustomer>> {
        return apiClient.post<ApiResponse<ChauffeurCustomer>>(
            '/chauffeur-customers',
            data
        );
    },

    async update(
        id: string,
        data: UpdateChauffeurCustomerData
    ): Promise<ApiResponse<ChauffeurCustomer>> {
        return apiClient.put<ApiResponse<ChauffeurCustomer>>(
            `/chauffeur-customers/${id}`,
            data
        );
    },

    async delete(id: string): Promise<ApiResponse<null>> {
        return apiClient.delete<ApiResponse<null>>(
            `/chauffeur-customers/${id}`
        );
    },
};
