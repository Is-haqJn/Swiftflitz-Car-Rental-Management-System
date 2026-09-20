<?php

namespace App\Media\PathGenerators;

use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\MediaLibrary\Support\PathGenerator\PathGenerator;

class CustomPathGenerator implements PathGenerator
{
    /**
     * Get the path for the original file.
     */
    public function getPath(Media $media): string
    {
        $model = $media->model;

        if ($model && method_exists($model, 'mediaCollectionPath')) {
            $path = $model->mediaCollectionPath($media->collection_name);

            return rtrim($path, '/') . '/';
        }

        $base = '';

        if ($model) {
            if (method_exists($model, 'mediaPath')) {
                $modelPath = $model->mediaPath();
            } elseif (property_exists($model, 'media_path')) {
                $modelPath = $model->media_path;
            } else {
                $modelPath = $model->getTable();
            }

            $modelId = $media->model_id;
            $path = trim("{$base}/{$modelPath}/{$modelId}", '/');
        } else {
            $path = trim("{$base}/unknown/", '/');
        }

        return $path . '/';
    }

    public function getPathForConversions(Media $media): string
    {
        return $this->getPath($media) . 'conversions/';
    }

    public function getPathForResponsiveImages(Media $media): string
    {
        return $this->getPath($media) . 'responsive/';
    }
}
