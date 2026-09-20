<?php

use App\Jobs\ProcessRentalVideoJob;
use App\Models\Rental;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

function tusVideo(string $token): string
{
    $tmpPath = tempnam(sys_get_temp_dir(), 'tus_vid_');

    /* Minimal ftyp box so finfo detects video/mp4 (not text/plain) */
    $mp4Header = "\x00\x00\x00\x1Cftypisom\x00\x00\x02\x00isomiso2avc1mp41";
    file_put_contents($tmpPath, $mp4Header . str_repeat("\x00", 512));

    Cache::put("tus_deferred:{$token}", [
        'path' => $tmpPath,
        'filename' => 'test-video.mp4',
        'mime_type' => 'video/mp4',
    ], now()->addHours(2));

    return $token;
}

it('uploads pickup videos via TUS tokens and attaches to pickup_video collection', function () {
    Storage::fake('media');

    $user = adminUser();
    $rental = Rental::factory()->create();
    tusVideo('pickup-tok-1');

    $this->actingAs($user, 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/upload-pickup-videos", [
            'video_tus_tokens' => ['pickup-tok-1'],
        ])
        ->assertOk();

    expect($rental->fresh()->getMedia('pickup_video'))->toHaveCount(1);
});

it('uploads return videos and attaches to return_video collection', function () {
    Storage::fake('media');

    $user = adminUser();
    $rental = Rental::factory()->create();
    tusVideo('return-tok-1');

    $this->actingAs($user, 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/upload-return-videos", [
            'video_tus_tokens' => ['return-tok-1'],
        ])
        ->assertOk();

    expect($rental->fresh()->getMedia('return_video'))->toHaveCount(1);
});

it('resolves multiple TUS tokens in one request', function () {
    Storage::fake('media');

    $user = adminUser();
    $rental = Rental::factory()->create();
    tusVideo('multi-tok-1');
    tusVideo('multi-tok-2');

    $this->actingAs($user, 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/upload-pickup-videos", [
            'video_tus_tokens' => ['multi-tok-1', 'multi-tok-2'],
        ])
        ->assertOk();

    expect($rental->fresh()->getMedia('pickup_video'))->toHaveCount(2);
});

it('rejects without rentals.manage_active with 403', function () {
    $user = User::factory()->create();
    Permission::firstOrCreate(['name' => 'rentals.manage_active', 'guard_name' => 'web']);
    $rental = Rental::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/upload-pickup-videos", [
            'video_tus_tokens' => ['any-token'],
        ])
        ->assertForbidden();
});

it('skips expired TUS tokens gracefully and processes the rest', function () {
    Storage::fake('media');

    $user = adminUser();
    $rental = Rental::factory()->create();
    tusVideo('valid-tok-exp-test');

    $this->actingAs($user, 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/upload-pickup-videos", [
            'video_tus_tokens' => ['non-existent-expired-token', 'valid-tok-exp-test'],
        ])
        ->assertOk();

    expect($rental->fresh()->getMedia('pickup_video'))->toHaveCount(1);
});

it('dispatches ProcessRentalVideoJob once per attached media item', function () {
    Bus::fake();
    Storage::fake('media');

    $user = adminUser();
    $rental = Rental::factory()->create();
    tusVideo('job-tok-1');
    tusVideo('job-tok-2');

    $this->actingAs($user, 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/upload-pickup-videos", [
            'video_tus_tokens' => ['job-tok-1', 'job-tok-2'],
        ])
        ->assertOk();

    Bus::assertDispatched(ProcessRentalVideoJob::class, 2);
});

it('returns null pickup_videos in RentalResource when none attached', function () {
    $user = adminUser();
    $rental = Rental::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->getJson("/api/v1/rentals/{$rental->id}")
        ->assertOk()
        ->assertJsonFragment(['pickup_videos' => null]);
});

it('returns 404 when rental not found', function () {
    $user = adminUser();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/rentals/99999/upload-pickup-videos', [
            'video_tus_tokens' => ['any-token'],
        ])
        ->assertNotFound();
});

it('streams video bytes with 206 for valid Range header', function () {
    Storage::fake('media');

    $user = adminUser();
    $rental = Rental::factory()->create();
    tusVideo('stream-tok-1');

    $uploadResponse = $this->actingAs($user, 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/upload-pickup-videos", [
            'video_tus_tokens' => ['stream-tok-1'],
        ])
        ->assertOk()
        ->json('data.pickup_videos.0');

    $mediaId = $uploadResponse['id'];

    $signedUrl = URL::temporarySignedRoute(
        'api.v1.rentals.videos.stream',
        now()->addHour(),
        ['rental' => $rental->id, 'media' => $mediaId]
    );

    $this->withHeaders(['Range' => 'bytes=0-9'])
        ->get($signedUrl)
        ->assertStatus(206)
        ->assertHeader('Accept-Ranges', 'bytes');
});

it('returns 410 when video_deleted flag is true', function () {
    Storage::fake('media');

    $user = adminUser();
    $rental = Rental::factory()->create();
    tusVideo('deleted-tok-1');

    $uploadResponse = $this->actingAs($user, 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/upload-pickup-videos", [
            'video_tus_tokens' => ['deleted-tok-1'],
        ])
        ->assertOk()
        ->json('data.pickup_videos.0');

    $mediaId = $uploadResponse['id'];

    Media::find($mediaId)
        ->setCustomProperty('video_deleted', true)
        ->save();

    $signedUrl = URL::temporarySignedRoute(
        'api.v1.rentals.videos.stream',
        now()->addHour(),
        ['rental' => $rental->id, 'media' => $mediaId]
    );

    $this->get($signedUrl)->assertStatus(410);
});
