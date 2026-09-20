import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { fleetVehicleService } from '@/services/fleetVehicleService';
import type {
    FleetVehicle,
    CreateFleetVehicleData,
    FleetVehicleFilters,
} from '@/shared/types/fleetVehicle.types';
import type { ApiResponse } from '@/shared/types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';
import type { AxiosError } from 'axios';

/* Query Keys */
export const fleetVehicleKeys = {
    all: ['fleet-vehicles'] as const,
    lists: () => [...fleetVehicleKeys.all, 'list'] as const,
    list: (filters: FleetVehicleFilters) =>
        [...fleetVehicleKeys.lists(), filters] as const,
    details: () => [...fleetVehicleKeys.all, 'detail'] as const,
    detail: (id: string) => [...fleetVehicleKeys.details(), id] as const,
    availableAirport: () =>
        [...fleetVehicleKeys.all, 'available', 'airport'] as const,
    availableChauffeur: () =>
        [...fleetVehicleKeys.all, 'available', 'chauffeur'] as const,
};

/* Queries */
export function useFleetVehicles(filters: FleetVehicleFilters = {}) {
    return useQuery({
        queryKey: fleetVehicleKeys.list(filters),
        queryFn: () => fleetVehicleService.list(filters),
        placeholderData: keepPreviousData,
    });
}

export function useFleetVehicle(id: string) {
    return useQuery<ApiResponse<FleetVehicle>>({
        queryKey: fleetVehicleKeys.detail(id),
        queryFn: () => fleetVehicleService.get(id),
        enabled: !!id,
    });
}

export function useAvailableFleetVehiclesForAirport(enabled = true) {
    return useQuery<ApiResponse<FleetVehicle[]>>({
        queryKey: fleetVehicleKeys.availableAirport(),
        queryFn: () => fleetVehicleService.availableForAirport(),
        enabled,
    });
}

export function useAvailableFleetVehiclesForChauffeur(enabled = true) {
    return useQuery<ApiResponse<FleetVehicle[]>>({
        queryKey: fleetVehicleKeys.availableChauffeur(),
        queryFn: () => fleetVehicleService.availableForChauffeur(),
        enabled,
    });
}

/* Mutations */
export function useCreateFleetVehicle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateFleetVehicleData) =>
            fleetVehicleService.create(payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: fleetVehicleKeys.all,
            });
            toast.success(res?.message || 'Fleet vehicle created successfully');
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to create fleet vehicle.')
            );
        },
    });
}

export function useUpdateFleetVehicle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: CreateFleetVehicleData;
        }) => fleetVehicleService.update(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: fleetVehicleKeys.all,
            });
            toast.success(res?.message || 'Fleet vehicle updated successfully');
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to update fleet vehicle.')
            );
        },
    });
}

export function useDeleteFleetVehicle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => fleetVehicleService.delete(id),
        onSuccess: data => {
            queryClient.invalidateQueries({
                queryKey: fleetVehicleKeys.all,
            });
            toast.success(data.message || 'Fleet vehicle deleted successfully');
        },
        onError: (error: AxiosError<{ message: string }>) => {
            toast.error(
                getErrorMessage(error, 'Failed to delete fleet vehicle.'),
                { id: 'delete-fleet-vehicle' }
            );
        },
    });
}

export function useUpdateFleetVehicleStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            fleetVehicleService.updateStatus(id, status),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: fleetVehicleKeys.all,
            });
            toast.success(
                res?.message || 'Fleet vehicle status updated successfully'
            );
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to update fleet vehicle status.')
            );
        },
    });
}

export function useToggleFleetVehicleActive() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => fleetVehicleService.toggleActive(id),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: fleetVehicleKeys.all,
            });
            toast.success(res?.message || 'Fleet vehicle updated successfully');
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to update fleet vehicle.')
            );
        },
    });
}

export function useUploadFleetVehiclePhoto() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, file }: { id: string; file: File }) =>
            fleetVehicleService.uploadPhoto(id, file),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: fleetVehicleKeys.detail(res.data.id),
            });
            toast.success('Photo uploaded successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to upload photo.'));
        },
    });
}

export function useSetPrimaryFleetVehiclePhoto() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            vehicleId,
            mediaId,
        }: {
            vehicleId: string;
            mediaId: string;
        }) => fleetVehicleService.setPrimaryPhoto(vehicleId, mediaId),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: fleetVehicleKeys.detail(res.data.id),
            });
            toast.success('Primary photo updated');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to set primary photo.'));
        },
    });
}

export function useAssignFleetVehicleServices() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: {
                chauffeur_enabled: boolean;
                chauffeur_category_id?: string | null;
                chauffeur_base_price?: number | null;
                airport_enabled: boolean;
                airport_package_ids?: string[];
            };
        }) => fleetVehicleService.assignServices(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: fleetVehicleKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: fleetVehicleKeys.detail(res.data.id),
            });
            toast.success(
                res?.message || 'Service assignments updated successfully'
            );
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to update service assignments.')
            );
        },
    });
}

export function useDeleteFleetVehiclePhoto() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            vehicleId,
            mediaId,
        }: {
            vehicleId: string;
            mediaId: string;
        }) => fleetVehicleService.deletePhoto(vehicleId, mediaId),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: fleetVehicleKeys.detail(res.data.id),
            });
            toast.success('Photo deleted successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to delete photo.'));
        },
    });
}
