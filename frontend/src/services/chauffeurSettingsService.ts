import { apiClient } from '@/shared/api/apiClient';
import type {
    ChauffeurSettings,
    PublicChauffeurSettings,
    UpdateChauffeurSettingsData,
} from '@/shared/types/chauffeur-settings.types';
import type { ApiResponse } from '@/shared/types';

export const chauffeurSettingsService = {
    async getPublic(): Promise<ApiResponse<PublicChauffeurSettings>> {
        return apiClient.get<ApiResponse<PublicChauffeurSettings>>(
            '/public/chauffeur-settings'
        );
    },

    async get(): Promise<ApiResponse<ChauffeurSettings>> {
        return apiClient.get<ApiResponse<ChauffeurSettings>>(
            '/chauffeur-settings'
        );
    },

    async update(
        data: UpdateChauffeurSettingsData
    ): Promise<ApiResponse<ChauffeurSettings>> {
        return apiClient.put<ApiResponse<ChauffeurSettings>>(
            '/chauffeur-settings',
            data
        );
    },
};
