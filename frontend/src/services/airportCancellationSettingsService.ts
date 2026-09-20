import { apiClient } from '@/shared/api/apiClient';
import { API_ENDPOINTS } from '@/shared/api/endpoints';
import type { ApiResponse } from '@/shared/types';
import type { AirportCancellationSettingsData } from '@/shared/types';

export const airportCancellationSettingsService = {
    async getSettings(): Promise<ApiResponse<AirportCancellationSettingsData>> {
        return apiClient.get<ApiResponse<AirportCancellationSettingsData>>(
            API_ENDPOINTS.AIRPORT_CANCELLATION_SETTINGS.BASE
        );
    },

    async updateSettings(
        data: AirportCancellationSettingsData
    ): Promise<ApiResponse<AirportCancellationSettingsData>> {
        return apiClient.put<ApiResponse<AirportCancellationSettingsData>>(
            API_ENDPOINTS.AIRPORT_CANCELLATION_SETTINGS.BASE,
            data
        );
    },
};
