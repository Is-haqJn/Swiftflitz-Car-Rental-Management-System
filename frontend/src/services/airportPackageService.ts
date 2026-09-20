import { apiClient } from '@/shared/api/apiClient';
import type {
    AirportPackage,
    CreateAirportPackageData,
    UpdateAirportPackageData,
    AirportPackageFilters,
} from '@/shared/types/airport-package.types';
import type { ApiResponse, PaginatedResponse } from '@/shared/types';

export const airportPackageService = {
    async list(
        filters: AirportPackageFilters = {}
    ): Promise<PaginatedResponse<AirportPackage>> {
        const params: Record<string, unknown> = {};
        if (filters.page) params.page = filters.page;
        if (filters.per_page) params.per_page = filters.per_page;
        if (filters.search) params.search = filters.search;
        if (filters.is_active !== undefined)
            params['filter[is_active]'] = filters.is_active;

        return apiClient.get<PaginatedResponse<AirportPackage>>(
            '/airport-packages',
            { params }
        );
    },

    async get(id: string): Promise<ApiResponse<AirportPackage>> {
        return apiClient.get<ApiResponse<AirportPackage>>(
            `/airport-packages/${id}`
        );
    },

    async forPickup(): Promise<ApiResponse<AirportPackage[]>> {
        return apiClient.get<ApiResponse<AirportPackage[]>>(
            '/airport-packages/for-pickup'
        );
    },

    async forDropoff(): Promise<ApiResponse<AirportPackage[]>> {
        return apiClient.get<ApiResponse<AirportPackage[]>>(
            '/airport-packages/for-dropoff'
        );
    },

    async create(
        data: CreateAirportPackageData
    ): Promise<ApiResponse<AirportPackage>> {
        return apiClient.post<ApiResponse<AirportPackage>>(
            '/airport-packages',
            data
        );
    },

    async update(
        id: string,
        data: UpdateAirportPackageData
    ): Promise<ApiResponse<AirportPackage>> {
        return apiClient.put<ApiResponse<AirportPackage>>(
            `/airport-packages/${id}`,
            data
        );
    },

    async delete(id: string): Promise<{ status: string; message: string }> {
        return apiClient.delete<{ status: string; message: string }>(
            `/airport-packages/${id}`
        );
    },

    async toggleActive(id: string): Promise<ApiResponse<AirportPackage>> {
        return apiClient.patch<ApiResponse<AirportPackage>>(
            `/airport-packages/${id}/toggle-active`
        );
    },

    async uploadPhoto(
        id: string,
        file: File
    ): Promise<ApiResponse<AirportPackage>> {
        const form = new FormData();
        form.append('file', file);
        return apiClient.post<ApiResponse<AirportPackage>>(
            `/airport-packages/${id}/photo`,
            form
        );
    },
};
