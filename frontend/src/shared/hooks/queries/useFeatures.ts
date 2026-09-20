import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';
import type {
    CreateFeatureData,
    GenericFilters,
    UpdateFeatureData,
} from '@/shared/types';
import { featureService } from '@/services';

export const featureKeys = {
    all: ['features'] as const,
    lists: () => [...featureKeys.all, 'list'] as const,
    list: (filters: GenericFilters) =>
        [...featureKeys.lists(), filters] as const,
    active: () => [...featureKeys.all, 'active'] as const,
};

// Paginated list for the management table
export function useFeatures(filters: GenericFilters = {}) {
    return useQuery({
        queryKey: featureKeys.list(filters),
        queryFn: () => featureService.list(filters),
    });
}

// All active features - used in vehicle form
export function useActiveFeatures() {
    return useQuery({
        queryKey: featureKeys.active(),
        queryFn: () => featureService.active(),
        staleTime: 5 * 60 * 1000, // Cache for 5 min - features rarely change
    });
}

export function useCreateFeature() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateFeatureData) => featureService.create(data),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: featureKeys.all });
            toast.success(res.message || 'Feature created successfully');
        },
        onError: error =>
            toast.error(getErrorMessage(error, 'Failed to create feature')),
    });
}

export function useUpdateFeature() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateFeatureData }) =>
            featureService.update(id, data),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: featureKeys.all });
            toast.success(res.message || 'Feature updated successfully');
        },
        onError: error =>
            toast.error(getErrorMessage(error, 'Failed to update feature')),
    });
}

export function useDeleteFeature() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => featureService.delete(id),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: featureKeys.all });
            toast.success(res.message || 'Feature deleted successfully');
        },
        onError: error =>
            toast.error(getErrorMessage(error, 'Failed to delete feature')),
    });
}
