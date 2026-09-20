<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

it('can change password with correct current password', function () {
    $user = User::factory()->create(['password' => Hash::make('OldPass123!')]);

    $this->actingAs($user)
        ->patchJson('/api/v1/profile/password', [
            'current_password' => 'OldPass123!',
            'password' => 'NewPass456!',
            'password_confirmation' => 'NewPass456!',
        ])
        ->assertStatus(200)
        ->assertJsonFragment(['message' => 'Password changed successfully.']);

    expect(Hash::check('NewPass456!', $user->fresh()->password))->toBeTrue();
});

it('rejects password change with wrong current password', function () {
    $user = User::factory()->create(['password' => Hash::make('OldPass123!')]);

    $this->actingAs($user)
        ->patchJson('/api/v1/profile/password', [
            'current_password' => 'WrongPass!',
            'password' => 'NewPass456!',
            'password_confirmation' => 'NewPass456!',
        ])
        ->assertStatus(422);
});

it('rejects password change when confirmation does not match', function () {
    $user = User::factory()->create(['password' => Hash::make('OldPass123!')]);

    $this->actingAs($user)
        ->patchJson('/api/v1/profile/password', [
            'current_password' => 'OldPass123!',
            'password' => 'NewPass456!',
            'password_confirmation' => 'DifferentPass456!',
        ])
        ->assertStatus(422);
});
