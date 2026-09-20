import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { additionalChargeService } from '@/services/additionalChargeService';
import type {
    CreateAdditionalChargeData,
    UpdateAdditionalChargeData,
    AdditionalChargeFilters,
} from '@/shared/types/additional-charge.types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';

/* Query Keys */
export const additionalChargeKeys = {
    all: ['additional-charges'] as const,
    lists: () => [...additionalChargeKeys.all, 'list'] as const,
    list: (filters: AdditionalChargeFilters) =>
        [...additionalChargeKeys.lists(), filters] as const,
    details: () => [...additionalChargeKeys.all, 'detail'] as const,
    detail: (id: string) => [...additionalChargeKeys.details(), id] as const,
};

/* Queries */
export function useAdditionalCharges(filters: AdditionalChargeFilters = {}) {
    return useQuery({
        queryKey: additionalChargeKeys.list(filters),
        queryFn: () => additionalChargeService.list(filters),
        placeholderData: keepPreviousData,
    });
}

export function useAdditionalCharge(id: string) {
    return useQuery({
        queryKey: additionalChargeKeys.detail(id),
        queryFn: () => additionalChargeService.get(id),
        enabled: !!id,
    });
}

/* Mutations */
export function useCreateAdditionalCharge() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateAdditionalChargeData) =>
            additionalChargeService.create(data),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: additionalChargeKeys.lists(),
            });
            toast.success(res.message || 'Charge created successfully', {
                id: 'charge-create',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to create charge'), {
                id: 'charge-create-error',
            });
        },
    });
}

export function useUpdateAdditionalCharge() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: UpdateAdditionalChargeData;
        }) => additionalChargeService.update(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: additionalChargeKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: additionalChargeKeys.detail(res.data.id),
            });
            toast.success(res.message || 'Charge updated successfully', {
                id: 'charge-update',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to update charge'), {
                id: 'charge-update-error',
            });
        },
    });
}

export function useDeleteAdditionalCharge() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => additionalChargeService.delete(id),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: additionalChargeKeys.lists(),
            });
            toast.success(res.message || 'Charge deleted successfully', {
                id: 'charge-delete',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to delete charge'), {
                id: 'charge-delete-error',
            });
        },
    });
}
