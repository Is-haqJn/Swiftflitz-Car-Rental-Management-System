import { apiClient } from '@/shared/api/apiClient';
import type {
    RentalLocation,
    CreateRentalLocationData,
    UpdateRentalLocationData,
    RentalLocationFilters,
} from '@/shared/types/rental-location.types';
import type { ApiResponse, PaginatedResponse } from '@/shared/types';

export const rentalLocationService = {
    async list(
        filters: RentalLocationFilters = {}
    ): Promise<PaginatedResponse<RentalLocation>> {
        return apiClient.get<PaginatedResponse<RentalLocation>>(
            '/rental-locations',
            { params: filters }
        );
    },

    async get(id: string): Promise<ApiResponse<RentalLocation>> {
        return apiClient.get<ApiResponse<RentalLocation>>(
            `/rental-locations/${id}`
        );
    },

    async create(
        data: CreateRentalLocationData
    ): Promise<ApiResponse<RentalLocation>> {
        return apiClient.post<ApiResponse<RentalLocation>>(
            '/rental-locations',
            data
        );
    },

    async update(
        id: string,
        data: UpdateRentalLocationData
    ): Promise<ApiResponse<RentalLocation>> {
        return apiClient.put<ApiResponse<RentalLocation>>(
            `/rental-locations/${id}`,
            data
        );
    },

    async delete(id: string): Promise<{ status: string; message: string }> {
        return apiClient.delete<{ status: string; message: string }>(
            `/rental-locations/${id}`
        );
    },
};
