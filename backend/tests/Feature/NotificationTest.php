<?php

use App\Models\AppNotification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/* GET /api/v1/notifications */
it('requires authentication to list notifications', function () {
    $this->getJson('/api/v1/notifications')
        ->assertUnauthorized();
});

it('can list notifications for authenticated user', function () {
    $user = User::factory()->create();

    AppNotification::create([
        'user_id' => $user->id,
        'type' => 'rental',
        'title' => 'Test Notification',
        'message' => 'This is a test.',
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/notifications')
        ->assertSuccessful();

    expect($response->json('data'))->toBeArray();
});

it('only returns notifications for the authenticated user', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();

    AppNotification::create([
        'user_id' => $other->id,
        'type' => 'rental',
        'title' => 'Other User Notification',
        'message' => 'Not for you.',
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/notifications')
        ->assertSuccessful();

    expect($response->json('data'))->toBeEmpty();
});

/* GET /api/v1/notifications/unread-count */
it('requires authentication to get unread count', function () {
    $this->getJson('/api/v1/notifications/unread-count')
        ->assertUnauthorized();
});

it('returns the correct unread notification count', function () {
    $user = User::factory()->create();

    AppNotification::create([
        'user_id' => $user->id,
        'type' => 'rental',
        'title' => 'Unread One',
        'message' => 'Unread.',
        'read_at' => null,
    ]);

    AppNotification::create([
        'user_id' => $user->id,
        'type' => 'rental',
        'title' => 'Read One',
        'message' => 'Read.',
        'read_at' => now(),
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/notifications/unread-count')
        ->assertSuccessful();

    expect($response->json('data.count'))->toBe(1);
});

/* PATCH /api/v1/notifications/{notificationId}/read */
it('requires authentication to mark a notification as read', function () {
    $this->patchJson('/api/v1/notifications/some-id/read')
        ->assertUnauthorized();
});

it('can mark a specific notification as read', function () {
    $user = User::factory()->create();

    $notification = AppNotification::create([
        'user_id' => $user->id,
        'type' => 'rental',
        'title' => 'Mark Me',
        'message' => 'Read this.',
        'read_at' => null,
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->patchJson("/api/v1/notifications/{$notification->id}/read")
        ->assertSuccessful();

    expect($response->json('data.is_read'))->toBeTrue();
});

/* PATCH /api/v1/notifications/read-all */
it('requires authentication to mark all notifications as read', function () {
    $this->patchJson('/api/v1/notifications/read-all')
        ->assertUnauthorized();
});

it('can mark all unread notifications as read', function () {
    $user = User::factory()->create();

    AppNotification::create([
        'user_id' => $user->id,
        'type' => 'rental',
        'title' => 'First',
        'message' => 'One.',
        'read_at' => null,
    ]);

    AppNotification::create([
        'user_id' => $user->id,
        'type' => 'rental',
        'title' => 'Second',
        'message' => 'Two.',
        'read_at' => null,
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->patchJson('/api/v1/notifications/read-all')
        ->assertSuccessful();

    expect($response->json('data.updated'))->toBe(2);
});

/* DELETE /api/v1/notifications/{notificationId} */
it('requires authentication to delete a notification', function () {
    $this->deleteJson('/api/v1/notifications/some-id')
        ->assertUnauthorized();
});

it('can delete a specific notification', function () {
    $user = User::factory()->create();

    $notification = AppNotification::create([
        'user_id' => $user->id,
        'type' => 'rental',
        'title' => 'Delete Me',
        'message' => 'Gone.',
    ]);

    $this->actingAs($user, 'sanctum')
        ->deleteJson("/api/v1/notifications/{$notification->id}")
        ->assertNoContent();

    $this->assertDatabaseMissing('app_notifications', ['id' => $notification->id]);
});

/* DELETE /api/v1/notifications/read */
it('can delete all read notifications', function () {
    $user = User::factory()->create();

    AppNotification::create([
        'user_id' => $user->id,
        'type' => 'rental',
        'title' => 'Read One',
        'message' => 'Delete.',
        'read_at' => now(),
    ]);

    AppNotification::create([
        'user_id' => $user->id,
        'type' => 'rental',
        'title' => 'Unread',
        'message' => 'Keep.',
        'read_at' => null,
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->deleteJson('/api/v1/notifications/read')
        ->assertSuccessful();

    expect($response->json('data.deleted'))->toBe(1);
});

/* GET /api/v1/notifications/settings */
it('requires authentication to get notification settings', function () {
    $this->getJson('/api/v1/notifications/settings')
        ->assertUnauthorized();
});

it('can retrieve notification settings', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/notifications/settings')
        ->assertSuccessful();
});

/* PUT /api/v1/notifications/settings */
it('requires authentication to update notification settings', function () {
    $this->putJson('/api/v1/notifications/settings', [])
        ->assertUnauthorized();
});

it('can update notification settings', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/notifications/settings', [
            'new_booking' => true,
            'return_reminder' => true,
            'overdue_alert' => false,
            'quote_request' => true,
        ])
        ->assertSuccessful();
});
