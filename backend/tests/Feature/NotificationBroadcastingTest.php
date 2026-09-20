<?php

use App\Jobs\BroadcastNotificationJob;
use App\Models\AppNotification;
use App\Models\NotificationSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

/*
 * Verify in-app notifications are created and stored correctly
 */

it('creates notification in database when sent', function () {
    $user = User::factory()->create();
    $notificationService = app('App\Services\Contracts\NotificationServiceInterface');

    $notificationService->send(
        $user->id,
        'rental_status_change',
        'Rental Status Updated',
        'Your rental status has been updated.',
        ['action_url' => '/management/rentals/123']
    );

    expect(AppNotification::where('user_id', $user->id)->where('type', 'rental_status_change')->first())
        ->not->toBeNull()
        ->title->toBe('Rental Status Updated')
        ->message->toBe('Your rental status has been updated.')
        ->action_url->toBe('/management/rentals/123');
});

it('stores notification data in database', function () {
    $user = User::factory()->create();
    $notificationService = app('App\Services\Contracts\NotificationServiceInterface');

    $userData = ['order_id' => '123', 'amount' => 500];

    $notificationService->send(
        $user->id,
        'payment_confirmation',
        'Payment Confirmed',
        'Your payment has been confirmed.',
        array_merge(['action_url' => '/management/payments/456'], $userData)
    );

    $notification = AppNotification::where('user_id', $user->id)->first();

    expect($notification->data)
        ->toHaveKey('order_id')
        ->toHaveKey('amount');
    expect($notification->data['order_id'])->toBe('123');
    expect($notification->data['amount'])->toBe(500);
});

it('respects per-user notification preferences when sending', function () {
    $user = User::factory()->create();

    /* User opts out of rental_cancelled notifications */
    NotificationSetting::create(['user_id' => $user->id, 'rental_cancelled' => false]);

    $notificationService = app('App\Services\Contracts\NotificationServiceInterface');

    $notificationService->send($user->id, 'rental_cancelled', 'Rental Cancelled', 'Your rental was cancelled.');

    /* Notification should not be created */
    expect(AppNotification::where('user_id', $user->id)->count())->toBe(0);
});

it('creates notification for user with no preferences set', function () {
    $user = User::factory()->create();

    /* User has no NotificationSetting record, should default to enabled */
    $notificationService = app('App\Services\Contracts\NotificationServiceInterface');

    $notificationService->send($user->id, 'test_notification', 'Test', 'Test message');

    expect(AppNotification::where('user_id', $user->id)->count())->toBe(1);
});

it('sends batch notifications to multiple users', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $user3 = User::factory()->create();

    $userIds = [$user1->id, $user2->id, $user3->id];

    $notificationService = app('App\Services\Contracts\NotificationServiceInterface');

    $notificationService->send($userIds, 'admin_new_booking', 'New Booking', 'A new booking was created.');

    expect(AppNotification::count())->toBe(3);
    expect(AppNotification::where('user_id', $user1->id)->count())->toBe(1);
    expect(AppNotification::where('user_id', $user2->id)->count())->toBe(1);
    expect(AppNotification::where('user_id', $user3->id)->count())->toBe(1);
});

it('creates unread notifications', function () {
    $user = User::factory()->create();
    $notificationService = app('App\Services\Contracts\NotificationServiceInterface');

    $notificationService->send($user->id, 'test', 'Test', 'Test message');

    $notification = AppNotification::where('user_id', $user->id)->first();

    expect($notification->isRead())->toBe(false);
    expect($notification->read_at)->toBeNull();
});

it('filters notifications by user correctly', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();

    $notificationService = app('App\Services\Contracts\NotificationServiceInterface');

    $notificationService->send($user1->id, 'test', 'Test for User 1', 'Message 1');
    $notificationService->send($user2->id, 'test', 'Test for User 2', 'Message 2');

    expect(AppNotification::where('user_id', $user1->id)->count())->toBe(1);
    expect(AppNotification::where('user_id', $user2->id)->count())->toBe(1);

    $user1Notif = AppNotification::where('user_id', $user1->id)->first();
    expect($user1Notif->title)->toBe('Test for User 1');
});

it('dispatches BroadcastNotificationJob on default queue when notification is sent', function () {
    Queue::fake();

    $user = User::factory()->create();
    $notificationService = app('App\Services\Contracts\NotificationServiceInterface');

    $notificationService->send($user->id, 'rental_status_change', 'Status Updated', 'Your rental was updated.');

    Queue::assertPushedOn('default', BroadcastNotificationJob::class, function ($job) use ($user) {
        return $job->userId === $user->id;
    });
});

it('dispatches one BroadcastNotificationJob per recipient', function () {
    Queue::fake();

    $users = User::factory()->count(3)->create();
    $userIds = $users->pluck('id')->all();

    $notificationService = app('App\Services\Contracts\NotificationServiceInterface');

    $notificationService->send($userIds, 'admin_new_booking', 'New Booking', 'A booking was created.');

    foreach ($users as $user) {
        Queue::assertPushedOn('default', BroadcastNotificationJob::class, function ($job) use ($user) {
            return $job->userId === $user->id;
        });
    }
});
