import { apiClient } from '@/shared/api/apiClient';
import type {
    AirportPackageAssignment,
    CreateAirportPackageAssignmentData,
    UpdateAirportPackageAssignmentData,
    AirportPackageAssignmentFilters,
} from '@/shared/types/airport-package-assignment.types';
import type { ApiResponse, PaginatedResponse } from '@/shared/types';

export const airportPackageAssignmentService = {
    async list(
        filters: AirportPackageAssignmentFilters = {}
    ): Promise<PaginatedResponse<AirportPackageAssignment>> {
        const params: Record<string, unknown> = {};
        if (filters.page) params.page = filters.page;
        if (filters.per_page) params.per_page = filters.per_page;
        if (filters.airport_id)
            params['filter[airport_id]'] = filters.airport_id;
        if (filters.is_active !== undefined)
            params['filter[is_active]'] = filters.is_active;

        return apiClient.get<PaginatedResponse<AirportPackageAssignment>>(
            '/airport-package-assignments',
            { params }
        );
    },

    async get(id: string): Promise<ApiResponse<AirportPackageAssignment>> {
        return apiClient.get<ApiResponse<AirportPackageAssignment>>(
            `/airport-package-assignments/${id}`
        );
    },

    async byAirport(
        airportId: string
    ): Promise<ApiResponse<AirportPackageAssignment[]>> {
        return apiClient.get<ApiResponse<AirportPackageAssignment[]>>(
            `/airport-package-assignments/by-airport/${airportId}`
        );
    },

    async create(
        data: CreateAirportPackageAssignmentData
    ): Promise<ApiResponse<AirportPackageAssignment>> {
        return apiClient.post<ApiResponse<AirportPackageAssignment>>(
            '/airport-package-assignments',
            data
        );
    },

    async update(
        id: string,
        data: UpdateAirportPackageAssignmentData
    ): Promise<ApiResponse<AirportPackageAssignment>> {
        return apiClient.put<ApiResponse<AirportPackageAssignment>>(
            `/airport-package-assignments/${id}`,
            data
        );
    },

    async delete(id: string): Promise<{ status: string; message: string }> {
        return apiClient.delete<{ status: string; message: string }>(
            `/airport-package-assignments/${id}`
        );
    },

    async toggleActive(
        id: string
    ): Promise<ApiResponse<AirportPackageAssignment>> {
        return apiClient.patch<ApiResponse<AirportPackageAssignment>>(
            `/airport-package-assignments/${id}/toggle-active`
        );
    },
};
