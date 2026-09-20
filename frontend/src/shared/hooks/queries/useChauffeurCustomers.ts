import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { chauffeurCustomerService } from '@/services/chauffeurCustomerService';
import type {
    ChauffeurCustomer,
    CreateChauffeurCustomerData,
    UpdateChauffeurCustomerData,
    ChauffeurCustomerFilters,
} from '@/shared/types/chauffeur-customer.types';
import type { ApiResponse } from '@/shared/types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';

/* Query Keys */
export const chauffeurCustomerKeys = {
    all: ['chauffeur-customers'] as const,
    lists: () => [...chauffeurCustomerKeys.all, 'list'] as const,
    list: (filters: ChauffeurCustomerFilters) =>
        [...chauffeurCustomerKeys.lists(), filters] as const,
    details: () => [...chauffeurCustomerKeys.all, 'detail'] as const,
    detail: (id: string) => [...chauffeurCustomerKeys.details(), id] as const,
    lookup: (email: string) =>
        [...chauffeurCustomerKeys.all, 'lookup', email] as const,
};

/* Queries */
export function useChauffeurCustomers(filters: ChauffeurCustomerFilters = {}) {
    return useQuery({
        queryKey: chauffeurCustomerKeys.list(filters),
        queryFn: () => chauffeurCustomerService.list(filters),
        placeholderData: keepPreviousData,
    });
}

export function useChauffeurCustomer(id: string) {
    return useQuery<ApiResponse<ChauffeurCustomer>>({
        queryKey: chauffeurCustomerKeys.detail(id),
        queryFn: () => chauffeurCustomerService.get(id),
        enabled: !!id,
    });
}

export function useLookupChauffeurCustomer(email: string) {
    return useQuery<ApiResponse<ChauffeurCustomer>>({
        queryKey: chauffeurCustomerKeys.lookup(email),
        queryFn: () => chauffeurCustomerService.lookup(email),
        enabled: !!email,
        retry: false,
    });
}

/* Mutations */
export function useCreateChauffeurCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateChauffeurCustomerData) =>
            chauffeurCustomerService.create(payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: chauffeurCustomerKeys.lists(),
            });
            toast.success(res?.message || 'Customer created successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to create customer.'));
        },
    });
}

export function useUpdateChauffeurCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: UpdateChauffeurCustomerData;
        }) => chauffeurCustomerService.update(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: chauffeurCustomerKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: chauffeurCustomerKeys.detail(res.data.id),
            });
            toast.success(res?.message || 'Customer updated successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to update customer.'));
        },
    });
}

export function useDeleteChauffeurCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => chauffeurCustomerService.delete(id),
        onSuccess: data => {
            queryClient.invalidateQueries({
                queryKey: chauffeurCustomerKeys.lists(),
            });
            toast.success(data.message || 'Customer deleted successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to delete customer.'));
        },
    });
}
