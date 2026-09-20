<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class ContactSettings extends Settings
{
    public string $banner_title;

    public int $banner_image_version;

    public ?string $banner_image_url;

    public string $contact_section_large_title;

    public int $contact_section_bg_image_version;

    public ?string $contact_section_bg_image_url;

    public bool $contact_socials_enabled;

    public string $contact_socials_title;

    public array $contact_socials;

    public string $address;

    public string $phone;

    public string $email;

    public ?string $hours;

    public bool $map_enabled;

    public ?string $map_embed_url;

    public bool $contact_branch_locations_enabled;

    public string $contact_branch_locations_title;

    public array $contact_branch_ids;

    public ?string $whatsapp_number;

    public static function group(): string
    {
        return 'contact';
    }
}
