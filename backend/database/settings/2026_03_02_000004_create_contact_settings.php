<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('contact.address', '');
        $this->migrator->add('contact.phone', '');
        $this->migrator->add('contact.email', '');
        $this->migrator->add('contact.hours', null);
        $this->migrator->add('contact.map_embed_url', null);
        $this->migrator->add('contact.whatsapp_number', null);
    }
};
