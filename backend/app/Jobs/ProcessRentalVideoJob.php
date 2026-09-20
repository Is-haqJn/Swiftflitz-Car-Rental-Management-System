<?php

namespace App\Jobs;

use FFMpeg\Format\Video\X264;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use ProtoneMedia\LaravelFFMpeg\Support\FFMpeg;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Throwable;

class ProcessRentalVideoJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $mediaId)
    {
        $this->onQueue('media');
    }

    public function handle(): void
    {
        $media = Media::find($this->mediaId);

        if (! $media) {
            return;
        }

        $disk = $media->disk;
        $originalPath = $media->getPathRelativeToRoot();
        $optPath = $originalPath . '.opt.mp4';

        try {
            FFMpeg::fromDisk($disk)
                ->open($originalPath)
                ->export()
                ->addFilter(['-crf', '28', '-movflags', '+faststart'])
                ->toDisk($disk)
                ->inFormat(new X264)
                ->save($optPath);

            Storage::disk($disk)->delete($originalPath);
            Storage::disk($disk)->move($optPath, $originalPath);

            $media->setCustomProperty('optimized', true);
            $media->save();
        } catch (Throwable $e) {
            Log::warning('ProcessRentalVideoJob: ffmpeg transcoding failed', [
                'media_id' => $this->mediaId,
                'error' => $e->getMessage(),
            ]);
        }

        /* Extract thumbnail frame regardless of whether transcoding succeeded. */
        try {
            $thumbPath = 'rental-video-thumbs/' . $media->id . '.jpg';

            FFMpeg::fromDisk($disk)
                ->open($originalPath)
                ->getFrameFromSeconds(1)
                ->export()
                ->toDisk($disk)
                ->save($thumbPath);

            $media->setCustomProperty('thumbnail_url', Storage::disk($disk)->url($thumbPath));
            $media->save();
        } catch (Throwable $e) {
            Log::warning('ProcessRentalVideoJob: thumbnail extraction failed', [
                'media_id' => $this->mediaId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
