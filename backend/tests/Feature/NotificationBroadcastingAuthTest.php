<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Broadcast;

uses(RefreshDatabase::class);

/*
 * Verifies that the broadcasting auth endpoint at api/v1/broadcasting/auth
 * is reachable without a CSRF token (Bearer token only) - critical for Echo/Reverb.
 */

it('allows authenticated user to auth a private notifications channel', function () {
    $user = User::factory()->create();

    Broadcast::shouldReceive('auth')
        ->once()
        ->andReturn(json_encode(['auth' => 'signed-token']));

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/broadcasting/auth', [
            'channel_name' => 'private-notifications.' . $user->id,
            'socket_id' => '1234.5678',
        ])
        ->assertSuccessful();
});

it('rejects unauthenticated channel auth requests', function () {
    $this->postJson('/api/v1/broadcasting/auth', [
        'channel_name' => 'private-notifications.some-user-id',
        'socket_id' => '1234.5678',
    ])->assertUnauthorized();
});

it('broadcasting auth endpoint has no CSRF middleware in its stack', function () {
    $route = collect(app('router')->getRoutes()->getRoutes())
        ->first(fn ($r) => str_contains($r->uri(), 'api/v1/broadcasting/auth'));

    expect($route)->not->toBeNull();

    $middleware = $route->gatherMiddleware();

    expect($middleware)->not->toContain('web')
        ->and(collect($middleware)->contains(fn ($m) => str_contains($m, 'VerifyCsrfToken')))->toBeFalse();
});
