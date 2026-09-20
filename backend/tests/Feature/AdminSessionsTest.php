<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;

uses(RefreshDatabase::class);

/* GET /api/v1/admin/sessions */
it('requires authentication to list admin sessions', function () {
    $this->getJson('/api/v1/admin/sessions')
        ->assertUnauthorized();
});

it('can list all active sessions across all users', function () {
    $admin = User::factory()->create();
    $other = User::factory()->create();

    $admin->createToken('Chrome - 192.168.1.1');
    $other->createToken('Firefox - 10.0.0.2');

    $response = $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/admin/sessions')
        ->assertSuccessful()
        ->assertJsonPath('status', 'success');

    // Tokens are directly under data (custom paginator structure)
    $tokens = $response->json('data');
    expect(count($tokens))->toBeGreaterThanOrEqual(2);
});

it('includes tokenable user info for each session', function () {
    $admin = User::factory()->create();
    $other = User::factory()->create();

    $admin->createToken('Chrome - 192.168.1.1');
    $other->createToken('Safari - 10.0.0.5');

    $response = $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/admin/sessions')
        ->assertSuccessful();

    $tokens = $response->json('data');
    $tokenableNames = collect($tokens)->pluck('tokenable.name')->filter()->values()->all();

    expect($tokenableNames)->toContain($admin->name);
    expect($tokenableNames)->toContain($other->name);
});

it('paginates admin sessions', function () {
    $admin = User::factory()->create();

    for ($i = 0; $i < 5; $i++) {
        User::factory()->create()->createToken("Session {$i}");
    }

    $response = $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/admin/sessions?per_page=2')
        ->assertSuccessful();

    expect($response->json('data'))->toHaveCount(2);
    expect($response->json('meta.last_page'))->toBeGreaterThan(1);
});

it('excludes impersonation tokens from the session list', function () {
    $admin = User::factory()->create();
    $target = User::factory()->create();

    $target->createToken('Chrome - 10.0.0.1');
    $target->createToken('impersonation_token'); // should be hidden

    $response = $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/admin/sessions')
        ->assertSuccessful();

    $names = collect($response->json('data'))->pluck('name');

    expect($names)->not->toContain('impersonation_token');
    expect($names)->toContain('Chrome - 10.0.0.1');
});

/* DELETE /api/v1/admin/sessions/{tokenId} */
it('requires authentication to revoke an admin session', function () {
    $this->deleteJson('/api/v1/admin/sessions/1')
        ->assertUnauthorized();
});

it('can revoke any session by token id', function () {
    $admin = User::factory()->create();
    $target = User::factory()->create();

    $token = $target->createToken('Chrome - 10.0.0.1');
    $tokenId = $token->accessToken->id;

    $this->actingAs($admin, 'sanctum')
        ->deleteJson("/api/v1/admin/sessions/{$tokenId}")
        ->assertSuccessful()
        ->assertJsonPath('status', 'success');

    expect(PersonalAccessToken::find($tokenId))->toBeNull();
});

it('returns 404 when revoking a non-existent session', function () {
    $admin = User::factory()->create();

    $this->actingAs($admin, 'sanctum')
        ->deleteJson('/api/v1/admin/sessions/99999')
        ->assertNotFound();
});
