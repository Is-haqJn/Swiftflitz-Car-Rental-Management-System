import { apiClient } from '@/shared/api/apiClient';
import type {
    FleetVehicle,
    CreateFleetVehicleData,
    FleetVehicleFilters,
} from '@/shared/types/fleetVehicle.types';
import type { ApiResponse, PaginatedResponse } from '@/shared/types';

export const fleetVehicleService = {
    async list(
        filters: FleetVehicleFilters = {}
    ): Promise<PaginatedResponse<FleetVehicle>> {
        return apiClient.get<PaginatedResponse<FleetVehicle>>(
            '/fleet-vehicles',
            { params: filters }
        );
    },

    async get(id: string): Promise<ApiResponse<FleetVehicle>> {
        return apiClient.get<ApiResponse<FleetVehicle>>(
            `/fleet-vehicles/${id}`
        );
    },

    async create(
        data: CreateFleetVehicleData
    ): Promise<ApiResponse<FleetVehicle>> {
        return apiClient.post<ApiResponse<FleetVehicle>>(
            '/fleet-vehicles',
            data
        );
    },

    async update(
        id: string,
        data: CreateFleetVehicleData
    ): Promise<ApiResponse<FleetVehicle>> {
        return apiClient.put<ApiResponse<FleetVehicle>>(
            `/fleet-vehicles/${id}`,
            data
        );
    },

    async delete(id: string): Promise<ApiResponse<null>> {
        return apiClient.delete<ApiResponse<null>>(`/fleet-vehicles/${id}`);
    },

    async updateStatus(
        id: string,
        status: string
    ): Promise<ApiResponse<FleetVehicle>> {
        return apiClient.patch<ApiResponse<FleetVehicle>>(
            `/fleet-vehicles/${id}/status`,
            { status }
        );
    },

    async toggleActive(id: string): Promise<ApiResponse<FleetVehicle>> {
        return apiClient.patch<ApiResponse<FleetVehicle>>(
            `/fleet-vehicles/${id}/toggle`
        );
    },

    async uploadPhoto(
        id: string,
        file: File
    ): Promise<ApiResponse<FleetVehicle>> {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post<ApiResponse<FleetVehicle>>(
            `/fleet-vehicles/${id}/photos`,
            formData
        );
    },

    async setPrimaryPhoto(
        id: string,
        mediaId: string
    ): Promise<ApiResponse<FleetVehicle>> {
        return apiClient.patch<ApiResponse<FleetVehicle>>(
            `/fleet-vehicles/${id}/photos/${mediaId}/primary`
        );
    },

    async deletePhoto(
        id: string,
        mediaId: string
    ): Promise<ApiResponse<FleetVehicle>> {
        return apiClient.delete<ApiResponse<FleetVehicle>>(
            `/fleet-vehicles/${id}/photos/${mediaId}`
        );
    },

    async assignServices(
        id: string,
        data: {
            chauffeur_enabled: boolean;
            chauffeur_category_id?: string | null;
            chauffeur_base_price?: number | null;
            airport_enabled: boolean;
            airport_package_ids?: string[];
        }
    ): Promise<ApiResponse<FleetVehicle>> {
        return apiClient.patch<ApiResponse<FleetVehicle>>(
            `/fleet-vehicles/${id}/services`,
            data
        );
    },

    async availableForAirport(): Promise<ApiResponse<FleetVehicle[]>> {
        return apiClient.get<ApiResponse<FleetVehicle[]>>(
            '/fleet-vehicles/available/airport'
        );
    },

    async availableForChauffeur(): Promise<ApiResponse<FleetVehicle[]>> {
        return apiClient.get<ApiResponse<FleetVehicle[]>>(
            '/fleet-vehicles/available/chauffeur'
        );
    },
};
