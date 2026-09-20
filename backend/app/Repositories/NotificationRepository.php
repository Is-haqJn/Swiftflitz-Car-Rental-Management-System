<?php

namespace App\Repositories;

use App\Models\AppNotification;
use App\Models\NotificationSetting;
use App\Repositories\Base\BaseRepository;
use App\Repositories\Contracts\NotificationRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class NotificationRepository extends BaseRepository implements NotificationRepositoryInterface
{
    /**
     * Get paginated notifications for a user, optionally filtered by type.
     */
    public function getUserNotifications(string $userId, ?string $type, int $perPage): LengthAwarePaginator
    {
        $query = $this->model
            ->where('user_id', $userId)
            ->latest();

        if ($type !== null) {
            $query->ofType($type);
        }

        return $query->paginate($perPage);
    }

    /**
     * Get the count of unread notifications for a user.
     */
    public function getUnreadCount(string $userId): int
    {
        return $this->model
            ->where('user_id', $userId)
            ->unread()
            ->count();
    }

    /**
     * Find a specific notification belonging to a user, or throw ModelNotFoundException.
     */
    public function findUserNotification(string $userId, string $notificationId): AppNotification
    {
        return $this->model
            ->where('user_id', $userId)
            ->findOrFail($notificationId);
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(string $notificationId): bool
    {
        return (bool) $this->model
            ->where('id', $notificationId)
            ->update(['read_at' => now()]);
    }

    /**
     * Mark all unread notifications for a user as read.
     *
     * @return int The number of notifications updated.
     */
    public function markAllAsRead(string $userId): int
    {
        return $this->model
            ->where('user_id', $userId)
            ->unread()
            ->update(['read_at' => now()]);
    }

    /**
     * Delete all read notifications for a user.
     *
     * @return int The number of notifications deleted.
     */
    public function deleteAllRead(string $userId): int
    {
        return $this->model
            ->where('user_id', $userId)
            ->whereNotNull('read_at')
            ->delete();
    }

    /**
     * Bulk insert an array of notification records.
     *
     * @param  array<int, array<string, mixed>>  $notifications
     */
    public function bulkInsert(array $notifications): void
    {
        // ? Use $this->model (the stored Builder) to insert within repository abstraction
        $this->model->insert($notifications);
    }

    /**
     * Get or create the notification settings for a user.
     * Uses refresh() to ensure database-level defaults are reflected in the returned model.
     */
    public function getOrCreateSettings(string $userId): NotificationSetting
    {
        $settings = NotificationSetting::query()->firstOrCreate(['user_id' => $userId]);
        $settings->refresh();

        return $settings;
    }

    /**
     * Update the notification settings for a user.
     *
     * @param  array<string, mixed>  $settings
     */
    public function updateSettings(string $userId, array $settings): bool
    {
        return (bool) NotificationSetting::query()->updateOrCreate(
            ['user_id' => $userId],
            $settings
        );
    }

    /**
     * Specify the model class name.
     */
    protected function model(): string
    {
        return AppNotification::class;
    }
}
