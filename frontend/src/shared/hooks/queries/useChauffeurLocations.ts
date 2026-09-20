import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { chauffeurLocationService } from '@/services/chauffeurLocationService';
import type {
    ChauffeurLocation,
    CreateChauffeurLocationData,
    UpdateChauffeurLocationData,
    ChauffeurLocationFilters,
} from '@/shared/types/chauffeur-location.types';
import type { ApiResponse } from '@/shared/types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';

/* Query Keys */
export const chauffeurLocationKeys = {
    all: ['chauffeur-locations'] as const,
    lists: () => [...chauffeurLocationKeys.all, 'list'] as const,
    list: (filters: ChauffeurLocationFilters) =>
        [...chauffeurLocationKeys.lists(), filters] as const,
    details: () => [...chauffeurLocationKeys.all, 'detail'] as const,
    detail: (id: string) => [...chauffeurLocationKeys.details(), id] as const,
};

/* Queries */
export function useChauffeurLocations(filters: ChauffeurLocationFilters = {}) {
    return useQuery({
        queryKey: chauffeurLocationKeys.list(filters),
        queryFn: () => chauffeurLocationService.list(filters),
        placeholderData: keepPreviousData,
    });
}

export function useChauffeurLocation(id: string) {
    return useQuery<ApiResponse<ChauffeurLocation>>({
        queryKey: chauffeurLocationKeys.detail(id),
        queryFn: () => chauffeurLocationService.get(id),
        enabled: !!id,
    });
}

/* Mutations */
export function useCreateChauffeurLocation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateChauffeurLocationData) =>
            chauffeurLocationService.create(payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: chauffeurLocationKeys.lists(),
            });
            toast.success(res?.message || 'Location created successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to create location.'));
        },
    });
}

export function useUpdateChauffeurLocation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: UpdateChauffeurLocationData;
        }) => chauffeurLocationService.update(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: chauffeurLocationKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: chauffeurLocationKeys.detail(res.data.id),
            });
            toast.success(res?.message || 'Location updated successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to update location.'));
        },
    });
}

export function useDeleteChauffeurLocation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => chauffeurLocationService.delete(id),
        onSuccess: data => {
            queryClient.invalidateQueries({
                queryKey: chauffeurLocationKeys.lists(),
            });
            toast.success(data.message || 'Location deleted successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to delete location.'));
        },
    });
}
