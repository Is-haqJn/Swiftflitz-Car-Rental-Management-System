import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { userService, roleService } from '@/services/userService';
import type {
    CreateUserData,
    UpdateUserData,
    GenericFilters,
} from '@/shared/types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';

/* Query Keys */
export const userKeys = {
    all: ['users'] as const,
    lists: () => [...userKeys.all, 'list'] as const,
    list: (filters: GenericFilters) => [...userKeys.lists(), filters] as const,
    details: () => [...userKeys.all, 'detail'] as const,
    detail: (id: string | number) =>
        [...userKeys.details(), String(id)] as const,
    roles: ['roles'] as const,
    activityLogs: (filters: GenericFilters) =>
        ['activity-logs', filters] as const,
    allSessions: (filters: GenericFilters) =>
        ['admin-sessions', filters] as const,
};

/* Queries */
export function useUsers(filters: GenericFilters = {}) {
    return useQuery({
        queryKey: userKeys.list(filters),
        queryFn: () => userService.list(filters),
        placeholderData: keepPreviousData,
    });
}

export function useUser(id: string | number) {
    return useQuery({
        queryKey: userKeys.detail(id),
        queryFn: () => userService.get(id),
        enabled: !!id,
    });
}

export function useRoles() {
    return useQuery({
        queryKey: userKeys.roles,
        queryFn: () => roleService.list(),
        staleTime: 1000 * 60 * 5,
    });
}

export function useAvailableRoles() {
    return useQuery({
        queryKey: [...userKeys.roles, 'available'],
        queryFn: () => userService.getAvailableRoles(),
        staleTime: 1000 * 60 * 5,
    });
}

export function useAvailablePermissions() {
    return useQuery({
        queryKey: ['permissions', 'available'],
        queryFn: () => userService.getAvailablePermissions(),
        staleTime: 1000 * 60 * 5,
    });
}

export function useRolePermissions() {
    return useQuery({
        queryKey: ['roles', 'permissions'],
        queryFn: () => roleService.getPermissions(),
        staleTime: 1000 * 60 * 5,
    });
}

export function useActivityLogs(filters: GenericFilters = {}) {
    return useQuery({
        queryKey: userKeys.activityLogs(filters),
        queryFn: () => userService.getActivityLogs(filters),
        placeholderData: keepPreviousData,
    });
}

/* Mutations */
export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateUserData) => userService.create(data),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            toast.success(res.message || 'User created successfully', {
                id: 'user-create',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to create user'), {
                id: 'user-create-error',
            });
        },
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string | number;
            payload: UpdateUserData;
        }) => userService.update(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            queryClient.invalidateQueries({ queryKey: userKeys.details() });
            toast.success(res.message || 'User updated successfully', {
                id: 'user-update',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to update user'), {
                id: 'user-update-error',
            });
        },
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string | number) => userService.delete(id),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            toast.success(res.message || 'User deleted successfully', {
                id: 'user-delete',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to delete user'), {
                id: 'user-delete-error',
            });
        },
    });
}

export function useToggleUserActive() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string | number) => userService.toggleActive(id),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            queryClient.invalidateQueries({ queryKey: userKeys.details() });
            toast.success(res.message || 'User status updated', {
                id: 'user-toggle',
            });
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to update user status'),
                {
                    id: 'user-toggle-error',
                }
            );
        },
    });
}

export function useAssignRoles() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, roles }: { id: string | number; roles: string[] }) =>
            userService.assignRoles(id, roles),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            queryClient.invalidateQueries({ queryKey: userKeys.details() });
            toast.success(res.message || 'Roles updated', { id: 'user-roles' });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to update roles'), {
                id: 'user-roles-error',
            });
        },
    });
}

export function useCreateRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            name: string;
            description?: string;
            permissions: string[];
        }) => roleService.create(data),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: userKeys.roles });
            toast.success(res.message || 'Role created successfully', {
                id: 'role-create',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to create role'), {
                id: 'role-create-error',
            });
        },
    });
}

export function useUpdateRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string | number;
            payload: {
                name?: string;
                description?: string;
                permissions: string[];
            };
        }) => roleService.update(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: userKeys.roles });
            toast.success(res.message || 'Role updated successfully', {
                id: 'role-update',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to update role'), {
                id: 'role-update-error',
            });
        },
    });
}

export function useDeleteRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => roleService.delete(id),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: userKeys.roles });
            toast.success(res.message || 'Role deleted successfully', {
                id: 'role-delete',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to delete role'), {
                id: 'role-delete-error',
            });
        },
    });
}

export function useImpersonateUser() {
    return useMutation({
        mutationFn: (id: string | number) => userService.impersonate(id),
        onSuccess: () => {
            toast.success('Impersonation started. Reload to see changes.', {
                id: 'impersonate',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to impersonate user.'), {
                id: 'impersonate-error',
            });
        },
    });
}

export function useAllSessions(filters: GenericFilters = {}) {
    return useQuery({
        queryKey: userKeys.allSessions(filters),
        queryFn: () => userService.getAllSessions(filters),
        placeholderData: keepPreviousData,
    });
}

export function useRevokeAdminSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (tokenId: string) =>
            userService.revokeAdminSession(tokenId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['admin-sessions'],
            });
            toast.success('Session revoked', { id: 'admin-session-revoke' });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to revoke session'), {
                id: 'admin-session-revoke-error',
            });
        },
    });
}

export function useAssignUserBranches() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            branchIds,
        }: {
            id: string | number;
            branchIds: string[];
        }) => userService.assignBranches(id, branchIds),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: userKeys.details() });
            toast.success(res.message || 'Branch assignments updated', {
                id: 'user-branches',
            });
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to update branch assignments'),
                { id: 'user-branches-error' }
            );
        },
    });
}
