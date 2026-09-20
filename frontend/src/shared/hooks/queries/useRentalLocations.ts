import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { rentalLocationService } from '@/services/rentalLocationService';
import type {
    CreateRentalLocationData,
    UpdateRentalLocationData,
    RentalLocationFilters,
} from '@/shared/types/rental-location.types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';

/* Query Keys */
export const rentalLocationKeys = {
    all: ['rental-locations'] as const,
    lists: () => [...rentalLocationKeys.all, 'list'] as const,
    list: (filters: RentalLocationFilters) =>
        [...rentalLocationKeys.lists(), filters] as const,
    details: () => [...rentalLocationKeys.all, 'detail'] as const,
    detail: (id: string) => [...rentalLocationKeys.details(), id] as const,
};

/* Queries */
export function useRentalLocations(filters: RentalLocationFilters = {}) {
    return useQuery({
        queryKey: rentalLocationKeys.list(filters),
        queryFn: () => rentalLocationService.list(filters),
        placeholderData: keepPreviousData,
    });
}

export function useRentalLocation(id: string) {
    return useQuery({
        queryKey: rentalLocationKeys.detail(id),
        queryFn: () => rentalLocationService.get(id),
        enabled: !!id,
    });
}

/* Mutations */
export function useCreateRentalLocation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateRentalLocationData) =>
            rentalLocationService.create(data),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: rentalLocationKeys.lists(),
            });
            toast.success(res.message || 'Location created successfully', {
                id: 'location-create',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to create location'), {
                id: 'location-create-error',
            });
        },
    });
}

export function useUpdateRentalLocation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: UpdateRentalLocationData;
        }) => rentalLocationService.update(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: rentalLocationKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: rentalLocationKeys.detail(res.data.id),
            });
            toast.success(res.message || 'Location updated successfully', {
                id: 'location-update',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to update location'), {
                id: 'location-update-error',
            });
        },
    });
}

export function useDeleteRentalLocation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => rentalLocationService.delete(id),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: rentalLocationKeys.lists(),
            });
            toast.success(res.message || 'Location deleted successfully', {
                id: 'location-delete',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to delete location'), {
                id: 'location-delete-error',
            });
        },
    });
}
