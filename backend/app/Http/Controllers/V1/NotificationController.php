<?php

namespace App\Http\Controllers\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateNotificationSettingsRequest;
use App\Http\Resources\AppNotificationResource;
use App\Services\Contracts\NotificationServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected NotificationServiceInterface $notificationService,
    ) {}

    /**
     * GET /api/v1/notifications/{notificationId}
     * Get a single notification for the authenticated user.
     */
    public function show(Request $request, string $notificationId): JsonResponse
    {
        $notification = $this->notificationService->show($request->user(), $notificationId);

        return $this->successResponse(new AppNotificationResource($notification));
    }

    /**
     * GET /api/notifications
     * Get paginated in-app notifications for the authenticated user, optionally filtered by type.
     */
    public function index(Request $request): JsonResponse
    {
        // ? Support both ?type= (direct) and ?filter[type]= (Spatie QueryBuilder style) parameters
        $type = $request->input('filter.type') ?? $request->input('type');

        $notifications = $this->notificationService->getUserNotifications(
            $request->user(),
            $type,
            $request->integer('per_page', 20)
        );

        return $this->successResponse(
            AppNotificationResource::collection($notifications),
        );
    }

    /**
     * GET /api/notifications/unread-count
     * Get the count of unread notifications for the authenticated user.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = $this->notificationService->getUnreadCount($request->user());

        return $this->successResponse(['count' => $count]);
    }

    /**
     * PATCH /api/v1/notifications/{notification}/read
     * Mark a specific notification as read.
     */
    public function markAsRead(Request $request, string $notificationId): JsonResponse
    {
        $notification = $this->notificationService->markAsRead($request->user(), $notificationId);

        return $this->successResponse(new AppNotificationResource($notification), 'Notification marked as read.');
    }

    /**
     * PATCH /api/v1/notifications/{notification}/unread
     * Mark a specific notification as unread.
     */
    public function markAsUnread(Request $request, string $notificationId): JsonResponse
    {
        $notification = $this->notificationService->markAsUnread($request->user(), $notificationId);

        return $this->successResponse(new AppNotificationResource($notification), 'Notification marked as unread.');
    }

    /**
     * PATCH /api/notifications/read-all
     * Mark all unread notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $count = $this->notificationService->markAllAsRead($request->user());

        return $this->successResponse(['updated' => $count], "{$count} notifications marked as read.");
    }

    /**
     * DELETE /api/notifications/{notification}
     * Delete a specific notification.
     */
    public function destroy(Request $request, string $notificationId): JsonResponse
    {
        $this->notificationService->deleteNotification($request->user(), $notificationId);

        return $this->noContentResponse();
    }

    /**
     * DELETE /api/notifications/read
     * Delete all read notifications.
     */
    public function destroyAllRead(Request $request): JsonResponse
    {
        $count = $this->notificationService->deleteAllRead($request->user());

        return $this->successResponse(['deleted' => $count], "{$count} read notifications deleted.");
    }

    /**
     * GET /api/notifications/settings
     * Get notification preferences for the authenticated user.
     */
    public function settings(Request $request): JsonResponse
    {
        $settings = $this->notificationService->getSettings($request->user());

        return $this->successResponse($settings);
    }

    /**
     * PUT /api/notifications/settings
     * Update notification preferences for the authenticated user.
     */
    public function updateSettings(UpdateNotificationSettingsRequest $request): JsonResponse
    {
        $this->notificationService->updateSettings($request->user(), $request->validated());

        return $this->successResponse(null, 'Notification settings updated successfully.');
    }
}
