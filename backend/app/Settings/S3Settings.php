<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class S3Settings extends Settings
{
    public ?string $aws_access_key_id;

    public ?string $aws_secret_access_key;

    public ?string $aws_default_region;

    public ?string $aws_bucket;

    public ?string $aws_url;

    public ?string $aws_endpoint;

    public bool $use_path_style_endpoint;

    public static function group(): string
    {
        return 's3';
    }
}
