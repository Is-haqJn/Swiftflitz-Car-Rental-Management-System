<?php

use App\Jobs\ProcessRentalVideoJob;
use App\Models\Rental;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use ProtoneMedia\LaravelFFMpeg\Support\FFMpeg;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

uses(Tests\TestCase::class, RefreshDatabase::class);

function makeRentalVideo(): Media
{
    $rental = Rental::factory()->create();

    $tmpPath = tempnam(sys_get_temp_dir(), 'proc_vid_');
    $mp4Header = "\x00\x00\x00\x1Cftypisom\x00\x00\x02\x00isomiso2avc1mp41";
    file_put_contents($tmpPath, $mp4Header . str_repeat("\x00", 512));

    return $rental->addMedia($tmpPath)
        ->usingFileName('test.mp4')
        ->toMediaCollection('pickup_video', 'media');
}

function mockFfmpegChain(): void
{
    /* Transcode chain: fromDisk->open->export->addFilter->toDisk->inFormat->save */
    $transcodeExport = Mockery::mock();
    $transcodeExport->shouldReceive('addFilter')->andReturnSelf();
    $transcodeExport->shouldReceive('toDisk')->andReturnSelf();
    $transcodeExport->shouldReceive('inFormat')->andReturnSelf();
    $transcodeExport->shouldReceive('save')->andReturnNull();

    /* Thumbnail chain: fromDisk->open->getFrameFromSeconds->export->toDisk->save */
    $thumbExport = Mockery::mock();
    $thumbExport->shouldReceive('toDisk')->andReturnSelf();
    $thumbExport->shouldReceive('save')->andReturnNull();

    $frameMock = Mockery::mock();
    $frameMock->shouldReceive('export')->andReturn($thumbExport);

    $openerMock = Mockery::mock();
    $openerMock->shouldReceive('open')->andReturnSelf();
    $openerMock->shouldReceive('export')->andReturn($transcodeExport);
    $openerMock->shouldReceive('getFrameFromSeconds')->andReturn($frameMock);

    FFMpeg::shouldReceive('fromDisk')->andReturn($openerMock);
}

it('returns silently when media id not found', function () {
    (new ProcessRentalVideoJob(99999))->handle();

    expect(true)->toBeTrue();
});

it('transcodes video and replaces original file on disk', function () {
    Storage::fake('media');
    $media = makeRentalVideo();

    $originalPath = $media->getPathRelativeToRoot();
    $optPath = $originalPath . '.opt.mp4';

    Storage::disk('media')->put($optPath, 'optimized-content');

    mockFfmpegChain();

    (new ProcessRentalVideoJob($media->id))->handle();

    Storage::disk('media')->assertExists($originalPath);
    Storage::disk('media')->assertMissing($optPath);
});

it('marks media as optimized=true on success', function () {
    Storage::fake('media');
    $media = makeRentalVideo();

    $optPath = $media->getPathRelativeToRoot() . '.opt.mp4';
    Storage::disk('media')->put($optPath, 'optimized-content');

    mockFfmpegChain();

    (new ProcessRentalVideoJob($media->id))->handle();

    expect($media->fresh()->getCustomProperty('optimized'))->toBeTrue();
});

it('sets thumbnail_url after transcoding succeeds', function () {
    Storage::fake('media');
    $media = makeRentalVideo();

    $optPath = $media->getPathRelativeToRoot() . '.opt.mp4';
    Storage::disk('media')->put($optPath, 'optimized-content');

    mockFfmpegChain();

    (new ProcessRentalVideoJob($media->id))->handle();

    $fresh = $media->fresh();
    expect($fresh->custom_properties)->toHaveKey('thumbnail_url');
});

it('skips transcoding and logs warning when ffmpeg throws', function () {
    Storage::fake('media');
    $media = makeRentalVideo();

    Log::spy();

    FFMpeg::shouldReceive('fromDisk')->andThrow(new RuntimeException('FFmpeg binary not found'));

    (new ProcessRentalVideoJob($media->id))->handle();

    Log::shouldHaveReceived('warning')->twice();

    expect($media->fresh()->getCustomProperty('optimized'))->toBeNull();
});
