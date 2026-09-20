<?php

use App\Models\User;
use App\Services\Contracts\ProfileServiceInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

/* ProfileService::updateProfile() */
it('updateProfile updates the user and returns fresh user', function () {
    $user = User::factory()->create(['name' => 'Old Name']);
    $service = app(ProfileServiceInterface::class);

    $updated = $service->updateProfile($user, ['name' => 'New Name']);

    expect($updated->name)->toBe('New Name')
        ->and($user->fresh()->name)->toBe('New Name');
});

it('updateProfile logs an activity entry', function () {
    $user = User::factory()->create();
    $service = app(ProfileServiceInterface::class);

    $service->updateProfile($user, ['name' => 'Updated']);

    $this->assertDatabaseHas('activity_log', [
        'causer_id' => $user->id,
        'description' => 'Profile updated.',
    ]);
});

/* ProfileService::changePassword() */
it('changePassword hashes and stores the new password', function () {
    $user = User::factory()->create(['password' => Hash::make('OldPass!')]);
    $service = app(ProfileServiceInterface::class);

    $service->changePassword($user, 'NewPass123!');

    expect(Hash::check('NewPass123!', $user->fresh()->password))->toBeTrue();
});

it('changePassword logs an activity entry', function () {
    $user = User::factory()->create();
    $service = app(ProfileServiceInterface::class);

    $service->changePassword($user, 'NewPass123!');

    $this->assertDatabaseHas('activity_log', [
        'causer_id' => $user->id,
        'description' => 'Password changed.',
    ]);
});

/* ProfileService::getActivity() */
it('getActivity returns paginated activity for the user', function () {
    $user = User::factory()->create();
    activity()->causedBy($user)->performedOn($user)->event('tested')->log('Test entry.');
    $service = app(ProfileServiceInterface::class);

    $result = $service->getActivity($user);

    expect($result->total())->toBeGreaterThanOrEqual(1);
});

/* ProfileService::getSessions() */
it('getSessions excludes impersonation tokens', function () {
    $user = User::factory()->create();
    $user->createToken('web-session');
    $user->createToken('impersonation_token');
    $service = app(ProfileServiceInterface::class);

    $tokens = $service->getSessions($user);

    expect($tokens->pluck('name'))->not->toContain('impersonation_token')
        ->and($tokens->pluck('name'))->toContain('web-session');
});

/* ProfileService::revokeSession() */
it('revokeSession deletes the specified token', function () {
    $user = User::factory()->create();
    $token = $user->createToken('to-revoke');
    $tokenId = $token->accessToken->id;
    $service = app(ProfileServiceInterface::class);

    $service->revokeSession($user, $tokenId);

    $this->assertDatabaseMissing('personal_access_tokens', ['id' => $tokenId]);
});

/* ProfileService::uploadPhoto() */
it('uploadPhoto stores the file and updates profile_photo_path', function () {
    Storage::fake('public');
    $user = User::factory()->create(['profile_photo_path' => null]);
    $file = UploadedFile::fake()->image('avatar.jpg');
    $service = app(ProfileServiceInterface::class);

    $updated = $service->uploadPhoto($user, $file);

    expect($updated->profile_photo_path)->not->toBeNull();
    Storage::disk('public')->assertExists($updated->profile_photo_path);
});

it('uploadPhoto deletes the previous photo when one exists', function () {
    Storage::fake('public');
    $existingPath = UploadedFile::fake()->image('old.jpg')->store('profile-photos', 'public');
    $user = User::factory()->create(['profile_photo_path' => $existingPath]);
    $file = UploadedFile::fake()->image('new.jpg');
    $service = app(ProfileServiceInterface::class);

    $service->uploadPhoto($user, $file);

    Storage::disk('public')->assertMissing($existingPath);
});

/* ProfileService::removePhoto() */
it('removePhoto deletes the file and clears profile_photo_path', function () {
    Storage::fake('public');
    $path = UploadedFile::fake()->image('avatar.jpg')->store('profile-photos', 'public');
    $user = User::factory()->create(['profile_photo_path' => $path]);
    $service = app(ProfileServiceInterface::class);

    $updated = $service->removePhoto($user);

    expect($updated->profile_photo_path)->toBeNull();
    Storage::disk('public')->assertMissing($path);
});

it('removePhoto is a no-op when no photo exists', function () {
    $user = User::factory()->create(['profile_photo_path' => null]);
    $service = app(ProfileServiceInterface::class);

    $updated = $service->removePhoto($user);

    expect($updated->profile_photo_path)->toBeNull();
});
