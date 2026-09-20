import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { vehicleService, vehicleImageService } from '@/services/vehicleService';
import { dashboardKeys } from './useDashboard';
import type {
    StoreExpensePayload,
    CompleteMaintenancePayload,
} from '@/shared/types/vehicles.types';
import type {
    VehicleFilters,
    CreateVehicleData,
    UpdateVehicleData,
    ApiResponse,
    Vehicle,
} from '@/shared/types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';
import type { AxiosError } from 'axios';

/* Query Keys */
export const vehicleKeys = {
    all: ['vehicles'] as const,
    lists: () => [...vehicleKeys.all, 'list'] as const,
    list: (filters: VehicleFilters) =>
        [...vehicleKeys.lists(), filters] as const,
    details: () => [...vehicleKeys.all, 'detail'] as const,
    detail: (id: string) => [...vehicleKeys.details(), id] as const,
    featured: () => [...vehicleKeys.all, 'featured'] as const,
    images: (vehicleId: string) =>
        [...vehicleKeys.all, vehicleId, 'images'] as const,
    bookedDates: (vehicleId: string) =>
        [...vehicleKeys.all, vehicleId, 'booked-dates'] as const,
};

/* Vehicle Queries */
export function useVehicles(filters: VehicleFilters = {}) {
    return useQuery({
        queryKey: vehicleKeys.list(filters),
        queryFn: () => vehicleService.list(filters),
        placeholderData: keepPreviousData,
    });
}

//Explicitly type to ApiResponse<Vehicle>
export function useVehicle(id: string) {
    return useQuery<ApiResponse<Vehicle>>({
        queryKey: vehicleKeys.detail(id),
        queryFn: () => vehicleService.get(id),
        enabled: !!id,
    });
}

export function useFeaturedVehicles() {
    return useQuery<ApiResponse<Vehicle[]>>({
        queryKey: vehicleKeys.featured(),
        queryFn: () => vehicleService.featured(),
    });
}

export function useVehicleBookedDates(vehicleId: string | null, excludeRentalId?: string) {
    return useQuery<Array<{ from: string; to: string }>>({
        queryKey: [...vehicleKeys.bookedDates(vehicleId ?? ''), excludeRentalId ?? ''],
        queryFn: () => vehicleService.getBookedDates(vehicleId!, excludeRentalId),
        enabled: !!vehicleId,
    });
}

/* Vehicle Mutations */
export function useCreateVehicle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateVehicleData) =>
            vehicleService.create(payload),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.vehicleUtilization,
            });
            toast.success(res?.message || 'Vehicle created successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to create vehicle.'));
        },
    });
}

export function useUpdateVehicle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: UpdateVehicleData;
        }) => vehicleService.update(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
            // Access nested data.data.id
            queryClient.invalidateQueries({
                queryKey: vehicleKeys.detail(res.data.id),
            });
            toast.success(res?.message || 'Vehicle updated successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to update vehicle.'));
        },
    });
}

export function useDeleteVehicle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => vehicleService.delete(id),
        onSuccess: data => {
            queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.vehicleUtilization,
            });
            toast.success(data.message);
        },
        onError: (error: AxiosError<{ message: string }>) => {
            toast.error(getErrorMessage(error, 'Failed to delete vehicle.'), {
                id: 'delete-vehicle',
            });
        },
    });
}

export function useToggleFeatured() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => vehicleService.toggleFeatured(id),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
            // Access nested data.data.id
            queryClient.invalidateQueries({
                queryKey: vehicleKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: vehicleKeys.featured() });
            toast.success(
                res?.message || 'Featured status toggled successfully'
            );
        },
        onError: (error: AxiosError<{ message: string }>) => {
            toast.error(
                getErrorMessage(error, 'Failed to toggle featured status.'),
                { id: 'toggle-featured' }
            );
        },
    });
}

export function useTogglePriceVisible() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => vehicleService.togglePriceVisible(id),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: vehicleKeys.detail(res.data.id),
            });
            toast.success(
                res?.message || 'Price visibility toggled successfully'
            );
        },
        onError: (error: AxiosError<{ message: string }>) => {
            toast.error(
                getErrorMessage(error, 'Failed to toggle price visibility.'),
                { id: 'toggle-price-visible' }
            );
        },
    });
}

export function useUpdateVehicleStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            vehicleService.updateStatus(id, status),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
            // Access nested data.data.id
            queryClient.invalidateQueries({
                queryKey: vehicleKeys.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.vehicleUtilization,
            });
            toast.success(
                res?.message || 'Vehicle status updated successfully'
            );
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to update vehicle status.')
            );
        },
    });
}

/* Vehicle Image Hooks */
export function useVehicleImages(vehicleId: string) {
    return useQuery({
        queryKey: vehicleKeys.images(vehicleId),
        queryFn: () => vehicleImageService.list(vehicleId),
        enabled: !!vehicleId,
    });
}

export function useUploadVehicleImages() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            vehicleId,
            files,
            onProgress,
            primaryIndex,
        }: {
            vehicleId: string;
            files: File[];
            onProgress?: (percent: number) => void;
            primaryIndex?: number;
        }) =>
            vehicleImageService.upload(
                vehicleId,
                files,
                onProgress,
                primaryIndex
            ),
        onMutate: () =>
            toast.loading(`Uploading image...`, { id: 'upload-images' }),
        onSuccess: (res, variables) => {
            queryClient.invalidateQueries({
                queryKey: vehicleKeys.images(variables.vehicleId),
            });
            queryClient.invalidateQueries({
                queryKey: vehicleKeys.detail(variables.vehicleId),
            });
            toast.success(res?.message || 'Images uploaded successfully', {
                id: 'upload-images',
            });
        },
        onError: (error: AxiosError<{ message: string }>) => {
            toast.error(getErrorMessage(error, 'Failed to upload images.'), {
                id: 'upload-images',
            });
        },
    });
}

export function useSetPrimaryImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            vehicleId,
            mediaId,
        }: {
            vehicleId: string;
            mediaId: number;
        }) => vehicleImageService.setPrimary(vehicleId, mediaId),
        onSuccess: (res, variables) => {
            queryClient.invalidateQueries({
                queryKey: vehicleKeys.images(variables.vehicleId),
            });
            queryClient.invalidateQueries({
                queryKey: vehicleKeys.detail(variables.vehicleId),
            });
            toast.success(res?.message || 'Primary image set successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to set primary image.'));
        },
    });
}

export function useReorderVehicleImages() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            vehicleId,
            imageIds,
        }: {
            vehicleId: string;
            imageIds: number[];
        }) => vehicleImageService.reorder(vehicleId, imageIds),
        onSuccess: (res, variables) => {
            queryClient.invalidateQueries({
                queryKey: vehicleKeys.images(variables.vehicleId),
            });
            toast.success(res?.message || 'Images reordered successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to reorder images.'));
        },
    });
}

export function useDeleteVehicleImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            vehicleId,
            mediaId,
        }: {
            vehicleId: string;
            mediaId: number;
        }) => vehicleImageService.delete(vehicleId, mediaId),
        onSuccess: (res, variables) => {
            queryClient.invalidateQueries({
                queryKey: vehicleKeys.images(variables.vehicleId),
            });
            queryClient.invalidateQueries({
                queryKey: vehicleKeys.detail(variables.vehicleId),
            });
            toast.success(res?.message || 'Image deleted successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to delete image.'));
        },
    });
}

/* Vehicle Expense Hooks */
export function useStoreVehicleExpense() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: StoreExpensePayload) =>
            vehicleService.storeExpense(payload),
        onSuccess: (res, variables) => {
            queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: vehicleKeys.detail(variables.vehicle_id),
            });
            toast.success(res?.message || 'Expense recorded successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to record expense.'));
        },
    });
}

export function useCompleteMaintenance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            vehicleId,
            payload,
        }: {
            vehicleId: string;
            payload: CompleteMaintenancePayload;
        }) => vehicleService.completeMaintenance(vehicleId, payload),
        onSuccess: (res, variables) => {
            queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: vehicleKeys.detail(variables.vehicleId),
            });
            queryClient.invalidateQueries({
                queryKey: ['reports', 'maintenance'],
            });
            toast.success(res?.message || 'Vehicle is now available');
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to complete maintenance.')
            );
        },
    });
}
