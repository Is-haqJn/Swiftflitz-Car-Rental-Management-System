<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

it('login response includes expires_at field', function () {
    $user = User::factory()->create([
        'password' => Hash::make('password123'),
        'is_active' => true,
    ]);
    Role::findOrCreate('admin', 'web');
    $user->assignRole('admin');

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'password123',
        'remember' => false,
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'data' => ['user', 'expires_at'],
            'token',
        ]);

    expect($response->json('data.expires_at'))->not->toBeNull();
});

it('password reset revokes all existing sanctum tokens', function () {
    $user = User::factory()->create([
        'password' => Hash::make('oldpassword'),
        'is_active' => true,
    ]);

    /* Create 2 existing tokens */
    $user->createToken('token-1');
    $user->createToken('token-2');
    expect($user->tokens()->count())->toBe(2);

    /* Generate a valid reset token via the broker */
    $token = Password::createToken($user);

    /* Call reset endpoint */
    $this->postJson('/api/v1/auth/reset-password', [
        'token' => $token,
        'email' => $user->email,
        'password' => 'newpassword123',
        'password_confirmation' => 'newpassword123',
    ])->assertOk();

    /* All prior tokens must be revoked */
    expect($user->fresh()->tokens()->count())->toBe(0);
});
