import { apiClient } from '@/shared/api/apiClient';
import type {
    Feature,
    CreateFeatureData,
    UpdateFeatureData,
    ApiResponse,
    GenericFilters,
    PaginatedResponse,
} from '@/shared/types';

export const featureService = {
    // Paginated list (for AllFeatures table)
    async list(
        filters: GenericFilters = {}
    ): Promise<PaginatedResponse<Feature>> {
        const response = await apiClient.get<PaginatedResponse<Feature>>(
            '/features',
            { params: filters }
        );
        return response;
    },

    // All active features (for vehicle form checkboxes)
    // ApiResponse trait wraps collections as { data: { data: [...] } }
    async active(): Promise<Feature[]> {
        const response =
            await apiClient.get<ApiResponse<Feature[]>>('/features/active');
        return response.data;
    },

    async create(data: CreateFeatureData): Promise<ApiResponse<Feature>> {
        const response = await apiClient.post<ApiResponse<Feature>>(
            '/features',
            data
        );
        return response;
    },

    async update(
        id: string,
        data: UpdateFeatureData
    ): Promise<ApiResponse<Feature>> {
        const response = await apiClient.put<ApiResponse<Feature>>(
            `/features/${id}`,
            data
        );
        return response;
    },

    async delete(id: string): Promise<{ status: string; message: string }> {
        const response = await apiClient.delete<{
            status: string;
            message: string;
        }>(`/features/${id}`);
        return response;
    },
};
