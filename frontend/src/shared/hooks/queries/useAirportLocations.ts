import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { airportLocationService } from '@/services/airportLocationService';
import type {
    AirportLocationFilters,
    CreateAirportLocationData,
    UpdateAirportLocationData,
} from '@/shared/types/airport-location.types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';

/* Query Keys */
export const airportLocationKeys = {
    all: ['airport-locations'] as const,
    lists: () => [...airportLocationKeys.all, 'list'] as const,
    list: (filters: AirportLocationFilters) =>
        [...airportLocationKeys.lists(), filters] as const,
    details: () => [...airportLocationKeys.all, 'detail'] as const,
    detail: (id: string) => [...airportLocationKeys.details(), id] as const,
    terminals: (airportId: string) =>
        [...airportLocationKeys.all, 'terminals', airportId] as const,
    areas: (branchId: string) =>
        [...airportLocationKeys.all, 'areas', branchId] as const,
};

/* Queries */
export function useAirportLocations(filters: AirportLocationFilters = {}) {
    return useQuery({
        queryKey: airportLocationKeys.list(filters),
        queryFn: () => airportLocationService.list(filters),
        placeholderData: keepPreviousData,
    });
}

export function useAirportLocation(id: string) {
    return useQuery({
        queryKey: airportLocationKeys.detail(id),
        queryFn: () => airportLocationService.get(id),
        enabled: !!id,
    });
}

export function useAirportTerminals(airportId: string) {
    return useQuery({
        queryKey: airportLocationKeys.terminals(airportId),
        queryFn: () => airportLocationService.terminals(airportId),
        enabled: !!airportId,
        staleTime: 1000 * 60 * 5,
    });
}

export function useAirportAreas(branchId: string) {
    return useQuery({
        queryKey: airportLocationKeys.areas(branchId),
        queryFn: () => airportLocationService.areas(branchId),
        enabled: !!branchId,
        staleTime: 1000 * 60 * 5,
    });
}

/* Mutations */
export function useCreateAirportLocation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateAirportLocationData) =>
            airportLocationService.create(data),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: airportLocationKeys.lists(),
            });
            toast.success(
                res.message || 'Airport location created successfully',
                { id: 'airport-location-create' }
            );
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to create airport location'),
                { id: 'airport-location-create-error' }
            );
        },
    });
}

export function useUpdateAirportLocation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: UpdateAirportLocationData;
        }) => airportLocationService.update(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: airportLocationKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: airportLocationKeys.details(),
            });
            toast.success(
                res.message || 'Airport location updated successfully',
                { id: 'airport-location-update' }
            );
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to update airport location'),
                { id: 'airport-location-update-error' }
            );
        },
    });
}

export function useDeleteAirportLocation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => airportLocationService.delete(id),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: airportLocationKeys.lists(),
            });
            toast.success(
                res.message || 'Airport location deleted successfully',
                { id: 'airport-location-delete' }
            );
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to delete airport location'),
                { id: 'airport-location-delete-error' }
            );
        },
    });
}

export function useToggleAirportLocationActive() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => airportLocationService.toggleActive(id),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: airportLocationKeys.lists(),
            });
            toast.success(res.message || 'Location status updated', {
                id: 'airport-location-toggle',
            });
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to update location status'),
                { id: 'airport-location-toggle-error' }
            );
        },
    });
}
