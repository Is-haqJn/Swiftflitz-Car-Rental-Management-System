<?php

namespace App\Jobs;

use App\Enums\RentalStatus;
use App\Models\Rental;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;

class DeleteExpiredRentalVideosJob implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        Rental::query()
            ->where('status', RentalStatus::Completed)
            ->where('updated_at', '<', now()->subDays(30))
            ->with(['media' => fn ($q) => $q->whereIn('collection_name', ['pickup_video', 'return_video'])])
            ->chunkById(100, function ($rentals): void {
                foreach ($rentals as $rental) {
                    foreach ($rental->media as $media) {
                        if ($media->getCustomProperty('video_deleted', false)) {
                            continue;
                        }

                        Storage::disk($media->disk)->delete($media->getPathRelativeToRoot());

                        $media->setCustomProperty('video_deleted', true);
                        $media->save();
                    }
                }
            });
    }
}
