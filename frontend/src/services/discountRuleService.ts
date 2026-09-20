import { apiClient } from '@/shared/api/apiClient';
import type {
    DiscountRule,
    CreateDiscountRuleData,
    UpdateDiscountRuleData,
    DiscountRuleFilters,
    RentalDiscountUsage,
    DiscountUsageFilters,
} from '@/shared/types/discount-rule.types';
import type { ApiResponse, PaginatedResponse } from '@/shared/types';

export const discountRuleService = {
    async list(
        filters: DiscountRuleFilters = {}
    ): Promise<PaginatedResponse<DiscountRule>> {
        return apiClient.get<PaginatedResponse<DiscountRule>>(
            '/discount-rules',
            { params: filters }
        );
    },

    async get(id: string): Promise<ApiResponse<DiscountRule>> {
        return apiClient.get<ApiResponse<DiscountRule>>(
            `/discount-rules/${id}`
        );
    },

    async create(
        data: CreateDiscountRuleData
    ): Promise<ApiResponse<DiscountRule>> {
        return apiClient.post<ApiResponse<DiscountRule>>(
            '/discount-rules',
            data
        );
    },

    async update(
        id: string,
        data: UpdateDiscountRuleData
    ): Promise<ApiResponse<DiscountRule>> {
        return apiClient.put<ApiResponse<DiscountRule>>(
            `/discount-rules/${id}`,
            data
        );
    },

    async delete(id: string): Promise<{ status: string; message: string }> {
        return apiClient.delete<{ status: string; message: string }>(
            `/discount-rules/${id}`
        );
    },

    async listUsages(
        filters: DiscountUsageFilters = {}
    ): Promise<PaginatedResponse<RentalDiscountUsage>> {
        return apiClient.get<PaginatedResponse<RentalDiscountUsage>>(
            '/discount-usages',
            { params: filters }
        );
    },
};
