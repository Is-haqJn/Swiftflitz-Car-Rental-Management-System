<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/* Public GET routes (no authentication required) */
it('header settings are publicly accessible without authentication', function () {
    $this->getJson('/api/v1/settings/header')
        ->assertSuccessful();
});

it('homepage settings are publicly accessible without authentication', function () {
    $this->getJson('/api/v1/settings/homepage')
        ->assertSuccessful();
});

it('about settings are publicly accessible without authentication', function () {
    $this->getJson('/api/v1/settings/about')
        ->assertSuccessful();
});

it('contact settings are publicly accessible without authentication', function () {
    $this->getJson('/api/v1/settings/contact')
        ->assertSuccessful();
});

it('footer settings are publicly accessible without authentication', function () {
    $this->getJson('/api/v1/settings/footer')
        ->assertSuccessful();
});

it('general settings are publicly accessible without authentication', function () {
    $this->getJson('/api/v1/settings/general')
        ->assertSuccessful();
});

/* Sensitive settings remain protected */
it('email settings require authentication', function () {
    $this->getJson('/api/v1/settings/email')
        ->assertUnauthorized();
});

it('payment settings require authentication', function () {
    $this->getJson('/api/v1/settings/payment')
        ->assertUnauthorized();
});

it('whatsapp settings require authentication', function () {
    $this->getJson('/api/v1/settings/whatsapp')
        ->assertUnauthorized();
});

/* Write routes remain protected */
it('updating general settings requires authentication', function () {
    $this->putJson('/api/v1/settings/general', [])
        ->assertUnauthorized();
});

it('updating homepage settings requires authentication', function () {
    $this->putJson('/api/v1/settings/homepage', [])
        ->assertUnauthorized();
});
