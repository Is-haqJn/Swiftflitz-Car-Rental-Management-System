import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { branchService } from '@/services/branchService';
import type {
    BranchFilters,
    CreateBranchData,
    UpdateBranchData,
} from '@/shared/types/branch.types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';

/* Query Keys */
export const branchKeys = {
    all: ['branches'] as const,
    lists: () => [...branchKeys.all, 'list'] as const,
    list: (filters: BranchFilters) => [...branchKeys.lists(), filters] as const,
    details: () => [...branchKeys.all, 'detail'] as const,
    detail: (id: string) => [...branchKeys.details(), id] as const,
    active: () => [...branchKeys.all, 'active'] as const,
};

/* Queries */
export function useBranches(filters: BranchFilters = {}) {
    return useQuery({
        queryKey: branchKeys.list(filters),
        queryFn: () => branchService.list(filters),
        placeholderData: keepPreviousData,
    });
}

export function useBranch(id: string) {
    return useQuery({
        queryKey: branchKeys.detail(id),
        queryFn: () => branchService.get(id),
        enabled: !!id,
    });
}

export function useActiveBranches() {
    return useQuery({
        queryKey: branchKeys.active(),
        queryFn: () => branchService.active(),
        staleTime: 1000 * 60 * 5,
    });
}

/* Mutations */
export function useCreateBranch() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateBranchData) => branchService.create(data),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
            queryClient.invalidateQueries({ queryKey: branchKeys.active() });
            toast.success(res.message || 'Branch created successfully', {
                id: 'branch-create',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to create branch'), {
                id: 'branch-create-error',
            });
        },
    });
}

export function useUpdateBranch() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: UpdateBranchData;
        }) => branchService.update(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
            queryClient.invalidateQueries({ queryKey: branchKeys.details() });
            queryClient.invalidateQueries({ queryKey: branchKeys.active() });
            toast.success(res.message || 'Branch updated successfully', {
                id: 'branch-update',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to update branch'), {
                id: 'branch-update-error',
            });
        },
    });
}

export function useDeleteBranch() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => branchService.delete(id),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
            queryClient.invalidateQueries({ queryKey: branchKeys.active() });
            toast.success(res.message || 'Branch deleted successfully', {
                id: 'branch-delete',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to delete branch'), {
                id: 'branch-delete-error',
            });
        },
    });
}

export function useToggleBranchActive() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => branchService.toggleActive(id),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
            queryClient.invalidateQueries({ queryKey: branchKeys.active() });
            toast.success(res.message || 'Branch status updated', {
                id: 'branch-toggle',
            });
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to update branch status'),
                {
                    id: 'branch-toggle-error',
                }
            );
        },
    });
}

export function useVacateBranch() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            action,
            target_branch_id,
        }: {
            id: string;
            action: 'unassign' | 'transfer';
            target_branch_id?: string;
        }) => branchService.vacate(id, { action, target_branch_id }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
            queryClient.invalidateQueries({ queryKey: branchKeys.active() });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to vacate branch'), {
                id: 'branch-vacate-error',
            });
        },
    });
}

export function useAssignBranchManagers() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) =>
            branchService.assignManagers(id, userIds),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: branchKeys.details() });
            toast.success(res.message || 'Managers assigned successfully', {
                id: 'branch-managers',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to assign managers'), {
                id: 'branch-managers-error',
            });
        },
    });
}
