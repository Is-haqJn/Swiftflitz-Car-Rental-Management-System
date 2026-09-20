import { apiClient } from '@/shared/api/apiClient';
import type {
    AirportLocation,
    CreateAirportLocationData,
    UpdateAirportLocationData,
    AirportLocationFilters,
} from '@/shared/types/airport-location.types';
import type { ApiResponse, PaginatedResponse } from '@/shared/types';

export const airportLocationService = {
    async list(
        filters: AirportLocationFilters = {}
    ): Promise<PaginatedResponse<AirportLocation>> {
        const params: Record<string, unknown> = {};
        if (filters.page) params.page = filters.page;
        if (filters.per_page) params.per_page = filters.per_page;
        if (filters.is_active !== undefined)
            params['filter[is_active]'] = filters.is_active;
        if (filters.location_type)
            params['filter[location_type]'] = filters.location_type;

        return apiClient.get<PaginatedResponse<AirportLocation>>(
            '/airport-locations',
            { params }
        );
    },

    async get(id: string): Promise<ApiResponse<AirportLocation>> {
        return apiClient.get<ApiResponse<AirportLocation>>(
            `/airport-locations/${id}`
        );
    },

    async terminals(
        airportId: string
    ): Promise<ApiResponse<AirportLocation[]>> {
        return apiClient.get<ApiResponse<AirportLocation[]>>(
            '/airport-locations/terminals',
            { params: { airport_id: airportId } }
        );
    },

    async areas(branchId: string): Promise<ApiResponse<AirportLocation[]>> {
        return apiClient.get<ApiResponse<AirportLocation[]>>(
            '/airport-locations/areas',
            { params: { branch_id: branchId } }
        );
    },

    async create(
        data: CreateAirportLocationData
    ): Promise<ApiResponse<AirportLocation>> {
        return apiClient.post<ApiResponse<AirportLocation>>(
            '/airport-locations',
            data
        );
    },

    async update(
        id: string,
        data: UpdateAirportLocationData
    ): Promise<ApiResponse<AirportLocation>> {
        return apiClient.put<ApiResponse<AirportLocation>>(
            `/airport-locations/${id}`,
            data
        );
    },

    async delete(id: string): Promise<{ status: string; message: string }> {
        return apiClient.delete<{ status: string; message: string }>(
            `/airport-locations/${id}`
        );
    },

    async toggleActive(id: string): Promise<ApiResponse<AirportLocation>> {
        return apiClient.patch<ApiResponse<AirportLocation>>(
            `/airport-locations/${id}/toggle-active`
        );
    },
};
