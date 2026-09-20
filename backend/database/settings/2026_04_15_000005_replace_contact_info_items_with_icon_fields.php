<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->delete('contact.contact_info_items');
        $this->migrator->add('contact.contact_phone_icon', 'LuPhoneCall');
        $this->migrator->add('contact.contact_email_icon', 'LuMail');
        $this->migrator->add('contact.contact_address_icon', 'LuHouse');
    }
};
