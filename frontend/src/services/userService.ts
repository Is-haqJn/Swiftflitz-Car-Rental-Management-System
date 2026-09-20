import { apiClient } from '@/shared/api/apiClient';
import { API_ENDPOINTS } from '@/shared/api/endpoints';
import type { AdminSessionToken } from '@/services/profileService';
import type {
    ApiResponse,
    AuthResponse,
    PaginatedResponse,
    GenericFilters,
    CreateUserData,
    UpdateUserData,
    Role,
    Permission,
    ActivityLog,
    UserAccess,
} from '@/shared/types';

export const userService = {
    async list(
        filters: GenericFilters = {}
    ): Promise<PaginatedResponse<UserAccess>> {
        return apiClient.get<PaginatedResponse<UserAccess>>(
            API_ENDPOINTS.USERS.BASE,
            {
                params: filters,
            }
        );
    },

    async get(id: string | number): Promise<ApiResponse<UserAccess>> {
        return apiClient.get<ApiResponse<UserAccess>>(
            API_ENDPOINTS.USERS.BY_ID(id)
        );
    },

    async create(data: CreateUserData): Promise<ApiResponse<UserAccess>> {
        return apiClient.post<ApiResponse<UserAccess>>(
            API_ENDPOINTS.USERS.BASE,
            data
        );
    },

    async update(
        id: string | number,
        data: UpdateUserData
    ): Promise<ApiResponse<UserAccess>> {
        return apiClient.put<ApiResponse<UserAccess>>(
            API_ENDPOINTS.USERS.BY_ID(id),
            data
        );
    },

    async delete(
        id: string | number
    ): Promise<{ status: string; message: string }> {
        return apiClient.delete<{ status: string; message: string }>(
            API_ENDPOINTS.USERS.BY_ID(id)
        );
    },

    async toggleActive(id: string | number): Promise<ApiResponse<UserAccess>> {
        return apiClient.patch<ApiResponse<UserAccess>>(
            API_ENDPOINTS.USERS.TOGGLE_ACTIVE(id)
        );
    },

    async assignRoles(
        id: string | number,
        roles: string[]
    ): Promise<ApiResponse<UserAccess>> {
        return apiClient.put<ApiResponse<UserAccess>>(
            API_ENDPOINTS.USERS.ASSIGN_ROLES(id),
            { roles }
        );
    },

    async assignPermissions(
        id: string | number,
        permissions: string[]
    ): Promise<ApiResponse<UserAccess>> {
        return apiClient.put<ApiResponse<UserAccess>>(
            API_ENDPOINTS.USERS.ASSIGN_PERMISSIONS(id),
            {
                permissions,
            }
        );
    },

    async revokeSessions(
        id: string | number
    ): Promise<{ status: string; message: string }> {
        return apiClient.delete<{ status: string; message: string }>(
            API_ENDPOINTS.USERS.REVOKE_SESSIONS(id)
        );
    },

    async getAvailableRoles(): Promise<ApiResponse<Role[]>> {
        return apiClient.get<ApiResponse<Role[]>>(
            API_ENDPOINTS.USERS.AVAILABLE_ROLES
        );
    },

    async getAvailablePermissions(): Promise<ApiResponse<Permission[]>> {
        return apiClient.get<ApiResponse<Permission[]>>(
            API_ENDPOINTS.USERS.AVAILABLE_PERMISSIONS
        );
    },

    async getActivityLogs(
        filters: GenericFilters = {}
    ): Promise<PaginatedResponse<ActivityLog>> {
        return apiClient.get<PaginatedResponse<ActivityLog>>(
            API_ENDPOINTS.USERS.ACTIVITY_LOGS,
            {
                params: filters,
            }
        );
    },

    async impersonate(id: string | number): Promise<AuthResponse> {
        return apiClient.post<AuthResponse>(
            API_ENDPOINTS.USERS.IMPERSONATE(id)
        );
    },

    async assignBranches(
        id: string | number,
        branchIds: string[]
    ): Promise<ApiResponse<UserAccess>> {
        return apiClient.post<ApiResponse<UserAccess>>(
            `/users/${id}/branches`,
            { branch_ids: branchIds }
        );
    },

    async getAllSessions(
        filters: GenericFilters = {}
    ): Promise<PaginatedResponse<AdminSessionToken>> {
        return apiClient.get<PaginatedResponse<AdminSessionToken>>(
            API_ENDPOINTS.USERS.ALL_SESSIONS,
            { params: filters }
        );
    },

    async revokeAdminSession(tokenId: string): Promise<void> {
        return apiClient.delete<void>(
            API_ENDPOINTS.USERS.REVOKE_ADMIN_SESSION(tokenId)
        );
    },
};

export const roleService = {
    async list(): Promise<ApiResponse<Role[]>> {
        return apiClient.get<ApiResponse<Role[]>>(API_ENDPOINTS.ROLES.BASE);
    },

    async create(data: {
        name: string;
        description?: string;
        permissions: string[];
    }): Promise<ApiResponse<Role>> {
        return apiClient.post<ApiResponse<Role>>(
            API_ENDPOINTS.ROLES.BASE,
            data
        );
    },

    async update(
        id: string | number,
        data: { name?: string; description?: string; permissions: string[] }
    ): Promise<ApiResponse<Role>> {
        return apiClient.put<ApiResponse<Role>>(
            API_ENDPOINTS.ROLES.BY_ID(id),
            data
        );
    },

    async delete(id: number): Promise<{ status: string; message: string }> {
        return apiClient.delete<{ status: string; message: string }>(
            API_ENDPOINTS.ROLES.BY_ID(id)
        );
    },

    async getPermissions(): Promise<ApiResponse<Permission[]>> {
        return apiClient.get<ApiResponse<Permission[]>>(
            API_ENDPOINTS.ROLES.PERMISSIONS
        );
    },

    async getRoleUsers(id: number): Promise<PaginatedResponse<UserAccess>> {
        return apiClient.get<PaginatedResponse<UserAccess>>(
            API_ENDPOINTS.ROLES.USERS(id)
        );
    },
};
