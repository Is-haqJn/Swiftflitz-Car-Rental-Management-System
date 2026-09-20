import { apiClient } from '@/shared/api/apiClient';
import type {
    Airport,
    CreateAirportData,
    UpdateAirportData,
    AirportFilters,
} from '@/shared/types/airport.types';
import type { ApiResponse, PaginatedResponse } from '@/shared/types';

export const airportService = {
    async list(
        filters: AirportFilters = {}
    ): Promise<PaginatedResponse<Airport>> {
        const params: Record<string, unknown> = {};
        if (filters.page) params.page = filters.page;
        if (filters.per_page) params.per_page = filters.per_page;
        if (filters.search) params.search = filters.search;
        if (filters.is_active !== undefined)
            params['filter[is_active]'] = filters.is_active;

        return apiClient.get<PaginatedResponse<Airport>>('/airports', {
            params,
        });
    },

    async get(id: string): Promise<ApiResponse<Airport>> {
        return apiClient.get<ApiResponse<Airport>>(`/airports/${id}`);
    },

    async active(): Promise<ApiResponse<Airport[]>> {
        return apiClient.get<ApiResponse<Airport[]>>('/airports/active');
    },

    async create(data: CreateAirportData): Promise<ApiResponse<Airport>> {
        return apiClient.post<ApiResponse<Airport>>('/airports', data);
    },

    async update(
        id: string,
        data: UpdateAirportData
    ): Promise<ApiResponse<Airport>> {
        return apiClient.put<ApiResponse<Airport>>(`/airports/${id}`, data);
    },

    async delete(id: string): Promise<{ status: string; message: string }> {
        return apiClient.delete<{ status: string; message: string }>(
            `/airports/${id}`
        );
    },

    async toggleActive(id: string): Promise<ApiResponse<Airport>> {
        return apiClient.patch<ApiResponse<Airport>>(
            `/airports/${id}/toggle-active`
        );
    },

    async setAsDefault(id: string): Promise<ApiResponse<Airport>> {
        return apiClient.patch<ApiResponse<Airport>>(
            `/airports/${id}/set-as-default`
        );
    },
};
