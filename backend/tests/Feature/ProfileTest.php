<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

/* GET /api/v1/profile */
it('requires authentication to view profile', function () {
    $this->getJson('/api/v1/profile')
        ->assertUnauthorized();
});

it('can view own profile', function () {
    $user = User::factory()->create(['name' => 'John Doe']);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/profile')
        ->assertSuccessful();

    expect($response->json('data.id'))->toBe($user->id)
        ->and($response->json('data.name'))->toBe('John Doe');
});

it('includes roles and permissions in profile response', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/profile')
        ->assertSuccessful();

    $data = $response->json('data');

    expect($data)->toHaveKey('roles')
        ->and($data)->toHaveKey('permissions');
});

/* PATCH /api/v1/profile */
it('requires authentication to update profile', function () {
    $this->patchJson('/api/v1/profile', [])
        ->assertUnauthorized();
});

it('can update own name', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->patchJson('/api/v1/profile', ['name' => 'Updated Name'])
        ->assertSuccessful()
        ->assertJsonPath('data.name', 'Updated Name');
});

it('can update own phone number', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->patchJson('/api/v1/profile', ['phone' => '+233201234567'])
        ->assertSuccessful()
        ->assertJsonPath('data.phone', '+233201234567');
});

it('can update own username', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->patchJson('/api/v1/profile', ['username' => 'johndoe99'])
        ->assertSuccessful()
        ->assertJsonPath('data.username', 'johndoe99');
});

/* GET /api/v1/profile/activity */
it('requires authentication to view own activity log', function () {
    $this->getJson('/api/v1/profile/activity')
        ->assertUnauthorized();
});

it('can view own activity log', function () {
    $user = User::factory()->create();

    activity()->causedBy($user)->performedOn($user)->event('viewed')->log('Profile viewed.');

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/profile/activity')
        ->assertSuccessful();

    expect($response->json('data'))->toBeArray();
});

/* GET /api/v1/profile/sessions */
it('requires authentication to view sessions', function () {
    $this->getJson('/api/v1/profile/sessions')
        ->assertUnauthorized();
});

it('can view own active sessions', function () {
    $user = User::factory()->create();
    $user->createToken('web-session');

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/profile/sessions')
        ->assertSuccessful();

    expect($response->json('data'))->toBeArray();
});

it('excludes impersonation tokens from own sessions', function () {
    $user = User::factory()->create();
    $user->createToken('Chrome - 192.168.1.1');
    $user->createToken('impersonation_token'); // should be hidden

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/profile/sessions')
        ->assertSuccessful();

    $names = collect($response->json('data'))->pluck('name');

    expect($names)->not->toContain('impersonation_token');
    expect($names)->toContain('Chrome - 192.168.1.1');
});

/* DELETE /api/v1/profile/sessions/{tokenId} */
it('can revoke a specific session', function () {
    $user = User::factory()->create();
    $token = $user->createToken('revoke-me');
    $tokenId = $token->accessToken->id;

    $this->actingAs($user, 'sanctum')
        ->deleteJson("/api/v1/profile/sessions/{$tokenId}")
        ->assertNoContent();

    $this->assertDatabaseMissing('personal_access_tokens', ['id' => $tokenId]);
});

/* POST /api/v1/profile/photo */
it('requires authentication to upload profile photo', function () {
    $this->postJson('/api/v1/profile/photo', [])
        ->assertUnauthorized();
});

it('can upload a profile photo', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    $file = UploadedFile::fake()->image('avatar.jpg', 200, 200);

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/profile/photo', ['photo' => $file])
        ->assertSuccessful()
        ->assertJsonPath('message', 'Profile photo updated successfully.');

    expect($response->json('data.profile_photo_url'))->not->toBeNull();
});

it('rejects non-image files for profile photo', function () {
    $user = User::factory()->create();

    $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/profile/photo', ['photo' => $file])
        ->assertUnprocessable();
});

it('requires a file for profile photo upload', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/profile/photo', [])
        ->assertUnprocessable();
});

/* DELETE /api/v1/profile/photo */
it('requires authentication to remove profile photo', function () {
    $this->deleteJson('/api/v1/profile/photo')
        ->assertUnauthorized();
});

it('can remove profile photo when one exists', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    // ? Store a fake photo first
    $path = UploadedFile::fake()->image('avatar.jpg')->store('profile-photos', 'public');
    $user->update(['profile_photo_path' => $path]);

    $response = $this->actingAs($user, 'sanctum')
        ->deleteJson('/api/v1/profile/photo')
        ->assertSuccessful()
        ->assertJsonPath('message', 'Profile photo removed.');

    expect($response->json('data.profile_photo_url'))->toBeNull();
    expect($user->fresh()->profile_photo_path)->toBeNull();
});

it('can call remove photo endpoint even without an existing photo', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->deleteJson('/api/v1/profile/photo')
        ->assertSuccessful();
});
