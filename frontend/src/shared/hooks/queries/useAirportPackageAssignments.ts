import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { airportPackageAssignmentService } from '@/services/airportPackageAssignmentService';
import type {
    AirportPackageAssignmentFilters,
    CreateAirportPackageAssignmentData,
    UpdateAirportPackageAssignmentData,
} from '@/shared/types/airport-package-assignment.types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';

/* Query Keys */
export const airportPackageAssignmentKeys = {
    all: ['airport-package-assignments'] as const,
    lists: () => [...airportPackageAssignmentKeys.all, 'list'] as const,
    list: (filters: AirportPackageAssignmentFilters) =>
        [...airportPackageAssignmentKeys.lists(), filters] as const,
    details: () => [...airportPackageAssignmentKeys.all, 'detail'] as const,
    detail: (id: string) =>
        [...airportPackageAssignmentKeys.details(), id] as const,
    byAirport: (airportId: string) =>
        [...airportPackageAssignmentKeys.all, 'by-airport', airportId] as const,
};

/* Queries */
export function useAirportPackageAssignments(
    filters: AirportPackageAssignmentFilters = {}
) {
    return useQuery({
        queryKey: airportPackageAssignmentKeys.list(filters),
        queryFn: () => airportPackageAssignmentService.list(filters),
        placeholderData: keepPreviousData,
    });
}

export function useAirportPackageAssignment(id: string) {
    return useQuery({
        queryKey: airportPackageAssignmentKeys.detail(id),
        queryFn: () => airportPackageAssignmentService.get(id),
        enabled: !!id,
    });
}

export function usePackageAssignmentsByAirport(airportId: string) {
    return useQuery({
        queryKey: airportPackageAssignmentKeys.byAirport(airportId),
        queryFn: () => airportPackageAssignmentService.byAirport(airportId),
        enabled: !!airportId,
        staleTime: 1000 * 60 * 5,
    });
}

/* Mutations */
export function useCreateAirportPackageAssignment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateAirportPackageAssignmentData) =>
            airportPackageAssignmentService.create(data),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: airportPackageAssignmentKeys.lists(),
            });
            toast.success(res.message || 'Pricing assignment created', {
                id: 'assignment-create',
            });
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to create pricing assignment'),
                { id: 'assignment-create-error' }
            );
        },
    });
}

export function useUpdateAirportPackageAssignment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: UpdateAirportPackageAssignmentData;
        }) => airportPackageAssignmentService.update(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: airportPackageAssignmentKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: airportPackageAssignmentKeys.details(),
            });
            toast.success(res.message || 'Pricing updated successfully', {
                id: 'assignment-update',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to update pricing'), {
                id: 'assignment-update-error',
            });
        },
    });
}

export function useDeleteAirportPackageAssignment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => airportPackageAssignmentService.delete(id),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: airportPackageAssignmentKeys.lists(),
            });
            toast.success(res.message || 'Pricing assignment deleted', {
                id: 'assignment-delete',
            });
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to delete pricing assignment'),
                { id: 'assignment-delete-error' }
            );
        },
    });
}

export function useToggleAirportPackageAssignmentActive() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) =>
            airportPackageAssignmentService.toggleActive(id),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: airportPackageAssignmentKeys.lists(),
            });
            toast.success(res.message || 'Assignment status updated', {
                id: 'assignment-toggle',
            });
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to update assignment status'),
                { id: 'assignment-toggle-error' }
            );
        },
    });
}
