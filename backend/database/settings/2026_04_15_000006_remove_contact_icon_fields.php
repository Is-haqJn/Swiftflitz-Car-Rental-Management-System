<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->delete('contact.contact_phone_icon');
        $this->migrator->delete('contact.contact_email_icon');
        $this->migrator->delete('contact.contact_address_icon');
    }
};
