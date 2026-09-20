import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { discountRuleService } from '@/services/discountRuleService';
import type {
    CreateDiscountRuleData,
    UpdateDiscountRuleData,
    DiscountRuleFilters,
    DiscountUsageFilters,
} from '@/shared/types/discount-rule.types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';

/* Query Keys */
export const discountRuleKeys = {
    all: ['discount-rules'] as const,
    lists: () => [...discountRuleKeys.all, 'list'] as const,
    list: (filters: DiscountRuleFilters) =>
        [...discountRuleKeys.lists(), filters] as const,
    details: () => [...discountRuleKeys.all, 'detail'] as const,
    detail: (id: string) => [...discountRuleKeys.details(), id] as const,
};

export const discountUsageKeys = {
    all: ['discount-usages'] as const,
    lists: () => [...discountUsageKeys.all, 'list'] as const,
    list: (filters: DiscountUsageFilters) =>
        [...discountUsageKeys.lists(), filters] as const,
};

/* Queries */
export function useDiscountRules(filters: DiscountRuleFilters = {}) {
    return useQuery({
        queryKey: discountRuleKeys.list(filters),
        queryFn: () => discountRuleService.list(filters),
        placeholderData: keepPreviousData,
    });
}

export function useDiscountRule(id: string) {
    return useQuery({
        queryKey: discountRuleKeys.detail(id),
        queryFn: () => discountRuleService.get(id),
        enabled: !!id,
    });
}

export function useDiscountUsages(filters: DiscountUsageFilters = {}) {
    return useQuery({
        queryKey: discountUsageKeys.list(filters),
        queryFn: () => discountRuleService.listUsages(filters),
        placeholderData: keepPreviousData,
    });
}

/* Mutations */
export function useCreateDiscountRule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateDiscountRuleData) =>
            discountRuleService.create(data),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: discountRuleKeys.lists(),
            });
            toast.success(res.message || 'Discount rule created successfully', {
                id: 'discount-rule-create',
            });
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to create discount rule'),
                { id: 'discount-rule-create-error' }
            );
        },
    });
}

export function useUpdateDiscountRule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: UpdateDiscountRuleData;
        }) => discountRuleService.update(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: discountRuleKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: discountRuleKeys.detail(res.data.id),
            });
            toast.success(res.message || 'Discount rule updated successfully', {
                id: 'discount-rule-update',
            });
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to update discount rule'),
                { id: 'discount-rule-update-error' }
            );
        },
    });
}

export function useDeleteDiscountRule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => discountRuleService.delete(id),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: discountRuleKeys.lists(),
            });
            toast.success(res.message || 'Discount rule deleted successfully', {
                id: 'discount-rule-delete',
            });
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to delete discount rule'),
                { id: 'discount-rule-delete-error' }
            );
        },
    });
}
