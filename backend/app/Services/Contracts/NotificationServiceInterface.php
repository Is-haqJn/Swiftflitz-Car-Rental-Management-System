<?php

namespace App\Services\Contracts;

use App\Models\AppNotification;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface NotificationServiceInterface
{
    /**
     * Get paginated notifications for a user.
     */
    public function getUserNotifications(User $user, ?string $type = null, int $perPage = 20): LengthAwarePaginator;

    /**
     * Get a single notification for a user.
     */
    public function show(User $user, string $notificationId): AppNotification;

    /**
     * Get unread notifications count for a user.
     */
    public function getUnreadCount(User $user): int;

    /**
     * Mark a notification as read.
     */
    public function markAsRead(User $user, string $notificationId): AppNotification;

    /**
     * Mark a notification as unread (clears read_at).
     */
    public function markAsUnread(User $user, string $notificationId): AppNotification;

    /**
     * Mark all notifications as read for a user.
     */
    public function markAllAsRead(User $user): int;

    /**
     * Delete a notification.
     */
    public function deleteNotification(User $user, string $notificationId): bool;

    /**
     * Delete all read notifications for a user.
     */
    public function deleteAllRead(User $user): int;

    /**
     * Send a notification to user(s).
     *
     * @param  array<string>|string  $userIds
     * @param  array<string, mixed>  $data
     */
    public function send(array|string $userIds, string $type, string $title, string $message, array $data = []): void;

    /**
     * Get notification settings for a user.
     *
     * @return array<string, mixed>
     */
    public function getSettings(User $user): array;

    /**
     * Update notification settings for a user.
     *
     * @param  array<string, mixed>  $settings
     */
    public function updateSettings(User $user, array $settings): bool;

    /**
     * Check whether an email notification should be sent for a user and type.
     * Applies system-wide toggle first, then per-user preference.
     */
    public function shouldSendEmail(User $user, string $type): bool;
}
