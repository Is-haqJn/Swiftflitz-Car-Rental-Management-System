<?php

namespace App\Services\TusUpload;

use App\Services\TusUpload\Handlers\CustomerDocumentTusHandler;
use App\Services\TusUpload\Handlers\DeferredTusHandler;
use App\Services\TusUpload\Handlers\ProfilePhotoTusHandler;
use App\Services\TusUpload\Handlers\RentalVideoTusHandler;
use App\Services\TusUpload\Handlers\SiteImageTusHandler;
use App\Services\TusUpload\Handlers\VehicleImageTusHandler;
use Illuminate\Contracts\Container\Container;

class TusUploadService
{
    /**
     * Maps entity_type metadata values to handler class names.
     * To add a new upload type, add one entry here - zero other changes required.
     *
     * @var array<string, class-string<TusUploadHandlerInterface>>
     */
    protected array $handlers = [
        'vehicle_image' => VehicleImageTusHandler::class,
        'profile_photo' => ProfilePhotoTusHandler::class,
        'customer_document' => CustomerDocumentTusHandler::class,
        'vehicle_expense_receipt' => DeferredTusHandler::class,
        'rental_inspection_image' => DeferredTusHandler::class,
        'rental_repair_receipt' => DeferredTusHandler::class,
        'booking_license' => DeferredTusHandler::class,
        'booking_id_document' => DeferredTusHandler::class,
        'rental_video' => RentalVideoTusHandler::class,
        'site_image' => SiteImageTusHandler::class,
    ];

    public function __construct(protected Container $container) {}

    /**
     * Return the maximum allowed upload size in bytes for the given entity type.
     * Falls back to the standard limit when the entity type is unknown.
     */
    public function maxUploadSizeForEntityType(string $entityType): int
    {
        if (! $entityType || ! isset($this->handlers[$entityType])) {
            return (int) config('swiftflitz.uploads.max_size', 20 * 1024 * 1024);
        }

        /** @var TusUploadHandlerInterface $handler */
        $handler = $this->container->make($this->handlers[$entityType]);

        return $handler->maxUploadSize();
    }

    /**
     * Resolve and invoke the correct handler for the completed upload.
     *
     * @param  array<string, string>  $metadata  Decoded TUS upload metadata
     * @param  string  $filePath  Absolute path to the uploaded file
     */
    public function dispatch(array $metadata, string $filePath): void
    {
        $entityType = $metadata['entity_type'] ?? null;

        if (! $entityType || ! isset($this->handlers[$entityType])) {
            return;
        }

        /** @var TusUploadHandlerInterface $handler */
        $handler = $this->container->make($this->handlers[$entityType]);
        $handler->handle($filePath, $metadata);
    }
}
