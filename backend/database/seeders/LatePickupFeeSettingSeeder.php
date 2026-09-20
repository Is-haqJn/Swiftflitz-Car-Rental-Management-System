<?php

namespace Database\Seeders;

use App\Models\LatePickupFeeSetting;
use Illuminate\Database\Seeder;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\warning;

class LatePickupFeeSettingSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            warning('LatePickupFeeSettingSeeder seeds hardcoded rate config and is skipped in production by default.');
            if (! confirm('LatePickupFeeSettingSeeder - Run in production?', default: false)) {
                $this->command->warn('LatePickupFeeSettingSeeder skipped.');

                return;
            }
        }

        LatePickupFeeSetting::firstOrCreate([], [
            'is_enabled' => false,
            'rate_type' => 'per_day',
            'rate' => 0,
        ]);
    }
}
