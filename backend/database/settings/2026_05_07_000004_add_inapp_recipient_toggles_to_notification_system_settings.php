<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('notifications.inapp_notify_branch_managers', true);
        $this->migrator->add('notifications.inapp_notify_admins', true);
    }
};
