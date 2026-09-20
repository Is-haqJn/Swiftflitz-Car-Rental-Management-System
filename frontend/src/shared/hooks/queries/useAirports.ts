import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { airportService } from '@/services/airportService';
import type {
    AirportFilters,
    CreateAirportData,
    UpdateAirportData,
} from '@/shared/types/airport.types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';

/* Query Keys */
export const airportKeys = {
    all: ['airports'] as const,
    lists: () => [...airportKeys.all, 'list'] as const,
    list: (filters: AirportFilters) =>
        [...airportKeys.lists(), filters] as const,
    details: () => [...airportKeys.all, 'detail'] as const,
    detail: (id: string) => [...airportKeys.details(), id] as const,
    active: () => [...airportKeys.all, 'active'] as const,
};

/* Queries */
export function useAirports(filters: AirportFilters = {}) {
    return useQuery({
        queryKey: airportKeys.list(filters),
        queryFn: () => airportService.list(filters),
        placeholderData: keepPreviousData,
    });
}

export function useAirport(id: string) {
    return useQuery({
        queryKey: airportKeys.detail(id),
        queryFn: () => airportService.get(id),
        enabled: !!id,
    });
}

export function useActiveAirports() {
    return useQuery({
        queryKey: airportKeys.active(),
        queryFn: () => airportService.active(),
        staleTime: 1000 * 60 * 5,
    });
}

/* Mutations */
export function useCreateAirport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateAirportData) => airportService.create(data),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: airportKeys.lists() });
            queryClient.invalidateQueries({ queryKey: airportKeys.active() });
            toast.success(res.message || 'Airport created successfully', {
                id: 'airport-create',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to create airport'), {
                id: 'airport-create-error',
            });
        },
    });
}

export function useUpdateAirport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: UpdateAirportData;
        }) => airportService.update(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: airportKeys.lists() });
            queryClient.invalidateQueries({ queryKey: airportKeys.details() });
            queryClient.invalidateQueries({ queryKey: airportKeys.active() });
            toast.success(res.message || 'Airport updated successfully', {
                id: 'airport-update',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to update airport'), {
                id: 'airport-update-error',
            });
        },
    });
}

export function useDeleteAirport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => airportService.delete(id),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: airportKeys.lists() });
            queryClient.invalidateQueries({ queryKey: airportKeys.active() });
            toast.success(res.message || 'Airport deleted successfully', {
                id: 'airport-delete',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to delete airport'), {
                id: 'airport-delete-error',
            });
        },
    });
}

export function useToggleAirportActive() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => airportService.toggleActive(id),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: airportKeys.lists() });
            queryClient.invalidateQueries({ queryKey: airportKeys.active() });
            toast.success(res.message || 'Airport status updated', {
                id: 'airport-toggle',
            });
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to update airport status'),
                { id: 'airport-toggle-error' }
            );
        },
    });
}

export function useSetAirportAsDefault() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => airportService.setAsDefault(id),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: airportKeys.lists() });
            queryClient.invalidateQueries({ queryKey: airportKeys.active() });
            toast.success(res.message || 'Default airport updated', {
                id: 'airport-set-default',
            });
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to set default airport'),
                { id: 'airport-set-default-error' }
            );
        },
    });
}
