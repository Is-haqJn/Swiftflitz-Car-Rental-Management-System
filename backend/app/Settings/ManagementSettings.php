<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class ManagementSettings extends Settings
{
    public ?string $management_logo_url;

    public static function group(): string
    {
        return 'management';
    }
}
