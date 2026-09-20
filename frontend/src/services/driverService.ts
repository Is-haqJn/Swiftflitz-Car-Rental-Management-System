import { apiClient } from '@/shared/api/apiClient';
import type {
    Driver,
    CreateDriverPayload,
    UpdateDriverPayload,
    DriverFilters,
} from '@/shared/types/driver.types';
import type { ApiResponse, PaginatedResponse } from '@/shared/types';

const SPATIE_FILTER_FIELDS: (keyof DriverFilters)[] = [
    'status',
    'available_for_chauffeur',
    'available_for_airport',
    'is_active',
    'license_status',
];

function buildDriverParams(filters: DriverFilters): Record<string, unknown> {
    const params: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null) {
            continue;
        }
        if (SPATIE_FILTER_FIELDS.includes(key as keyof DriverFilters)) {
            params[`filter[${key}]`] = value;
        } else {
            params[key] = value;
        }
    }
    return params;
}

export const driverService = {
    async list(
        filters: DriverFilters = {}
    ): Promise<PaginatedResponse<Driver>> {
        return apiClient.get<PaginatedResponse<Driver>>('/drivers', {
            params: buildDriverParams(filters),
        });
    },

    async get(id: string): Promise<ApiResponse<Driver>> {
        return apiClient.get<ApiResponse<Driver>>(`/drivers/${id}`);
    },

    async create(data: CreateDriverPayload): Promise<ApiResponse<Driver>> {
        return apiClient.post<ApiResponse<Driver>>('/drivers', data);
    },

    async update(
        id: string,
        data: UpdateDriverPayload
    ): Promise<ApiResponse<Driver>> {
        return apiClient.put<ApiResponse<Driver>>(`/drivers/${id}`, data);
    },

    async delete(id: string): Promise<ApiResponse<null>> {
        return apiClient.delete<ApiResponse<null>>(`/drivers/${id}`);
    },

    async updateStatus(
        id: string,
        status: string
    ): Promise<ApiResponse<Driver>> {
        return apiClient.patch<ApiResponse<Driver>>(`/drivers/${id}/status`, {
            status,
        });
    },

    async availableForChauffeur(): Promise<ApiResponse<Driver[]>> {
        return apiClient.get<ApiResponse<Driver[]>>(
            '/drivers/available/chauffeur'
        );
    },

    async availableForAirport(): Promise<ApiResponse<Driver[]>> {
        return apiClient.get<ApiResponse<Driver[]>>(
            '/drivers/available/airport'
        );
    },

    async uploadPhoto(id: string, file: File): Promise<ApiResponse<Driver>> {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post<ApiResponse<Driver>>(
            `/drivers/${id}/media/photo`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
    },

    async uploadIdDocument(
        id: string,
        file: File
    ): Promise<ApiResponse<Driver>> {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post<ApiResponse<Driver>>(
            `/drivers/${id}/media/id-document`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
    },

    async uploadLicensePhoto(
        id: string,
        file: File
    ): Promise<ApiResponse<Driver>> {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post<ApiResponse<Driver>>(
            `/drivers/${id}/media/license-photo`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
    },
};
