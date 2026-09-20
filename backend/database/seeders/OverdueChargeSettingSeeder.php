<?php

namespace Database\Seeders;

use App\Settings\OverdueSettings;
use Illuminate\Database\Seeder;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\warning;

class OverdueChargeSettingSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            warning('OverdueChargeSettingSeeder seeds development data and is skipped in production by default.');
            if (! confirm('OverdueChargeSettingSeeder - Run in production?', default: false)) {
                $this->command->warn('OverdueChargeSettingSeeder skipped.');

                return;
            }
        }

        // Configure OverdueSettings with test-friendly values:
        //   - Start overdue exactly at scheduled return time (no grace period)
        //   - GHS 100/hr hourly rate
        //   - Switch to daily rate after 3 hours overdue
        //
        // This lets you test: 1h overdue (hourly), 2h55m (near threshold),
        // and 4h (converts to 1 full-day charge at vehicle daily rate).
        $settings = app(OverdueSettings::class);
        $settings->overdue_start_type = 'exact';
        $settings->overdue_hourly_rate = 100.0;
        $settings->overdue_threshold_hours = 3;
        $settings->grace_period_minutes = 0;
        $settings->allow_overdue_waive = true;
        $settings->save();
    }
}
