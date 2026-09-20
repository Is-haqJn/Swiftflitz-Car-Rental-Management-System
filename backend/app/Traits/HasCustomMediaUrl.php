<?php

namespace App\Traits;

trait HasCustomMediaUrl
{
    /**
     * Return a custom media URL base used by CustomUrlGenerator.
     * Override in the model to customize the base URL for media.
     *
     * Examples:
     * - return 'https://cdn.example.com/media/cars/123';
     * - return '/storage/media/cars/123';
     */
    public function mediaUrl(): string
    {
        // By default use the table name as a path segment. CustomUrlGenerator
        // will append the filename after this base.
        return $this->getTable();
    }
}
