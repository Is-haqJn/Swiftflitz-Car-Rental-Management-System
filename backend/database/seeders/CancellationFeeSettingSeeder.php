<?php

namespace Database\Seeders;

use App\Models\CancellationFeeSetting;
use Illuminate\Database\Seeder;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\warning;

class CancellationFeeSettingSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            warning('CancellationFeeSettingSeeder seeds hardcoded fee config and is skipped in production by default.');
            if (! confirm('CancellationFeeSettingSeeder - Run in production?', default: false)) {
                $this->command->warn('CancellationFeeSettingSeeder skipped.');

                return;
            }
        }

        $setting = CancellationFeeSetting::first();

        if (! $setting) {
            CancellationFeeSetting::create([
                'before_pickup_fee' => 150.00,   // GH₵150 flat fee when cancelled within threshold
                'after_pickup_fee' => 300.00,   // GH₵300 flat fee when cancelled after pickup
                'before_pickup_days' => 2,         // 2-day window before pickup triggers the fee
            ]);
            $this->command->info('✅ Seeded cancellation fee settings (GH₵150 within 2 days, GH₵300 after pickup).');
        } else {
            $this->command->info('Cancellation fee settings already exist - skipped.');
        }
    }
}
