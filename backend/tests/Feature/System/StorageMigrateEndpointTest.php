<?php

use App\Jobs\StorageMigrationJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

it('requires settings.edit permission', function () {
    $user = \App\Models\User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/system/storage/migrate', ['target' => 's3'])
        ->assertForbidden();
});

it('validates target required and in:media,s3', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/system/storage/migrate', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['target']);
});

it('rejects target=local with 422', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/system/storage/migrate', ['target' => 'local'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['target']);
});

it('dispatches StorageMigrationJob with target', function () {
    Queue::fake();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/system/storage/migrate', ['target' => 's3'])
        ->assertAccepted();

    Queue::assertPushed(StorageMigrationJob::class, function (StorageMigrationJob $job) {
        return $job->target === 's3';
    });
});

it('returns 202 Accepted', function () {
    Queue::fake();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/system/storage/migrate', ['target' => 's3'])
        ->assertStatus(202);
});
