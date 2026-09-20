import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { airportCustomerService } from '@/services/airportCustomerService';
import type {
    AirportCustomer,
    CreateAirportCustomerData,
    UpdateAirportCustomerData,
    AirportCustomerFilters,
} from '@/shared/types/airport-customer.types';
import type { ApiResponse } from '@/shared/types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';

/* Query Keys */
export const airportCustomerKeys = {
    all: ['airport-customers'] as const,
    lists: () => [...airportCustomerKeys.all, 'list'] as const,
    list: (filters: AirportCustomerFilters) =>
        [...airportCustomerKeys.lists(), filters] as const,
    details: () => [...airportCustomerKeys.all, 'detail'] as const,
    detail: (id: string) => [...airportCustomerKeys.details(), id] as const,
    lookup: (email: string) =>
        [...airportCustomerKeys.all, 'lookup', email] as const,
};

/* Queries */
export function useAirportCustomers(filters: AirportCustomerFilters = {}) {
    return useQuery({
        queryKey: airportCustomerKeys.list(filters),
        queryFn: () => airportCustomerService.list(filters),
        placeholderData: keepPreviousData,
    });
}

export function useAirportCustomer(id: string) {
    return useQuery<ApiResponse<AirportCustomer>>({
        queryKey: airportCustomerKeys.detail(id),
        queryFn: () => airportCustomerService.get(id),
        enabled: !!id,
    });
}

export function useAirportCustomerLookup(email: string) {
    return useQuery({
        queryKey: airportCustomerKeys.lookup(email),
        queryFn: () => airportCustomerService.lookup(email),
        enabled: email.length > 3 && email.includes('@'),
    });
}

/* Mutations */
export function useCreateAirportCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateAirportCustomerData) =>
            airportCustomerService.create(payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: airportCustomerKeys.lists(),
            });
            toast.success(
                res?.message || 'Airport customer created successfully'
            );
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to create airport customer.')
            );
        },
    });
}

export function useUpdateAirportCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: UpdateAirportCustomerData;
        }) => airportCustomerService.update(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: airportCustomerKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: airportCustomerKeys.detail(res.data.id),
            });
            toast.success(
                res?.message || 'Airport customer updated successfully'
            );
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to update airport customer.')
            );
        },
    });
}

export function useDeleteAirportCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => airportCustomerService.delete(id),
        onSuccess: data => {
            queryClient.invalidateQueries({
                queryKey: airportCustomerKeys.lists(),
            });
            toast.success(
                data.message || 'Airport customer deleted successfully'
            );
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to delete airport customer.')
            );
        },
    });
}
