<?php

use App\Jobs\StorageMigrationJob;
use App\Settings\GeneralSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

uses(Tests\TestCase::class, RefreshDatabase::class);

function makeMediaOnDisk(string $disk): Media
{
    $media = Media::create([
        'model_type' => 'rental',
        'model_id' => 1,
        'collection_name' => 'pickup_video',
        'name' => 'video',
        'file_name' => 'video.mp4',
        'mime_type' => 'video/mp4',
        'disk' => $disk,
        'conversions_disk' => $disk,
        'size' => 100,
        'manipulations' => '[]',
        'custom_properties' => '{}',
        'generated_conversions' => '{}',
        'responsive_images' => '{}',
        'order_column' => 1,
    ]);

    Storage::disk($disk)->put($media->getPathRelativeToRoot(), 'fake-video-content');

    return $media;
}

it('streams every Media row from source to target disk', function () {
    Storage::fake('media');
    Storage::fake('s3');

    $media = makeMediaOnDisk('media');

    (new StorageMigrationJob('s3'))->handle();

    Storage::disk('s3')->assertExists($media->getPathRelativeToRoot());
});

it('updates media.disk per row after successful copy', function () {
    Storage::fake('media');
    Storage::fake('s3');

    $media = makeMediaOnDisk('media');

    (new StorageMigrationJob('s3'))->handle();

    $media->refresh();

    expect($media->disk)->toBe('s3');
});

it('updates GeneralSettings::storage_disk only after all rows succeed', function () {
    Storage::fake('media');
    Storage::fake('s3');

    makeMediaOnDisk('media');
    makeMediaOnDisk('media');

    $settings = app(GeneralSettings::class);
    $settings->storage_disk = 'media';
    $settings->save();

    (new StorageMigrationJob('s3'))->handle();

    $settings = app(GeneralSettings::class);
    expect($settings->storage_disk)->toBe('s3');
});

it('does NOT update GeneralSettings when at least one row fails', function () {
    Storage::fake('media');
    Storage::fake('s3');

    /* Create media row but do NOT put a file on disk - readStream will fail */
    Media::create([
        'model_type' => 'rental',
        'model_id' => 1,
        'collection_name' => 'pickup_video',
        'name' => 'video',
        'file_name' => 'video.mp4',
        'mime_type' => 'video/mp4',
        'disk' => 'media',
        'conversions_disk' => 'media',
        'size' => 100,
        'manipulations' => '[]',
        'custom_properties' => '{}',
        'generated_conversions' => '{}',
        'responsive_images' => '{}',
        'order_column' => 1,
    ]);

    $settings = app(GeneralSettings::class);
    $settings->storage_disk = 'media';
    $settings->save();

    (new StorageMigrationJob('s3'))->handle();

    $settings = app(GeneralSettings::class);
    expect($settings->storage_disk)->toBe('media');
});

it('notifies admins on full success', function () {
    Notification::fake();
    Storage::fake('media');
    Storage::fake('s3');

    makeMediaOnDisk('media');

    (new StorageMigrationJob('s3'))->handle();

    Notification::assertSentTo(
        new AnonymousNotifiable,
        \App\Notifications\StorageMigrationCompleteNotification::class,
    );
});

it('notifies admins on partial failure', function () {
    Notification::fake();
    Storage::fake('media');
    Storage::fake('s3');

    /* No file on disk - readStream fails, partial failure */
    Media::create([
        'model_type' => 'rental',
        'model_id' => 1,
        'collection_name' => 'pickup_video',
        'name' => 'video',
        'file_name' => 'video.mp4',
        'mime_type' => 'video/mp4',
        'disk' => 'media',
        'conversions_disk' => 'media',
        'size' => 100,
        'manipulations' => '[]',
        'custom_properties' => '{}',
        'generated_conversions' => '{}',
        'responsive_images' => '{}',
        'order_column' => 1,
    ]);

    (new StorageMigrationJob('s3'))->handle();

    Notification::assertSentTo(
        new AnonymousNotifiable,
        \App\Notifications\StorageMigrationFailedNotification::class,
    );
});
