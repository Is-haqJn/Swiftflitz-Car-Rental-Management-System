<?php

use Illuminate\Support\Str;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('general.maintenance_mode', false);
        $this->migrator->add('general.maintenance_bypass_token', Str::uuid()->toString());
    }
};
