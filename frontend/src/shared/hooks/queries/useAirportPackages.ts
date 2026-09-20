import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { airportPackageService } from '@/services/airportPackageService';
import type {
    AirportPackageFilters,
    CreateAirportPackageData,
    UpdateAirportPackageData,
} from '@/shared/types/airport-package.types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';

/* Query Keys */
export const airportPackageKeys = {
    all: ['airport-packages'] as const,
    lists: () => [...airportPackageKeys.all, 'list'] as const,
    list: (filters: AirportPackageFilters) =>
        [...airportPackageKeys.lists(), filters] as const,
    details: () => [...airportPackageKeys.all, 'detail'] as const,
    detail: (id: string) => [...airportPackageKeys.details(), id] as const,
    forPickup: () => [...airportPackageKeys.all, 'for-pickup'] as const,
    forDropoff: () => [...airportPackageKeys.all, 'for-dropoff'] as const,
};

/* Queries */
export function useAirportPackages(filters: AirportPackageFilters = {}) {
    return useQuery({
        queryKey: airportPackageKeys.list(filters),
        queryFn: () => airportPackageService.list(filters),
        placeholderData: keepPreviousData,
    });
}

export function useAirportPackage(id: string) {
    return useQuery({
        queryKey: airportPackageKeys.detail(id),
        queryFn: () => airportPackageService.get(id),
        enabled: !!id,
    });
}

export function useAirportPackagesForPickup() {
    return useQuery({
        queryKey: airportPackageKeys.forPickup(),
        queryFn: () => airportPackageService.forPickup(),
        staleTime: 1000 * 60 * 5,
    });
}

export function useAirportPackagesForDropoff() {
    return useQuery({
        queryKey: airportPackageKeys.forDropoff(),
        queryFn: () => airportPackageService.forDropoff(),
        staleTime: 1000 * 60 * 5,
    });
}

/* Mutations */
export function useCreateAirportPackage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateAirportPackageData) =>
            airportPackageService.create(data),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: airportPackageKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: airportPackageKeys.forPickup(),
            });
            queryClient.invalidateQueries({
                queryKey: airportPackageKeys.forDropoff(),
            });
            toast.success(res.message || 'Package created successfully', {
                id: 'airport-package-create',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to create package'), {
                id: 'airport-package-create-error',
            });
        },
    });
}

export function useUpdateAirportPackage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: UpdateAirportPackageData;
        }) => airportPackageService.update(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: airportPackageKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: airportPackageKeys.details(),
            });
            queryClient.invalidateQueries({
                queryKey: airportPackageKeys.forPickup(),
            });
            queryClient.invalidateQueries({
                queryKey: airportPackageKeys.forDropoff(),
            });
            toast.success(res.message || 'Package updated successfully', {
                id: 'airport-package-update',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to update package'), {
                id: 'airport-package-update-error',
            });
        },
    });
}

export function useDeleteAirportPackage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => airportPackageService.delete(id),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: airportPackageKeys.lists(),
            });
            toast.success(res.message || 'Package deleted successfully', {
                id: 'airport-package-delete',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to delete package'), {
                id: 'airport-package-delete-error',
            });
        },
    });
}

export function useUploadAirportPackagePhoto() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, file }: { id: string; file: File }) =>
            airportPackageService.uploadPhoto(id, file),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({
                queryKey: airportPackageKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: airportPackageKeys.detail(id),
            });
            toast.success(res.message || 'Photo uploaded successfully', {
                id: 'airport-package-photo',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to upload photo'), {
                id: 'airport-package-photo-error',
            });
        },
    });
}

export function useToggleAirportPackageActive() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => airportPackageService.toggleActive(id),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: airportPackageKeys.lists(),
            });
            toast.success(res.message || 'Package status updated', {
                id: 'airport-package-toggle',
            });
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to update package status'),
                { id: 'airport-package-toggle-error' }
            );
        },
    });
}
