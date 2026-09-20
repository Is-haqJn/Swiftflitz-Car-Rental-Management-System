import { apiClient } from '@/shared/api/apiClient';
import type {
    AdditionalCharge,
    CreateAdditionalChargeData,
    UpdateAdditionalChargeData,
    AdditionalChargeFilters,
} from '@/shared/types/additional-charge.types';
import type { ApiResponse, PaginatedResponse } from '@/shared/types';

export const additionalChargeService = {
    async list(
        filters: AdditionalChargeFilters = {}
    ): Promise<PaginatedResponse<AdditionalCharge>> {
        return apiClient.get<PaginatedResponse<AdditionalCharge>>(
            '/additional-charges',
            { params: filters }
        );
    },

    async get(id: string): Promise<ApiResponse<AdditionalCharge>> {
        return apiClient.get<ApiResponse<AdditionalCharge>>(
            `/additional-charges/${id}`
        );
    },

    async create(
        data: CreateAdditionalChargeData
    ): Promise<ApiResponse<AdditionalCharge>> {
        return apiClient.post<ApiResponse<AdditionalCharge>>(
            '/additional-charges',
            data
        );
    },

    async update(
        id: string,
        data: UpdateAdditionalChargeData
    ): Promise<ApiResponse<AdditionalCharge>> {
        return apiClient.put<ApiResponse<AdditionalCharge>>(
            `/additional-charges/${id}`,
            data
        );
    },

    async delete(id: string): Promise<{ status: string; message: string }> {
        return apiClient.delete<{ status: string; message: string }>(
            `/additional-charges/${id}`
        );
    },
};
