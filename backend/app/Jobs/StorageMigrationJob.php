<?php

namespace App\Jobs;

use App\Notifications\StorageMigrationCompleteNotification;
use App\Notifications\StorageMigrationFailedNotification;
use App\Settings\GeneralSettings;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class StorageMigrationJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public string $target)
    {
        $this->onQueue('default');
    }

    public function handle(): void
    {
        $failures = 0;
        $total = 0;

        Media::query()->chunkById(100, function ($chunk) use (&$failures, &$total): void {
            foreach ($chunk as $media) {
                if ($media->disk === $this->target) {
                    continue;
                }

                $total++;
                $path = $media->getPathRelativeToRoot();

                $stream = Storage::disk($media->disk)->readStream($path);

                if (! $stream) {
                    Log::warning('StorageMigrationJob: readStream failed', [
                        'media_id' => $media->id,
                        'disk' => $media->disk,
                        'path' => $path,
                    ]);
                    $failures++;

                    continue;
                }

                $written = Storage::disk($this->target)->writeStream($path, $stream);

                if ($written === false) {
                    Log::warning('StorageMigrationJob: writeStream failed', [
                        'media_id' => $media->id,
                        'path' => $path,
                        'target' => $this->target,
                    ]);
                    $failures++;

                    continue;
                }

                $media->update([
                    'disk' => $this->target,
                    'conversions_disk' => $this->target,
                ]);
            }
        });

        $adminEmail = config('mail.from.address', 'admin@localhost');

        if ($failures === 0 && $total > 0) {
            $settings = app(GeneralSettings::class);
            $settings->storage_disk = $this->target;
            $settings->save();

            Notification::route('mail', $adminEmail)
                ->notify(new StorageMigrationCompleteNotification($this->target, $total));
        } else {
            Notification::route('mail', $adminEmail)
                ->notify(new StorageMigrationFailedNotification($this->target, $total, $failures));
        }
    }
}
