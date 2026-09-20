<?php

use App\Enums\ExportStatus;
use App\Models\ExportRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

/* GET /api/v1/exports */
it('requires authentication to list exports', function () {
    $this->getJson('/api/v1/exports')
        ->assertUnauthorized();
});

it('can list export records for authenticated user', function () {
    $user = User::factory()->create();

    ExportRecord::factory()->create([
        'user_id' => $user->id,
        'type' => 'rentals',
        'format' => 'xlsx',
        'status' => ExportStatus::Pending,
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/exports')
        ->assertSuccessful();

    expect($response->json('data'))->toHaveCount(1);
});

it('only returns export records for the authenticated user', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();

    ExportRecord::factory()->create([
        'user_id' => $other->id,
        'type' => 'rentals',
        'format' => 'xlsx',
        'status' => ExportStatus::Pending,
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/exports')
        ->assertSuccessful();

    expect($response->json('data'))->toBeEmpty();
});

/* POST /api/v1/exports/queue */
it('requires authentication to queue an export', function () {
    $this->postJson('/api/v1/exports/queue', [])
        ->assertUnauthorized();
});

it('can queue a new export', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/exports/queue', [
            'type' => 'rentals',
            'format' => 'xlsx',
        ])
        ->assertStatus(202);

    expect($response->json('message'))->toContain('Export queued');
});

it('validates required type when queuing export', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/exports/queue', [
            'format' => 'xlsx',
        ])
        ->assertUnprocessable();
});

it('validates invalid format when queuing export', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/exports/queue', [
            'type' => 'rentals',
            'format' => 'doc',
        ])
        ->assertUnprocessable();
});

/* GET /api/v1/exports/{export}/download */
it('requires authentication to download an export', function () {
    $this->getJson('/api/v1/exports/some-id/download')
        ->assertUnauthorized();
});

it('returns 403 when downloading another user export', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();

    $export = ExportRecord::factory()->create([
        'user_id' => $other->id,
        'type' => 'rentals',
        'format' => 'xlsx',
        'status' => ExportStatus::Ready,
        'file_path' => 'exports/test.xlsx',
        'filename' => 'test.xlsx',
        'expires_at' => now()->addDay(),
    ]);

    $this->actingAs($user, 'sanctum')
        ->getJson("/api/v1/exports/{$export->id}/download")
        ->assertForbidden();
});

it('returns 422 when export is not ready', function () {
    $user = User::factory()->create();

    $export = ExportRecord::factory()->create([
        'user_id' => $user->id,
        'type' => 'rentals',
        'format' => 'xlsx',
        'status' => ExportStatus::Pending,
        'expires_at' => now()->addDay(),
    ]);

    $this->actingAs($user, 'sanctum')
        ->getJson("/api/v1/exports/{$export->id}/download")
        ->assertStatus(422);
});

it('streams a pdf export with correct content-type and content-disposition headers', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $filePath = 'exports/report.pdf';
    Storage::put($filePath, '%PDF binary content');

    $export = ExportRecord::factory()->create([
        'user_id' => $user->id,
        'type' => 'rentals',
        'format' => 'pdf',
        'status' => ExportStatus::Ready,
        'file_path' => $filePath,
        'filename' => 'report.pdf',
        'expires_at' => now()->addDay(),
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->get("/api/v1/exports/{$export->id}/download");

    $response->assertSuccessful();
    expect($response->headers->get('Content-Type'))->toContain('application/pdf');
    expect($response->headers->get('Content-Disposition'))->toContain('attachment');
    expect($response->headers->get('Content-Disposition'))->toContain('report.pdf');
});

it('streams an xlsx export with correct content-type header', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $filePath = 'exports/report.xlsx';
    Storage::put($filePath, 'xlsx binary content');

    $export = ExportRecord::factory()->create([
        'user_id' => $user->id,
        'type' => 'rentals',
        'format' => 'xlsx',
        'status' => ExportStatus::Ready,
        'file_path' => $filePath,
        'filename' => 'report.xlsx',
        'expires_at' => now()->addDay(),
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->get("/api/v1/exports/{$export->id}/download");

    $response->assertSuccessful();
    expect($response->headers->get('Content-Type'))->toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect($response->headers->get('Content-Disposition'))->toContain('attachment');
});

/* DELETE /api/v1/exports/{export} */
it('requires authentication to delete an export', function () {
    $this->deleteJson('/api/v1/exports/some-id')
        ->assertUnauthorized();
});

it('can delete own export record', function () {
    Storage::fake('local');

    $user = User::factory()->create();

    $export = ExportRecord::factory()->create([
        'user_id' => $user->id,
        'type' => 'rentals',
        'format' => 'xlsx',
        'status' => ExportStatus::Pending,
    ]);

    $this->actingAs($user, 'sanctum')
        ->deleteJson("/api/v1/exports/{$export->id}")
        ->assertSuccessful();

    $this->assertDatabaseMissing('export_records', ['id' => $export->id]);
});

/* GET /api/v1/export/rentals */
it('requires authentication to export rentals sync', function () {
    $this->getJson('/api/v1/export/rentals')
        ->assertUnauthorized();
});

it('can export rentals synchronously', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->get('/api/v1/export/rentals')
        ->assertSuccessful();
});

/* GET /api/v1/export/customers */
it('requires authentication to export customers sync', function () {
    $this->getJson('/api/v1/export/customers')
        ->assertUnauthorized();
});

it('can export customers synchronously', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->get('/api/v1/export/customers')
        ->assertSuccessful();
});

/* GET /api/v1/export/vehicles */
it('requires authentication to export vehicles sync', function () {
    $this->getJson('/api/v1/export/vehicles')
        ->assertUnauthorized();
});

it('can export vehicles synchronously', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->get('/api/v1/export/vehicles')
        ->assertSuccessful();
});

/* Activity Logs Export */
it('can queue an activity_logs export', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/exports/queue', [
            'type' => 'activity_logs',
            'format' => 'xlsx',
        ])
        ->assertStatus(202);

    expect($response->json('message'))->toContain('Export queued');
});

it('validates activity_logs as a valid export type', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/exports/queue', [
            'type' => 'invalid_type',
            'format' => 'xlsx',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['type']);
});
