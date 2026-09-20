<?php

namespace App\Http\Controllers\V1;

use App\Http\Controllers\Controller;
use App\Models\Rental;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VideoStreamController extends Controller
{
    /**
     * GET /api/v1/rentals/{rental}/videos/{media}/stream
     */
    public function stream(Request $request, Rental $rental, Media $media): StreamedResponse|JsonResponse
    {
        $collections = ['pickup_video', 'return_video'];

        if ($media->model_id !== $rental->id || ! in_array($media->collection_name, $collections, true)) {
            abort(404);
        }

        if ($media->getCustomProperty('video_deleted', false)) {
            return response()->json(['message' => 'Video has been removed.'], 410);
        }

        $disk = $media->disk;
        $path = $media->getPathRelativeToRoot();
        $size = Storage::disk($disk)->size($path);
        $mimeType = $media->mime_type ?? 'video/mp4';

        $rangeHeader = $request->header('Range');

        if ($rangeHeader && preg_match('/bytes=(\d+)-(\d*)/', $rangeHeader, $matches)) {
            $start = (int) $matches[1];
            $end = $matches[2] !== '' ? (int) $matches[2] : $size - 1;
            $end = min($end, $size - 1);
            $length = $end - $start + 1;

            return response()->stream(
                function () use ($disk, $path, $start, $length): void {
                    $stream = Storage::disk($disk)->readStream($path);
                    if ($start > 0) {
                        stream_get_contents($stream, $start);
                    }

                    echo stream_get_contents($stream, $length);
                    fclose($stream);
                },
                206,
                [
                    'Content-Type' => $mimeType,
                    'Content-Range' => "bytes {$start}-{$end}/{$size}",
                    'Content-Length' => $length,
                    'Accept-Ranges' => 'bytes',
                    'Cache-Control' => 'private, max-age=3600',
                ]
            );
        }

        return response()->stream(
            function () use ($disk, $path): void {
                $stream = Storage::disk($disk)->readStream($path);
                fpassthru($stream);
                fclose($stream);
            },
            200,
            [
                'Content-Type' => $mimeType,
                'Content-Length' => $size,
                'Accept-Ranges' => 'bytes',
                'Cache-Control' => 'private, max-age=3600',
            ]
        );
    }
}
