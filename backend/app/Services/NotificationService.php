<?php

namespace App\Services;

use App\Jobs\BroadcastNotificationJob;
use App\Models\AppNotification;
use App\Models\NotificationSetting;
use App\Models\User;
use App\Repositories\Contracts\NotificationRepositoryInterface;
use App\Services\Contracts\NotificationServiceInterface;
use App\Settings\NotificationSystemSettings;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class NotificationService implements NotificationServiceInterface
{
    public function __construct(
        protected NotificationRepositoryInterface $notificationRepository,
        protected NotificationSystemSettings $systemSettings,
    ) {}

    /**
     * Get paginated notifications for a user, optionally filtered by type.
     */
    public function getUserNotifications(User $user, ?string $type = null, int $perPage = 20): LengthAwarePaginator
    {
        return $this->notificationRepository->getUserNotifications($user->id, $type, $perPage);
    }

    /**
     * Get a single notification belonging to a user.
     */
    public function show(User $user, string $notificationId): AppNotification
    {
        return $this->notificationRepository->findUserNotification($user->id, $notificationId);
    }

    /**
     * Get the count of unread notifications for a user.
     */
    public function getUnreadCount(User $user): int
    {
        return $this->notificationRepository->getUnreadCount($user->id);
    }

    /**
     * Mark a specific notification as read.
     */
    public function markAsRead(User $user, string $notificationId): AppNotification
    {
        $notification = $this->notificationRepository->findUserNotification($user->id, $notificationId);

        $this->notificationRepository->markAsRead($notificationId);

        return $notification->fresh();
    }

    /**
     * Mark a specific notification as unread (clears read_at).
     */
    public function markAsUnread(User $user, string $notificationId): AppNotification
    {
        $notification = $this->notificationRepository->findUserNotification($user->id, $notificationId);

        $notification->update(['read_at' => null]);

        return $notification->fresh();
    }

    /**
     * Mark all unread notifications as read for a user.
     */
    public function markAllAsRead(User $user): int
    {
        return $this->notificationRepository->markAllAsRead($user->id);
    }

    /**
     * Delete a specific notification belonging to a user.
     */
    public function deleteNotification(User $user, string $notificationId): bool
    {
        $notification = $this->notificationRepository->findUserNotification($user->id, $notificationId);

        return (bool) $notification->delete();
    }

    /**
     * Delete all read notifications for a user.
     */
    public function deleteAllRead(User $user): int
    {
        return $this->notificationRepository->deleteAllRead($user->id);
    }

    /**
     * Create and store in-app notification(s) for one or more users.
     * Respects each user's notification settings preferences.
     *
     * @param  array<string>|string  $userIds
     * @param  array<string, mixed>  $data
     */
    public function send(array|string $userIds, string $type, string $title, string $message, array $data = []): void
    {
        $userIds = (array) $userIds;

        // ? Resolve the setting key for this notification type
        $settingKey = $this->resolveSettingKey($type);

        // ? Check system-wide in-app toggle first - if off, skip for all users
        if ($settingKey !== null && ! ($this->systemSettings->{$settingKey} ?? true)) {
            return;
        }

        // ? Filter users who have this notification type disabled (per-user in-app preference)
        if ($settingKey !== null) {
            $userIds = array_values(array_filter($userIds, function (string $userId) use ($settingKey): bool {
                $setting = NotificationSetting::where('user_id', $userId)->first();

                // ? If no setting exists, always send (default allow)
                if ($setting === null) {
                    return true;
                }

                return (bool) ($setting->{$settingKey} ?? true);
            }));
        }

        if (empty($userIds)) {
            return;
        }

        $notifications = array_map(fn (string $userId) => [
            'id' => (string) Str::uuid(),
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => json_encode($data),
            'action_url' => $data['action_url'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ], $userIds);

        // ? Bulk insert for performance when notifying multiple users
        $this->notificationRepository->bulkInsert($notifications);

        foreach ($notifications as $notification) {
            BroadcastNotificationJob::dispatch($notification['user_id'], $notification);
        }
    }

    /**
     * Get notification settings for a user, creating defaults if not set.
     *
     * @return array<string, mixed>
     */
    public function getSettings(User $user): array
    {
        return $this->notificationRepository->getOrCreateSettings($user->id)->toArray();
    }

    /**
     * Update notification settings for a user.
     *
     * @param  array<string, mixed>  $settings
     */
    public function updateSettings(User $user, array $settings): bool
    {
        return $this->notificationRepository->updateSettings($user->id, $settings);
    }

    /**
     * Check whether an email notification should be sent for a user and type.
     * Checks the system-wide toggle first, then the user's personal preference.
     */
    public function shouldSendEmail(User $user, string $type): bool
    {
        $settingKey = $this->resolveSettingKey($type);

        if ($settingKey === null) {
            return true;
        }

        $emailKey = 'email_' . $settingKey;

        // ? System-wide email toggle - if off, skip sending to anyone
        if (! ($this->systemSettings->{$emailKey} ?? true)) {
            return false;
        }

        // ? User's personal email preference
        $pref = NotificationSetting::where('user_id', $user->id)->first();

        return (bool) ($pref?->{$emailKey} ?? true);
    }

    /**
     * Resolve the NotificationSetting column key for a given notification type.
     */
    protected function resolveSettingKey(string $type): ?string
    {
        $map = [
            'airport_booking_cancelled' => 'airport_booking_cancelled',
            'airport_booking_status_changed' => 'airport_booking_status_changed',
            'airport_booking' => 'airport_booking',
            'chauffeur_booking_cancelled' => 'chauffeur_booking_cancelled',
            'chauffeur_booking_status_changed' => 'chauffeur_booking_status_changed',
            'chauffeur_pickup_reminder' => 'chauffeur_pickup_reminder',
            'chauffeur_booking' => 'chauffeur_booking',
            'rental_cancelled' => 'rental_cancelled',
            'driver_document_expiry' => 'driver_document_expiry',
            'payment_confirmation' => 'payment_confirmation',
            'rental_status_change' => 'rental_status_change',
            'document_expiry_alert' => 'document_expiry_alert',
            'pickup_reminder' => 'pickup_reminder',
        ];

        if (isset($map[$type])) {
            return $map[$type];
        }

        if (str_contains($type, 'booking_created') || str_contains($type, 'new_rental')) {
            return 'new_booking';
        }

        if (str_contains($type, 'overdue')) {
            return 'overdue_alert';
        }

        if (str_contains($type, 'return_reminder') || str_contains($type, 'due_return')) {
            return 'return_reminder';
        }

        if (str_contains($type, 'quote')) {
            return 'quote_request';
        }

        if (str_contains($type, 'vehicle_expiry') || str_contains($type, 'expiry')) {
            return 'vehicle_expiry';
        }

        if (str_contains($type, 'pickup_reminder')) {
            return 'pickup_reminder';
        }

        /* Strip admin_ prefix and recurse so admin_new_booking -> new_booking, etc. */
        if (str_starts_with($type, 'admin_')) {
            return $this->resolveSettingKey(substr($type, 6));
        }

        return null;
    }
}
