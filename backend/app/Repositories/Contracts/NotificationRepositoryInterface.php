<?php

namespace App\Repositories\Contracts;

use App\Models\AppNotification;
use App\Models\NotificationSetting;
use App\Repositories\Base\Contracts\BaseRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

interface NotificationRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get paginated notifications for a user, optionally filtered by type.
     */
    public function getUserNotifications(string $userId, ?string $type, int $perPage): LengthAwarePaginator;

    /**
     * Get the count of unread notifications for a user.
     */
    public function getUnreadCount(string $userId): int;

    /**
     * Find a specific notification belonging to a user, or throw ModelNotFoundException.
     */
    public function findUserNotification(string $userId, string $notificationId): AppNotification;

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(string $notificationId): bool;

    /**
     * Mark all unread notifications for a user as read.
     *
     * @return int The number of notifications updated.
     */
    public function markAllAsRead(string $userId): int;

    /**
     * Delete all read notifications for a user.
     *
     * @return int The number of notifications deleted.
     */
    public function deleteAllRead(string $userId): int;

    /**
     * Bulk insert an array of notification records.
     *
     * @param  array<int, array<string, mixed>>  $notifications
     */
    public function bulkInsert(array $notifications): void;

    /**
     * Get or create the notification settings for a user.
     */
    public function getOrCreateSettings(string $userId): NotificationSetting;

    /**
     * Update the notification settings for a user.
     *
     * @param  array<string, mixed>  $settings
     */
    public function updateSettings(string $userId, array $settings): bool;
}
