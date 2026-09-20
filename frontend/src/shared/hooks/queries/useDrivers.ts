import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { driverService } from '@/services/driverService';
import { dashboardKeys } from './useDashboard';
import type {
    Driver,
    DriverFilters,
    CreateDriverPayload,
    UpdateDriverPayload,
} from '@/shared/types/driver.types';
import type { ApiResponse } from '@/shared/types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';
import type { AxiosError } from 'axios';

/* Query Keys */
export const driverKeys = {
    all: ['drivers'] as const,
    lists: () => [...driverKeys.all, 'list'] as const,
    list: (filters: DriverFilters) => [...driverKeys.lists(), filters] as const,
    details: () => [...driverKeys.all, 'detail'] as const,
    detail: (id: string) => [...driverKeys.details(), id] as const,
    availableChauffeur: () =>
        [...driverKeys.all, 'available', 'chauffeur'] as const,
    availableAirport: () =>
        [...driverKeys.all, 'available', 'airport'] as const,
};

/* Queries */
export function useDrivers(filters: DriverFilters = {}) {
    return useQuery({
        queryKey: driverKeys.list(filters),
        queryFn: () => driverService.list(filters),
        placeholderData: keepPreviousData,
    });
}

export function useDriver(id: string) {
    return useQuery<ApiResponse<Driver>>({
        queryKey: driverKeys.detail(id),
        queryFn: () => driverService.get(id),
        enabled: !!id,
    });
}

export function useAvailableChauffeursDrivers() {
    return useQuery<ApiResponse<Driver[]>>({
        queryKey: driverKeys.availableChauffeur(),
        queryFn: () => driverService.availableForChauffeur(),
    });
}

export function useAvailableAirportDrivers(enabled = true) {
    return useQuery<ApiResponse<Driver[]>>({
        queryKey: driverKeys.availableAirport(),
        queryFn: () => driverService.availableForAirport(),
        enabled,
    });
}

/* Mutations */
export function useCreateDriver() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateDriverPayload) =>
            driverService.create(payload),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: driverKeys.lists() });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            toast.success(res?.message || 'Driver created successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to create driver.'));
        },
    });
}

export function useUpdateDriver() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: UpdateDriverPayload;
        }) => driverService.update(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: driverKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: driverKeys.detail(res.data.id),
            });
            toast.success(res?.message || 'Driver updated successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to update driver.'));
        },
    });
}

export function useDeleteDriver() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => driverService.delete(id),
        onSuccess: data => {
            queryClient.invalidateQueries({ queryKey: driverKeys.lists() });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            toast.success(data.message || 'Driver deleted successfully');
        },
        onError: (error: AxiosError<{ message: string }>) => {
            toast.error(getErrorMessage(error, 'Failed to delete driver.'), {
                id: 'delete-driver',
            });
        },
    });
}

export function useUpdateDriverStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            driverService.updateStatus(id, status),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: driverKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: driverKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({
                queryKey: driverKeys.availableChauffeur(),
            });
            queryClient.invalidateQueries({
                queryKey: driverKeys.availableAirport(),
            });
            toast.success(res?.message || 'Driver status updated successfully');
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to update driver status.')
            );
        },
    });
}

export function useUploadDriverPhoto() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ driverId, file }: { driverId: string; file: File }) =>
            driverService.uploadPhoto(driverId, file),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: driverKeys.detail(res.data.id),
            });
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to upload driver photo.')
            );
        },
    });
}

export function useUploadDriverIdDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ driverId, file }: { driverId: string; file: File }) =>
            driverService.uploadIdDocument(driverId, file),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: driverKeys.detail(res.data.id),
            });
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to upload ID document.')
            );
        },
    });
}

export function useUploadDriverLicensePhoto() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ driverId, file }: { driverId: string; file: File }) =>
            driverService.uploadLicensePhoto(driverId, file),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: driverKeys.detail(res.data.id),
            });
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to upload license photo.')
            );
        },
    });
}
