import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { couponService } from '@/services/couponService';
import type {
    CreateCouponData,
    UpdateCouponData,
    CouponFilters,
} from '@/shared/types/coupon.types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';

/* Query Keys */
export const couponKeys = {
    all: ['coupons'] as const,
    lists: () => [...couponKeys.all, 'list'] as const,
    list: (filters: CouponFilters) => [...couponKeys.lists(), filters] as const,
    details: () => [...couponKeys.all, 'detail'] as const,
    detail: (id: string) => [...couponKeys.details(), id] as const,
};

/* Queries */
export function useCoupons(filters: CouponFilters = {}) {
    return useQuery({
        queryKey: couponKeys.list(filters),
        queryFn: () => couponService.list(filters),
        placeholderData: keepPreviousData,
    });
}

export function useCoupon(id: string) {
    return useQuery({
        queryKey: couponKeys.detail(id),
        queryFn: () => couponService.get(id),
        enabled: !!id,
    });
}

/* Mutations */
export function useCreateCoupon() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCouponData) => couponService.create(data),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
            toast.success(res.message || 'Coupon created successfully', {
                id: 'coupon-create',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to create coupon'), {
                id: 'coupon-create-error',
            });
        },
    });
}

export function useUpdateCoupon() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: UpdateCouponData;
        }) => couponService.update(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: couponKeys.detail(res.data.id),
            });
            toast.success(res.message || 'Coupon updated successfully', {
                id: 'coupon-update',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to update coupon'), {
                id: 'coupon-update-error',
            });
        },
    });
}

export function useDeleteCoupon() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => couponService.delete(id),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
            toast.success(res.message || 'Coupon deleted successfully', {
                id: 'coupon-delete',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to delete coupon'), {
                id: 'coupon-delete-error',
            });
        },
    });
}
