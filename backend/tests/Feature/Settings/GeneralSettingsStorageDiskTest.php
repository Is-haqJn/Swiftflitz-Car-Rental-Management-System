<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('defaults storage_disk to media on fresh install', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/settings/general')
        ->assertOk()
        ->assertJsonPath('data.storage_disk', 'media');
});

it('rejects update when storage_disk not in media,s3', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->putJson('/api/v1/settings/general', ['storage_disk' => 'local'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['storage_disk']);
});

it('persists storage_disk via PUT settings/general', function () {
    $admin = adminUser();

    $this->actingAs($admin, 'sanctum')
        ->putJson('/api/v1/settings/general', ['storage_disk' => 's3'])
        ->assertOk();

    $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/settings/general')
        ->assertOk()
        ->assertJsonPath('data.storage_disk', 's3');
});
