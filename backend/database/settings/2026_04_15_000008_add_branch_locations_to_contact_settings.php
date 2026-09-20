<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('contact.contact_branch_locations_enabled', true);
        $this->migrator->add('contact.contact_branch_locations_title', 'Our Branches');
        $this->migrator->add('contact.contact_branch_ids', []);
    }
};
