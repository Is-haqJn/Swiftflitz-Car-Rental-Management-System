<?php

use App\Models\User;
use App\Settings\BackupSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

/* GET /api/v1/system/info */
it('requires authentication to view system info', function () {
    $this->getJson('/api/v1/system/info')
        ->assertStatus(401);
});

it('returns system information with expected keys', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/system/info')
        ->assertStatus(200);

    $data = $response->json('data');

    expect($data)->toHaveKey('php_version')
        ->and($data)->toHaveKey('laravel_version')
        ->and($data)->toHaveKey('environment')
        ->and($data)->toHaveKey('debug_mode')
        ->and($data)->toHaveKey('timezone')
        ->and($data)->toHaveKey('database_driver')
        ->and($data)->toHaveKey('cache_driver')
        ->and($data)->toHaveKey('queue_driver');
});

it('returns the correct php version', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/system/info')
        ->assertStatus(200);

    expect($response->json('data.php_version'))->toBe(PHP_VERSION);
});

it('returns the correct laravel version', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/system/info')
        ->assertStatus(200);

    expect($response->json('data.laravel_version'))->toBe(app()->version());
});

/* POST /api/v1/system/cache/clear */
it('requires authentication to clear cache', function () {
    $this->postJson('/api/v1/system/cache/clear')
        ->assertStatus(401);
});

it('can clear all caches', function () {
    $user = User::factory()->create();

    Cache::put('test_key', 'test_value', 60);

    Artisan::shouldReceive('call')->with('cache:clear')->once()->andReturn(0);
    Artisan::shouldReceive('call')->with('config:clear')->once()->andReturn(0);
    Artisan::shouldReceive('call')->with('route:clear')->once()->andReturn(0);
    Artisan::shouldReceive('call')->with('view:clear')->once()->andReturn(0);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/system/cache/clear')
        ->assertStatus(200)
        ->assertJsonPath('message', 'All caches cleared successfully.');
});

/* POST /api/v1/system/cache/config */
it('requires authentication to clear config cache', function () {
    $this->postJson('/api/v1/system/cache/config')
        ->assertStatus(401);
});

it('can clear config cache', function () {
    $user = User::factory()->create();

    Artisan::shouldReceive('call')->with('config:clear')->once()->andReturn(0);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/system/cache/config')
        ->assertStatus(200)
        ->assertJsonPath('message', 'Config cache cleared successfully.');
});

/* POST /api/v1/system/cache/routes */
it('requires authentication to clear route cache', function () {
    $this->postJson('/api/v1/system/cache/routes')
        ->assertStatus(401);
});

it('can clear route cache', function () {
    $user = User::factory()->create();

    Artisan::shouldReceive('call')->with('route:clear')->once()->andReturn(0);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/system/cache/routes')
        ->assertStatus(200)
        ->assertJsonPath('message', 'Route cache cleared successfully.');
});

/* POST /api/v1/system/cache/views */
it('requires authentication to clear view cache', function () {
    $this->postJson('/api/v1/system/cache/views')
        ->assertStatus(401);
});

it('can clear view cache', function () {
    $user = User::factory()->create();

    Artisan::shouldReceive('call')->with('view:clear')->once()->andReturn(0);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/system/cache/views')
        ->assertStatus(200)
        ->assertJsonPath('message', 'View cache cleared successfully.');
});

/* POST /api/v1/system/backup/full */
it('requires authentication for full system backup', function () {
    $this->postJson('/api/v1/system/backup/full', [
        'include_database' => true,
    ])->assertStatus(401);
});

it('returns 422 when no backup options are selected', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/system/backup/full', [
            'include_database' => false,
            'include_env' => false,
            'include_logs' => false,
            'include_storage' => false,
        ])
        ->assertStatus(422);
});

it('returns 422 when no backup payload is sent', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/system/backup/full', [])
        ->assertStatus(422);
});

it('rejects non-boolean backup option values', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/system/backup/full', [
            'include_database' => 'yes',
        ])
        ->assertStatus(422);
});

it('passes selected options to the system:backup artisan command', function () {
    $user = User::factory()->create();

    Artisan::shouldReceive('call')
        ->once()
        ->with('system:backup', ['--include-database' => true, '--include-env' => true])
        ->andReturn(0);

    Artisan::shouldReceive('output')->once()->andReturn('System backup saved.');

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/system/backup/full', [
            'include_database' => true,
            'include_env' => true,
            'include_logs' => false,
            'include_storage' => false,
        ])
        ->assertStatus(200)
        ->assertJsonPath('message', 'Full system backup completed.');
});

/* GET /api/v1/system/queue/status */
it('requires authentication to view queue status', function () {
    $this->getJson('/api/v1/system/queue/status')
        ->assertStatus(401);
});

it('returns queue status with pending and failed counts', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/system/queue/status')
        ->assertStatus(200);

    $data = $response->json('data');

    expect($data)->toHaveKey('pending_jobs')
        ->and($data)->toHaveKey('failed_jobs')
        ->and($data)->toHaveKey('worker_status')
        ->and($data['pending_jobs'])->toBeInt()
        ->and($data['failed_jobs'])->toBeInt()
        ->and($data['worker_status'])->toBeIn(['running', 'stopped', 'unknown']);
});

/* POST /api/v1/system/queue/restart */
it('requires authentication to restart queue workers', function () {
    $this->postJson('/api/v1/system/queue/restart')
        ->assertStatus(401);
});

it('can restart queue workers', function () {
    $user = User::factory()->create();

    Artisan::shouldReceive('call')->with('queue:restart')->once()->andReturn(0);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/system/queue/restart')
        ->assertStatus(200)
        ->assertJsonPath('message', 'Queue workers restarted successfully.');
});

/* POST /api/v1/system/queue/flush */
it('requires authentication to flush failed jobs', function () {
    $this->postJson('/api/v1/system/queue/flush')
        ->assertStatus(401);
});

it('can flush all failed jobs', function () {
    $user = User::factory()->create();

    Artisan::shouldReceive('call')->with('queue:flush')->once()->andReturn(0);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/system/queue/flush')
        ->assertStatus(200)
        ->assertJsonPath('message', 'Failed jobs cleared successfully.');
});

/* POST /api/v1/system/queue/retry */
it('requires authentication to retry failed jobs', function () {
    $this->postJson('/api/v1/system/queue/retry')
        ->assertStatus(401);
});

it('can retry all failed jobs', function () {
    $user = User::factory()->create();

    Artisan::shouldReceive('call')->with('queue:retry', ['id' => ['all']])->once()->andReturn(0);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/system/queue/retry')
        ->assertStatus(200)
        ->assertJsonPath('message', 'Failed jobs queued for retry.');
});

/* GET /api/v1/system/backup-settings */
it('requires authentication to view backup settings', function () {
    $this->getJson('/api/v1/system/backup-settings')
        ->assertStatus(401);
});

it('returns backup settings with toggle fields for any authenticated user', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/system/backup-settings')
        ->assertStatus(200);

    $data = $response->json('data');

    expect($data)->toHaveKey('scheduled_db_backup_enabled')
        ->and($data)->toHaveKey('scheduled_system_backup_enabled')
        ->and($data['scheduled_db_backup_enabled'])->toBeBool()
        ->and($data['scheduled_system_backup_enabled'])->toBeBool();
});

/* PUT /api/v1/system/backup-settings */
it('requires authentication to update backup settings', function () {
    $this->putJson('/api/v1/system/backup-settings', [
        'scheduled_db_backup_enabled' => false,
    ])->assertStatus(401);
});

it('requires edit_backup permission to update backup settings', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/system/backup-settings', [
            'scheduled_db_backup_enabled' => false,
        ])->assertStatus(403);
});

it('can toggle scheduled db backup off', function () {
    Permission::firstOrCreate(['name' => 'settings.edit_backup', 'guard_name' => 'web']);
    $user = User::factory()->create();
    $user->givePermissionTo('settings.edit_backup');

    $settings = app(BackupSettings::class);
    $settings->scheduled_db_backup_enabled = true;
    $settings->save();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/system/backup-settings', [
            'scheduled_db_backup_enabled' => false,
        ])
        ->assertStatus(200)
        ->assertJsonPath('data.scheduled_db_backup_enabled', false);
});

/* DELETE /api/v1/system/backups/{filename} */
it('requires authentication to delete a backup', function () {
    $this->deleteJson('/api/v1/system/backups/db-backup-2026-01-01-000000.sql')
        ->assertStatus(401);
});

it('denies delete without settings.delete_backup permission', function () {
    Storage::fake('local');
    Storage::disk('local')->put('backups/db-backup-2026-01-01-000000.sql', 'dummy');

    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->deleteJson('/api/v1/system/backups/db-backup-2026-01-01-000000.sql')
        ->assertStatus(403);

    expect(Storage::disk('local')->exists('backups/db-backup-2026-01-01-000000.sql'))->toBeTrue();
});

it('allows super_admin to delete a backup file', function () {
    Storage::fake('local');
    Storage::disk('local')->put('backups/system-backup-2026-04-21-172143.zip', 'dummy');

    Permission::firstOrCreate(['name' => 'settings.delete_backup', 'guard_name' => 'web']);
    $user = User::factory()->create();
    $user->givePermissionTo('settings.delete_backup');

    $this->actingAs($user, 'sanctum')
        ->deleteJson('/api/v1/system/backups/system-backup-2026-04-21-172143.zip')
        ->assertStatus(200)
        ->assertJsonPath('message', 'Backup deleted successfully.');

    expect(Storage::disk('local')->exists('backups/system-backup-2026-04-21-172143.zip'))->toBeFalse();
});

it('returns 404 when deleting a non-existent backup', function () {
    Storage::fake('local');

    Permission::firstOrCreate(['name' => 'settings.delete_backup', 'guard_name' => 'web']);
    $user = User::factory()->create();
    $user->givePermissionTo('settings.delete_backup');

    $this->actingAs($user, 'sanctum')
        ->deleteJson('/api/v1/system/backups/missing.zip')
        ->assertStatus(404);
});

it('can toggle scheduled system backup on', function () {
    Permission::firstOrCreate(['name' => 'settings.edit_backup', 'guard_name' => 'web']);
    $user = User::factory()->create();
    $user->givePermissionTo('settings.edit_backup');

    $settings = app(BackupSettings::class);
    $settings->scheduled_system_backup_enabled = false;
    $settings->save();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/system/backup-settings', [
            'scheduled_system_backup_enabled' => true,
        ])
        ->assertStatus(200)
        ->assertJsonPath('data.scheduled_system_backup_enabled', true);
});
