<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class BackupSettings extends Settings
{
    public bool $scheduled_db_backup_enabled;

    public bool $scheduled_system_backup_enabled;

    public string $db_backup_cron;

    public string $system_backup_cron;

    public int $retention_days;

    public static function group(): string
    {
        return 'backup';
    }
}
