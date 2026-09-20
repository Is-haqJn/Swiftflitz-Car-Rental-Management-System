import { apiClient } from '@/shared/api/apiClient';
import type {
    Branch,
    CreateBranchData,
    UpdateBranchData,
    BranchFilters,
} from '@/shared/types/branch.types';
import type { ApiResponse, PaginatedResponse } from '@/shared/types';

export const branchService = {
    async list(
        filters: BranchFilters = {}
    ): Promise<PaginatedResponse<Branch>> {
        const params: Record<string, unknown> = {};
        if (filters.page) params.page = filters.page;
        if (filters.per_page) params.per_page = filters.per_page;
        if (filters.search) params.search = filters.search;
        if (filters.is_active !== undefined)
            params['filter[is_active]'] = filters.is_active;

        return apiClient.get<PaginatedResponse<Branch>>('/branches', {
            params,
        });
    },

    async get(id: string): Promise<ApiResponse<Branch>> {
        return apiClient.get<ApiResponse<Branch>>(`/branches/${id}`);
    },

    async active(): Promise<ApiResponse<Branch[]>> {
        return apiClient.get<ApiResponse<Branch[]>>('/branches/active');
    },

    async create(data: CreateBranchData): Promise<ApiResponse<Branch>> {
        return apiClient.post<ApiResponse<Branch>>('/branches', data);
    },

    async update(
        id: string,
        data: UpdateBranchData
    ): Promise<ApiResponse<Branch>> {
        return apiClient.put<ApiResponse<Branch>>(`/branches/${id}`, data);
    },

    async delete(id: string): Promise<{ status: string; message: string }> {
        return apiClient.delete<{ status: string; message: string }>(
            `/branches/${id}`
        );
    },

    async toggleActive(id: string): Promise<ApiResponse<Branch>> {
        return apiClient.patch<ApiResponse<Branch>>(
            `/branches/${id}/toggle-active`
        );
    },

    async vacate(
        id: string,
        data: { action: 'unassign' | 'transfer'; target_branch_id?: string }
    ): Promise<ApiResponse<null>> {
        return apiClient.post<ApiResponse<null>>(
            `/branches/${id}/vacate`,
            data
        );
    },

    async assignManagers(
        id: string,
        userIds: string[]
    ): Promise<ApiResponse<Branch>> {
        return apiClient.post<ApiResponse<Branch>>(`/branches/${id}/managers`, {
            user_ids: userIds,
        });
    },
};
