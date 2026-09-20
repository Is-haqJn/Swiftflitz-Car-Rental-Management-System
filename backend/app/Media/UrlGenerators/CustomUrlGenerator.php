<?php

namespace App\Media\UrlGenerators;

use DateTimeInterface;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\MediaLibrary\Support\UrlGenerator\BaseUrlGenerator;

/**
 * CustomUrlGenerator builds media URLs with support for:
 * - per-model `mediaUrl()` method or `$media_url` property
 * - a global base URL via `config('swiftflitz.media.base_url')`
 * - falling back to the storage disk URL
 */
class CustomUrlGenerator extends BaseUrlGenerator
{
    public function getUrl(): string
    {
        $model = $this->media->model;

        $file = is_null($this->conversion)
            ? $this->media->file_name
            : $this->conversion->getConversionFile($this->media);

        $path = is_null($this->conversion)
            ? $this->pathGenerator->getPath($this->media)
            : $this->pathGenerator->getPathForConversions($this->media);

        if ($model) {
            if (method_exists($model, 'mediaUrl')) {
                $base = rtrim($model->mediaUrl(), '/');
            } elseif (property_exists($model, 'media_url')) {
                $base = rtrim($model->media_url, '/');
            } else {
                $base = null;
            }

            if (is_string($base) && $base !== '') {
                return $this->versionUrl($base . '/' . ltrim($file, '/'));
            }
        }

        $appBase = config('swiftflitz.media.base_url');

        if (! empty($appBase)) {
            $appBase = rtrim($appBase, '/') . '/' . config('swiftflitz.media.base_path', 'media');

            return $this->versionUrl($appBase . '/' . trim($path, '/') . '/' . ltrim($file, '/'));
        }

        return $this->getDisk()->url($this->getPathRelativeToRoot());
    }

    public function getTemporaryUrl(DateTimeInterface $expiration, array $options = []): string
    {
        return $this->getDisk()->temporaryUrl($this->getPathRelativeToRoot(), $expiration, $options);
    }

    public function getBaseMediaDirectoryUrl(): string
    {
        $model = $this->media->model;

        if ($model) {
            if (method_exists($model, 'mediaUrl')) {
                return rtrim($model->mediaUrl(), '/') . '/';
            }

            if (property_exists($model, 'media_url')) {
                return rtrim($model->media_url, '/') . '/';
            }
        }

        $appBase = config('swiftflitz.media.base_url');

        if (! empty($appBase)) {
            return rtrim($appBase, '/') . '/';
        }

        return $this->getDisk()->url('/');
    }

    public function getPath(): string
    {
        return $this->getRootOfDisk() . $this->getPathRelativeToRoot();
    }

    public function getResponsiveImagesDirectoryUrl(): string
    {
        $path = $this->pathGenerator->getPathForResponsiveImages($this->media);

        $appBase = config('swiftflitz.media.base_url');

        if (! empty($appBase)) {
            return Str::finish(rtrim($appBase, '/') . '/' . trim($path, '/'), '/');
        }

        return Str::finish($this->getDisk()->url($path), '/');
    }

    protected function getRootOfDisk(): string
    {
        return $this->getDisk()->path('/');
    }
}
