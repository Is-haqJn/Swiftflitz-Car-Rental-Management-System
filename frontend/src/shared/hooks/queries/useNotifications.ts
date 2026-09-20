import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { useEcho } from '@laravel/echo-react';
import { notificationService } from '@/services/notificationService';
import type {
    AppNotification,
    GenericFilters,
    NotificationSettings,
} from '@/shared/types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';
import { useAppSelector } from '@/store';
import { selectAuthUser } from '@/store/slices/authSlice';

/* Query Keys */
export const notificationKeys = {
    all: ['notifications'] as const,
    lists: () => [...notificationKeys.all, 'list'] as const,
    list: (filters: GenericFilters) =>
        [...notificationKeys.lists(), filters] as const,
    detail: (id: string) => ['notifications', 'detail', id] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
    settings: ['notifications', 'settings'] as const,
};

/* Queries */
export function useNotifications(filters: GenericFilters = {}) {
    return useQuery({
        queryKey: notificationKeys.list(filters),
        queryFn: () => notificationService.list(filters),
        placeholderData: keepPreviousData,
        refetchInterval: 1000 * 30,
    });
}

export function useNotification(id: string) {
    return useQuery({
        queryKey: notificationKeys.detail(id),
        queryFn: () => notificationService.getById(id),
        enabled: !!id,
    });
}

export function useUnreadCount() {
    return useQuery({
        queryKey: notificationKeys.unreadCount,
        queryFn: () => notificationService.getUnreadCount(),
        staleTime: 1000 * 60,
        refetchInterval: 1000 * 60,
    });
}

export function useNotificationSettings() {
    return useQuery({
        queryKey: notificationKeys.settings,
        queryFn: () => notificationService.getSettings(),
    });
}

/* Mutations */
export function useMarkAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => notificationService.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: notificationKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: notificationKeys.unreadCount,
            });
        },
    });
}

export function useMarkAsUnread() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => notificationService.markAsUnread(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: notificationKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: notificationKeys.unreadCount,
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to mark as unread'), {
                id: 'notification-mark-unread-error',
            });
        },
    });
}

export function useMarkAllAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => notificationService.markAllAsRead(),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
            toast.success(res.message || 'All notifications marked as read', {
                id: 'notifications-mark-all-read',
            });
        },
    });
}

export function useDeleteNotification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => notificationService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: notificationKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: notificationKeys.unreadCount,
            });
        },
    });
}

export function useDeleteAllRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => notificationService.deleteAllRead(),
        onSuccess: res => {
            queryClient.invalidateQueries({
                queryKey: notificationKeys.lists(),
            });
            toast.success(res.message || 'Read notifications cleared', {
                id: 'notifications-clear-read',
            });
        },
    });
}

export function useUpdateNotificationSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<NotificationSettings>) =>
            notificationService.updateSettings(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: notificationKeys.settings,
            });
            toast.success('Notification settings saved', {
                id: 'notification-settings-save',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to save settings'), {
                id: 'notification-settings-save-error',
            });
        },
    });
}

export function useSendTestEmail() {
    return useMutation({
        mutationFn: (data: { type: string; email: string }) =>
            notificationService.sendTestEmail(data),
        onSuccess: (res, variables) => {
            toast.success(
                res.message ||
                    `Test email sent successfully to ${variables.email}`,
                { id: `test-email-${variables.type}` }
            );
        },
        onError: (error, variables) => {
            toast.error(getErrorMessage(error, 'Failed to send test email'), {
                id: `test-email-error-${variables.type}`,
            });
        },
    });
}

/* Realtime (Reverb / Echo) */
/**
 * Subscribe to the private notifications channel for the authenticated user.
 * When a NotificationCreated event is received, show a toast and refresh query cache.
 * Channel auto-leaves on unmount via @laravel/echo-react.
 *
 * Only subscribes when userId is truthy to avoid subscribing to 'notifications.'
 * (an invalid channel). When userId is absent, the channel name is set to a
 * placeholder '__none__' so Echo subscribes to a harmless channel that never fires.
 */
export function useNotificationListener(): void {
    const user = useAppSelector(selectAuthUser);
    const userId = user?.id;
    const queryClient = useQueryClient();

    useEcho<{ notification: AppNotification }>(
        userId ? `notifications.${userId}` : '__none__',
        '.NotificationCreated',
        data => {
            if (!userId) return;

            toast.success(data.notification.title, {
                id: `notification-${data.notification.id}`,
                duration: 6000,
            });

            queryClient.invalidateQueries({
                queryKey: notificationKeys.all,
            });
        },
        [userId, queryClient]
    );
}
