<?php

use App\Media\UrlGenerators\CustomUrlGenerator;
use App\Traits\HasCustomMediaUrl;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\MediaLibrary\Support\PathGenerator\PathGenerator;

uses(Tests\TestCase::class)->group('unit');

it('uses model mediaUrl() when provided', function () {
    config(['media-library.version_urls' => false]);

    $generator = new CustomUrlGenerator(app('config'));

    $media = new Media;
    $media->file_name = 'picture.jpg';
    $media->disk = 'public';

    $model = new class
    {
        use HasCustomMediaUrl;

        public function mediaUrl(): string
        {
            return 'https://cdn.example.test/media/cars/123';
        }
    };

    $media->model = $model;

    $pathGenerator = new class implements PathGenerator
    {
        public function getPath(Media $media): string
        {
            return 'media/cars/123/';
        }

        public function getPathForConversions(Media $media): string
        {
            return 'media/cars/123/conversions/';
        }

        public function getPathForResponsiveImages(Media $media): string
        {
            return 'media/cars/123/responsive/';
        }
    };

    $generator->setPathGenerator($pathGenerator)->setMedia($media);

    $url = $generator->getUrl();

    expect($url)->toBe('https://cdn.example.test/media/cars/123/picture.jpg');
});

it('uses model $media_url property when provided', function () {
    config(['media-library.version_urls' => false]);

    $generator = new CustomUrlGenerator(app('config'));

    $media = new Media;
    $media->file_name = 'photo.png';
    $media->disk = 'public';

    $model = new class
    {
        public $media_url = '/storage/cdn/cars/123';
    };

    $media->model = $model;

    $pathGenerator = new class implements PathGenerator
    {
        public function getPath(Media $media): string
        {
            return 'media/cars/123/';
        }

        public function getPathForConversions(Media $media): string
        {
            return 'media/cars/123/conversions/';
        }

        public function getPathForResponsiveImages(Media $media): string
        {
            return 'media/cars/123/responsive/';
        }
    };

    $generator->setPathGenerator($pathGenerator)->setMedia($media);

    $url = $generator->getUrl();

    expect($url)->toBe('/storage/cdn/cars/123/photo.png');
});
