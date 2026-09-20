<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Broadcast;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

/*
 * Dashboard broadcast channel authorization tests.
 *
 * The test suite uses BROADCAST_CONNECTION=null (phpunit.xml), which means
 * the NullBroadcaster skips the HTTP auth response entirely and always returns 200.
 * To test the channel authorization logic we resolve the channel callback
 * directly from the Broadcast registrar and assert its return value.
 */

/**
 * Resolve the registered channel callback for the given channel name
 * and invoke it with the given user (and optional extra params).
 *
 * @param  string  $channelName  e.g. 'dashboard'
 * @param  array<mixed>  $params  extra wildcard parameters (none for 'dashboard')
 * @return mixed true|false|array|null as returned by the callback
 */
function resolveChannelCallback(string $channelName, User $user, array $params = []): mixed
{
    $router = app(Illuminate\Broadcasting\BroadcastManager::class);
    $channels = $router->getChannels();

    foreach ($channels as $pattern => $callback) {
        if (preg_match('/^' . preg_quote($pattern, '/') . '$/', $channelName)) {
            return $callback($user, ...$params);
        }
    }

    return null;
}

/* Private channel: dashboard */

it('dashboard channel callback returns true for user with dashboard.view permission', function () {
    $user = User::factory()->create();
    Permission::findOrCreate('dashboard.view');
    $user->givePermissionTo('dashboard.view');

    $result = resolveChannelCallback('dashboard', $user);

    expect($result)->toBeTrue();
});

it('dashboard channel callback returns false for user without dashboard.view permission', function () {
    $user = User::factory()->create();

    $result = resolveChannelCallback('dashboard', $user);

    expect($result)->toBeFalse();
});

it('dashboard channel callback returns true for manager role with dashboard.view permission', function () {
    $user = User::factory()->create();
    $role = Role::findOrCreate('manager');
    Permission::findOrCreate('dashboard.view');
    $role->givePermissionTo('dashboard.view');
    $user->assignRole($role);

    $result = resolveChannelCallback('dashboard', $user);

    expect($result)->toBeTrue();
});

it('dashboard channel callback returns true for staff role with dashboard.view permission', function () {
    $user = User::factory()->create();
    $role = Role::findOrCreate('staff');
    Permission::findOrCreate('dashboard.view');
    $role->givePermissionTo('dashboard.view');
    $user->assignRole($role);

    $result = resolveChannelCallback('dashboard', $user);

    expect($result)->toBeTrue();
});

it('dashboard channel callback returns true for accountant role with dashboard.view permission', function () {
    $user = User::factory()->create();
    $role = Role::findOrCreate('accountant');
    Permission::findOrCreate('dashboard.view');
    $role->givePermissionTo('dashboard.view');
    $user->assignRole($role);

    $result = resolveChannelCallback('dashboard', $user);

    expect($result)->toBeTrue();
});

it('dashboard channel callback returns true for viewer role with dashboard.view permission', function () {
    $user = User::factory()->create();
    $role = Role::findOrCreate('viewer');
    Permission::findOrCreate('dashboard.view');
    $role->givePermissionTo('dashboard.view');
    $user->assignRole($role);

    $result = resolveChannelCallback('dashboard', $user);

    expect($result)->toBeTrue();
});

/* HTTP auth endpoint still requires authentication */

it('dashboard channel auth endpoint denies unauthenticated requests', function () {
    $this->postJson('/api/v1/broadcasting/auth', [
        'channel_name' => 'private-dashboard',
        'socket_id' => '123.456',
    ])
        ->assertUnauthorized();
});
