<?php

namespace App\Http\Controllers\V1;

use App\Http\Controllers\Controller;
use App\Services\TusUpload\TusUploadService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use TusPhp\Events\UploadComplete;
use TusPhp\Tus\Server as TusServer;

class TusUploadController extends Controller
{
    public function __construct(protected TusUploadService $uploadService) {}

    /**
     * POST /api/v1/uploads/tus
     * Create a new TUS upload resource.
     */
    public function create(Request $request): SymfonyResponse
    {
        return $this->serve();
    }

    /**
     * PATCH /api/v1/uploads/tus/{token}
     * Upload a chunk to an existing TUS upload.
     */
    public function patch(Request $request, string $token): SymfonyResponse
    {
        return $this->serve();
    }

    /**
     * HEAD /api/v1/uploads/tus/{token}
     * Get the current offset for an existing TUS upload.
     */
    public function head(Request $request, string $token): SymfonyResponse
    {
        return $this->serve();
    }

    /**
     * DELETE /api/v1/uploads/tus/{token}
     * Terminate and delete an existing TUS upload.
     */
    public function destroy(Request $request, string $token): SymfonyResponse
    {
        return $this->serve();
    }

    /**
     * Parse the TUS Upload-Metadata header and return the entity_type value.
     */
    protected function resolveEntityType(): ?string
    {
        $raw = request()->header('Upload-Metadata', '');

        foreach (explode(',', $raw) as $pair) {
            $parts = explode(' ', trim($pair), 2);
            if (count($parts) === 2 && $parts[0] === 'entity_type') {
                return base64_decode($parts[1]) ?: null;
            }
        }

        return null;
    }

    /**
     * Build a TUS server, register an UploadComplete listener, and serve the request.
     */
    protected function serve(): SymfonyResponse
    {
        $uploadDir = storage_path('app/tus-temp');

        if (! is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $entityType = $this->resolveEntityType();
        $maxSize = $this->uploadService->maxUploadSizeForEntityType($entityType ?? '');

        $server = new TusServer('file');
        $server->setUploadDir($uploadDir);
        $server->setApiPath('/api/v1/uploads/tus');
        $server->setMaxUploadSize($maxSize);

        $uploadService = $this->uploadService;

        $server->event()->addListener(
            UploadComplete::NAME,
            function (UploadComplete $event) use ($uploadService): void {
                $file = $event->getFile();
                $filePath = $file->getFilePath();
                $rawMetadata = $file->details()['metadata'] ?? [];

                // ? Inject the TUS upload key so deferred handlers can cache it
                $rawMetadata['tus_key'] = $file->getKey();

                $uploadService->dispatch($rawMetadata, $filePath);
            }
        );

        return $server->serve();
    }
}
