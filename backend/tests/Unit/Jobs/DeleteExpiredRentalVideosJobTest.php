<?php

use App\Enums\RentalStatus;
use App\Jobs\DeleteExpiredRentalVideosJob;
use App\Models\Rental;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

uses(Tests\TestCase::class, RefreshDatabase::class);

function attachVideo(Rental $rental, string $collection = 'pickup_video'): Media
{
    $tmpPath = tempnam(sys_get_temp_dir(), 'del_vid_');
    $mp4Header = "\x00\x00\x00\x1Cftypisom\x00\x00\x02\x00isomiso2avc1mp41";
    file_put_contents($tmpPath, $mp4Header . str_repeat("\x00", 512));

    return $rental->addMedia($tmpPath)
        ->usingFileName('video.mp4')
        ->toMediaCollection($collection, 'media');
}

it('marks pickup_video media as video_deleted and removes file for expired completed rentals', function () {
    Storage::fake('media');

    $rental = Rental::factory()->completed()->create([
        'updated_at' => now()->subDays(31),
    ]);

    $media = attachVideo($rental, 'pickup_video');

    (new DeleteExpiredRentalVideosJob)->handle();

    $fresh = $media->fresh();
    expect($fresh->getCustomProperty('video_deleted'))->toBeTrue();
    Storage::disk('media')->assertMissing($media->getPathRelativeToRoot());
});

it('marks return_video media as video_deleted and removes file for expired completed rentals', function () {
    Storage::fake('media');

    $rental = Rental::factory()->completed()->create([
        'updated_at' => now()->subDays(31),
    ]);

    $media = attachVideo($rental, 'return_video');

    (new DeleteExpiredRentalVideosJob)->handle();

    $fresh = $media->fresh();
    expect($fresh->getCustomProperty('video_deleted'))->toBeTrue();
    Storage::disk('media')->assertMissing($media->getPathRelativeToRoot());
});

it('preserves the Media record and thumb conversion after deletion', function () {
    Storage::fake('media');

    $rental = Rental::factory()->completed()->create([
        'updated_at' => now()->subDays(31),
    ]);

    $media = attachVideo($rental, 'pickup_video');
    $mediaId = $media->id;

    (new DeleteExpiredRentalVideosJob)->handle();

    expect(Media::find($mediaId))->not->toBeNull();
});

it('skips rentals completed within last 30 days', function () {
    Storage::fake('media');

    $rental = Rental::factory()->completed()->create([
        'updated_at' => now()->subDays(29),
    ]);

    $media = attachVideo($rental, 'pickup_video');

    (new DeleteExpiredRentalVideosJob)->handle();

    expect($media->fresh()->getCustomProperty('video_deleted'))->toBeNull();
    Storage::disk('media')->assertExists($media->getPathRelativeToRoot());
});

it('skips rentals with status Active', function () {
    Storage::fake('media');

    $rental = Rental::factory()->active()->create([
        'updated_at' => now()->subDays(60),
    ]);

    $media = attachVideo($rental, 'pickup_video');

    (new DeleteExpiredRentalVideosJob)->handle();

    expect($media->fresh()->getCustomProperty('video_deleted'))->toBeNull();
    Storage::disk('media')->assertExists($media->getPathRelativeToRoot());
});
