<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('backup.scheduled_db_backup_enabled', true);
        $this->migrator->add('backup.scheduled_system_backup_enabled', true);
        $this->migrator->add('backup.db_backup_cron', '0 3 * * *');
        $this->migrator->add('backup.system_backup_cron', '0 4 * * 0');
        $this->migrator->add('backup.retention_days', 30);
    }
};
