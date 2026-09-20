import { apiClient } from '@/shared/api/apiClient';
import type {
    ChauffeurLocation,
    CreateChauffeurLocationData,
    UpdateChauffeurLocationData,
    ChauffeurLocationFilters,
} from '@/shared/types/chauffeur-location.types';
import type { ApiResponse, PaginatedResponse } from '@/shared/types';

export const chauffeurLocationService = {
    async list(
        filters: ChauffeurLocationFilters = {}
    ): Promise<PaginatedResponse<ChauffeurLocation>> {
        return apiClient.get<PaginatedResponse<ChauffeurLocation>>(
            '/chauffeur-locations',
            { params: filters }
        );
    },

    async get(id: string): Promise<ApiResponse<ChauffeurLocation>> {
        return apiClient.get<ApiResponse<ChauffeurLocation>>(
            `/chauffeur-locations/${id}`
        );
    },

    async create(
        data: CreateChauffeurLocationData
    ): Promise<ApiResponse<ChauffeurLocation>> {
        return apiClient.post<ApiResponse<ChauffeurLocation>>(
            '/chauffeur-locations',
            data
        );
    },

    async update(
        id: string,
        data: UpdateChauffeurLocationData
    ): Promise<ApiResponse<ChauffeurLocation>> {
        return apiClient.put<ApiResponse<ChauffeurLocation>>(
            `/chauffeur-locations/${id}`,
            data
        );
    },

    async delete(id: string): Promise<ApiResponse<null>> {
        return apiClient.delete<ApiResponse<null>>(
            `/chauffeur-locations/${id}`
        );
    },
};
