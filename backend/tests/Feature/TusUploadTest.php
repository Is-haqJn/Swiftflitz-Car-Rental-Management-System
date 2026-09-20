<?php

use App\Models\Rental;
use App\Models\User;
use App\Services\TusUpload\Handlers\DeferredTusHandler;
use App\Services\TusUpload\TusTempFileResolver;
use App\Services\TusUpload\TusUploadService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

/* Route auth protection */
it('requires auth to create a TUS upload', function () {
    $this->postJson('/api/v1/uploads/tus')->assertUnauthorized();
});

it('requires auth to patch a TUS upload', function () {
    $this->patchJson('/api/v1/uploads/tus/some-token')->assertUnauthorized();
});

it('requires auth to head a TUS upload', function () {
    $this->json('HEAD', '/api/v1/uploads/tus/some-token')->assertUnauthorized();
});

it('requires auth to delete a TUS upload', function () {
    $this->deleteJson('/api/v1/uploads/tus/some-token')->assertUnauthorized();
});

it('authenticated user reaches the TUS create endpoint without getting 401', function () {
    // The TUS server may return 412 (missing Tus-Resumable header) or another non-401 code.
    // What matters here is that auth was accepted.
    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/uploads/tus');

    expect($response->getStatusCode())->not->toBe(401);
});

/* TusUploadService dispatch */
it('TusUploadService dispatches to DeferredTusHandler for booking_license', function () {
    $tmpPath = tempnam(sys_get_temp_dir(), 'tus_dispatch_');
    file_put_contents($tmpPath, 'fake-image-data');

    app(TusUploadService::class)->dispatch([
        'entity_type' => 'booking_license',
        'tus_key' => 'dispatch-test-key',
        'filename' => 'license.jpg',
        'filetype' => 'image/jpeg',
    ], $tmpPath);

    expect(Cache::has('tus_deferred:dispatch-test-key'))->toBeTrue();

    @unlink($tmpPath);
});

it('TusUploadService dispatches to DeferredTusHandler for booking_id_document', function () {
    $tmpPath = tempnam(sys_get_temp_dir(), 'tus_id_');
    file_put_contents($tmpPath, 'fake-id-data');

    app(TusUploadService::class)->dispatch([
        'entity_type' => 'booking_id_document',
        'tus_key' => 'dispatch-id-key',
        'filename' => 'id_card.jpg',
        'filetype' => 'image/jpeg',
    ], $tmpPath);

    expect(Cache::has('tus_deferred:dispatch-id-key'))->toBeTrue();

    @unlink($tmpPath);
});

it('TusUploadService silently ignores unknown entity types', function () {
    app(TusUploadService::class)->dispatch(
        ['entity_type' => 'completely_unknown'],
        '/non-existent-path'
    );

    expect(true)->toBeTrue(); // no exception = pass
});

it('TusUploadService does nothing when entity_type is missing', function () {
    app(TusUploadService::class)->dispatch([], '/some/path');

    expect(true)->toBeTrue();
});

/* DeferredTusHandler */
it('DeferredTusHandler caches file details under the correct key', function () {
    $tmpPath = tempnam(sys_get_temp_dir(), 'tus_deferred_');
    file_put_contents($tmpPath, 'dummy content');

    app(DeferredTusHandler::class)->handle($tmpPath, [
        'tus_key' => 'deferred-abc',
        'filename' => 'receipt.pdf',
        'filetype' => 'application/pdf',
        'entity_type' => 'vehicle_expense_receipt',
    ]);

    $cached = Cache::get('tus_deferred:deferred-abc');

    expect($cached)->not->toBeNull()
        ->and($cached['path'])->toBe($tmpPath)
        ->and($cached['filename'])->toBe('receipt.pdf')
        ->and($cached['mime_type'])->toBe('application/pdf')
        ->and($cached['entity_type'])->toBe('vehicle_expense_receipt');

    @unlink($tmpPath);
});

it('DeferredTusHandler does nothing when tus_key is missing', function () {
    app(DeferredTusHandler::class)->handle('/some/path', ['filename' => 'test.jpg']);

    expect(Cache::has('tus_deferred:'))->toBeFalse();
});

it('DeferredTusHandler does nothing when the file does not exist', function () {
    app(DeferredTusHandler::class)->handle('/non/existent/file.jpg', [
        'tus_key' => 'missing-file-key',
    ]);

    expect(Cache::has('tus_deferred:missing-file-key'))->toBeFalse();
});

it('DeferredTusHandler sets cache TTL of 2 hours', function () {
    $tmpPath = tempnam(sys_get_temp_dir(), 'tus_ttl_');
    file_put_contents($tmpPath, 'data');

    app(DeferredTusHandler::class)->handle($tmpPath, [
        'tus_key' => 'ttl-key',
        'filename' => 'doc.jpg',
        'filetype' => 'image/jpeg',
    ]);

    expect(Cache::has('tus_deferred:ttl-key'))->toBeTrue()
        ->and(DeferredTusHandler::TTL_HOURS)->toBe(2);

    @unlink($tmpPath);
});

/* TusTempFileResolver */
it('TusTempFileResolver resolves a valid token to an UploadedFile', function () {
    $tmpPath = tempnam(sys_get_temp_dir(), 'tus_res_');
    file_put_contents($tmpPath, 'image data');

    Cache::put('tus_deferred:resolve-token-ok', [
        'path' => $tmpPath,
        'filename' => 'photo.jpg',
        'mime_type' => 'image/jpeg',
    ], now()->addHours(2));

    $file = app(TusTempFileResolver::class)->resolve('resolve-token-ok');

    expect($file)->toBeInstanceOf(UploadedFile::class)
        ->and($file->getClientOriginalName())->toBe('photo.jpg')
        ->and($file->getClientMimeType())->toBe('image/jpeg');

    @unlink($tmpPath);
});

it('TusTempFileResolver returns null for an unknown token', function () {
    expect(app(TusTempFileResolver::class)->resolve('completely-unknown-token'))->toBeNull();
});

it('TusTempFileResolver returns null when the cached file path no longer exists', function () {
    Cache::put('tus_deferred:ghost-token', [
        'path' => '/tmp/this/does/not/exist.jpg',
        'filename' => 'ghost.jpg',
        'mime_type' => 'image/jpeg',
    ], now()->addHours(2));

    expect(app(TusTempFileResolver::class)->resolve('ghost-token'))->toBeNull();
});

it('TusTempFileResolver::resolveMany resolves valid tokens and skips missing ones', function () {
    $tmpPath = tempnam(sys_get_temp_dir(), 'tus_many_');
    file_put_contents($tmpPath, 'data');

    Cache::put('tus_deferred:multi-good', [
        'path' => $tmpPath,
        'filename' => 'doc.pdf',
        'mime_type' => 'application/pdf',
    ], now()->addHours(2));

    $files = app(TusTempFileResolver::class)->resolveMany(['multi-good', 'multi-missing']);

    expect($files)->toHaveCount(1)
        ->and($files[0])->toBeInstanceOf(UploadedFile::class);

    @unlink($tmpPath);
});

it('TusTempFileResolver::resolveMany returns empty array when all tokens are invalid', function () {
    $files = app(TusTempFileResolver::class)->resolveMany(['bad-1', 'bad-2']);

    expect($files)->toBeEmpty();
});

/* Max upload size config */
it('max upload size is configured from swiftflitz config', function () {
    $size = config('swiftflitz.uploads.max_size');

    expect($size)->toBeInt()->toBeGreaterThan(0);
});

it('max upload size env var defaults to 20 MB', function () {
    // Default env value is 20, so config should be 20 * 1024 * 1024
    $expected = 20 * 1024 * 1024;
    $size = config('swiftflitz.uploads.max_size');

    expect($size)->toBe($expected);
});

/* RentalPolicy pickup permission */
it('super_admin user passes pickup policy via before()', function () {
    $user = adminUser();
    $rental = Rental::factory()->create();

    expect($user->can('pickup', $rental))->toBeTrue();
});

it('user without process_pickup permission is denied by pickup policy', function () {
    $user = User::factory()->create();
    $rental = Rental::factory()->create();

    expect($user->can('pickup', $rental))->toBeFalse();
});

it('user with rentals.process_pickup permission passes pickup policy', function () {
    $user = User::factory()->create();
    $permission = Permission::firstOrCreate(
        ['name' => 'rentals.process_pickup', 'guard_name' => 'web']
    );
    $user->givePermissionTo($permission);
    $rental = Rental::factory()->create();

    expect($user->can('pickup', $rental))->toBeTrue();
});
