<?php

use App\Models\User;
use App\Services\ProfileService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

uses(\Tests\TestCase::class, RefreshDatabase::class);

/* ProfileService::updateProfile() */
it('updateProfile saves the name change on the user', function () {
    $user = User::factory()->create(['name' => 'Before']);
    $service = new ProfileService;

    $service->updateProfile($user, ['name' => 'After']);

    expect($user->fresh()->name)->toBe('After');
});

/* ProfileService::changePassword() */
it('changePassword stores a hashed password', function () {
    $user = User::factory()->create(['password' => Hash::make('old')]);
    $service = new ProfileService;

    $service->changePassword($user, 'newSecure1!');

    expect(Hash::check('newSecure1!', $user->fresh()->password))->toBeTrue();
});

it('changePassword does not store the plaintext password', function () {
    $user = User::factory()->create();
    $service = new ProfileService;

    $service->changePassword($user, 'plaintext');

    expect($user->fresh()->password)->not->toBe('plaintext');
});

/* ProfileService::getSessions() */
it('getSessions only returns non-impersonation tokens', function () {
    $user = User::factory()->create();
    $user->createToken('api-client');
    $user->createToken('impersonation_token');
    $service = new ProfileService;

    $tokens = $service->getSessions($user);

    expect($tokens->pluck('name')->toArray())->toContain('api-client')
        ->and($tokens->pluck('name')->toArray())->not->toContain('impersonation_token');
});

/* ProfileService::revokeSession() */
it('revokeSession removes only the specified token', function () {
    $user = User::factory()->create();
    $keep = $user->createToken('keep-me');
    $remove = $user->createToken('remove-me');
    $removeId = $remove->accessToken->id;
    $service = new ProfileService;

    $service->revokeSession($user, $removeId);

    expect($user->tokens()->where('id', $removeId)->exists())->toBeFalse()
        ->and($user->tokens()->where('id', $keep->accessToken->id)->exists())->toBeTrue();
});

/* ProfileService::uploadPhoto() */
it('uploadPhoto stores the file on the public disk', function () {
    Storage::fake('public');
    $user = User::factory()->create(['profile_photo_path' => null]);
    $service = new ProfileService;

    $updated = $service->uploadPhoto($user, UploadedFile::fake()->image('avatar.jpg'));

    Storage::disk('public')->assertExists($updated->profile_photo_path);
});

/* ProfileService::removePhoto() */
it('removePhoto clears profile_photo_path', function () {
    Storage::fake('public');
    $path = UploadedFile::fake()->image('avatar.jpg')->store('profile-photos', 'public');
    $user = User::factory()->create(['profile_photo_path' => $path]);
    $service = new ProfileService;

    $updated = $service->removePhoto($user);

    expect($updated->profile_photo_path)->toBeNull();
});

it('removePhoto does nothing when user has no photo', function () {
    $user = User::factory()->create(['profile_photo_path' => null]);
    $service = new ProfileService;

    $updated = $service->removePhoto($user);

    expect($updated->profile_photo_path)->toBeNull();
});
