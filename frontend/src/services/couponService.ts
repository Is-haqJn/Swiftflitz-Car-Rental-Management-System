import { apiClient } from '@/shared/api/apiClient';
import type {
    DiscountCoupon,
    CreateCouponData,
    UpdateCouponData,
    CouponFilters,
} from '@/shared/types/coupon.types';
import type { ApiResponse, PaginatedResponse } from '@/shared/types';

export const couponService = {
    async list(
        filters: CouponFilters = {}
    ): Promise<PaginatedResponse<DiscountCoupon>> {
        return apiClient.get<PaginatedResponse<DiscountCoupon>>('/coupons', {
            params: filters,
        });
    },

    async get(id: string): Promise<ApiResponse<DiscountCoupon>> {
        return apiClient.get<ApiResponse<DiscountCoupon>>(`/coupons/${id}`);
    },

    async create(data: CreateCouponData): Promise<ApiResponse<DiscountCoupon>> {
        return apiClient.post<ApiResponse<DiscountCoupon>>('/coupons', data);
    },

    async update(
        id: string,
        data: UpdateCouponData
    ): Promise<ApiResponse<DiscountCoupon>> {
        return apiClient.put<ApiResponse<DiscountCoupon>>(
            `/coupons/${id}`,
            data
        );
    },

    async delete(id: string): Promise<{ status: string; message: string }> {
        return apiClient.delete<{ status: string; message: string }>(
            `/coupons/${id}`
        );
    },

    async validateCode(
        code: string,
        customerId?: string,
        context?: string,
        contextId?: string
    ): Promise<ApiResponse<DiscountCoupon>> {
        return apiClient.get<ApiResponse<DiscountCoupon>>('/coupons/validate', {
            params: {
                code,
                ...(customerId ? { customer_id: customerId } : {}),
                ...(context ? { context } : {}),
                ...(contextId ? { context_id: contextId } : {}),
            },
        });
    },
};
