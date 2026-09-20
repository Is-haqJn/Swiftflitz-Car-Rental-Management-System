<?php

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

it('can login and logout', function () {
    $password = 'password';
    $user = User::factory()->create(['password' => bcrypt($password)]);

    $resp = $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => $password,
    ])->assertStatus(200)->json();

    expect(isset($resp['token']))->toBeTrue();

    $token = $resp['token'];

    $this->withHeader('Authorization', 'Bearer ' . $token)
        ->postJson('/api/v1/auth/logout')
        ->assertStatus(204);
});

it('can request a forgot password email', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])
        ->assertStatus(200)
        ->assertJsonFragment(['message' => 'Password reset link sent. Please check your email.']);

    Notification::assertSentTo($user, ResetPasswordNotification::class);
});

it('validates email on forgot password request', function () {
    $this->postJson('/api/v1/auth/forgot-password', ['email' => 'not-an-email'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

it('returns error for invalid reset token', function () {
    $user = User::factory()->create();

    $this->postJson('/api/v1/auth/reset-password', [
        'token' => 'invalid-token',
        'email' => $user->email,
        'password' => 'newpassword123',
        'password_confirmation' => 'newpassword123',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});
