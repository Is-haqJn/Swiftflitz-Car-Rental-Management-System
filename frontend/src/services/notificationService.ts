import { apiClient } from '@/shared/api/apiClient';
import { API_ENDPOINTS } from '@/shared/api/endpoints';
import type {
    ApiResponse,
    PaginatedResponse,
    GenericFilters,
    AppNotification,
    NotificationSettings,
} from '@/shared/types';

export const notificationService = {
    async list(
        filters: GenericFilters = {}
    ): Promise<PaginatedResponse<AppNotification>> {
        return apiClient.get<PaginatedResponse<AppNotification>>(
            API_ENDPOINTS.NOTIFICATIONS.BASE,
            {
                params: filters,
            }
        );
    },

    async getUnreadCount(): Promise<{ data: { count: number } }> {
        return apiClient.get<{ data: { count: number } }>(
            API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT
        );
    },

    async getById(id: string): Promise<ApiResponse<AppNotification>> {
        return apiClient.get<ApiResponse<AppNotification>>(
            API_ENDPOINTS.NOTIFICATIONS.BY_ID(id)
        );
    },

    async markAsRead(id: string): Promise<ApiResponse<AppNotification>> {
        return apiClient.patch<ApiResponse<AppNotification>>(
            API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id)
        );
    },

    async markAsUnread(id: string): Promise<ApiResponse<AppNotification>> {
        return apiClient.patch<ApiResponse<AppNotification>>(
            API_ENDPOINTS.NOTIFICATIONS.MARK_UNREAD(id)
        );
    },

    async markAllAsRead(): Promise<{ status: string; message: string }> {
        return apiClient.patch<{ status: string; message: string }>(
            API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ
        );
    },

    async delete(id: string): Promise<{ status: string; message: string }> {
        return apiClient.delete<{ status: string; message: string }>(
            API_ENDPOINTS.NOTIFICATIONS.BY_ID(id)
        );
    },

    async deleteAllRead(): Promise<{ status: string; message: string }> {
        return apiClient.delete<{ status: string; message: string }>(
            API_ENDPOINTS.NOTIFICATIONS.DELETE_ALL_READ
        );
    },

    async getSettings(): Promise<ApiResponse<NotificationSettings>> {
        return apiClient.get<ApiResponse<NotificationSettings>>(
            API_ENDPOINTS.NOTIFICATIONS.SETTINGS
        );
    },

    async updateSettings(
        data: Partial<NotificationSettings>
    ): Promise<ApiResponse<NotificationSettings>> {
        return apiClient.put<ApiResponse<NotificationSettings>>(
            API_ENDPOINTS.NOTIFICATIONS.SETTINGS,
            data
        );
    },

    async sendTestEmail(data: {
        type: string;
        email: string;
    }): Promise<ApiResponse<null>> {
        return apiClient.post<ApiResponse<null>>(
            API_ENDPOINTS.NOTIFICATIONS.TEST_EMAIL,
            data
        );
    },
};
