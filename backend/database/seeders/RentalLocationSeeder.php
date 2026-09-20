<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\RentalLocation;
use Illuminate\Database\Seeder;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\warning;

class RentalLocationSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            warning('RentalLocationSeeder seeds development data and is skipped in production by default.');
            if (! confirm('RentalLocationSeeder - Run in production?', default: false)) {
                $this->command->warn('RentalLocationSeeder skipped.');

                return;
            }
        }

        $acc = Branch::where('code', 'ACC')->value('id');
        $ksi = Branch::where('code', 'KSI')->value('id');
        $tdi = Branch::where('code', 'TDI')->value('id');
        $tma = Branch::where('code', 'TMA')->value('id');
        $los = Branch::where('code', 'LOS')->value('id');

        $locations = [
            [
                'name' => 'Main Office - Accra',
                'pickup_charge' => 0.00,
                'dropoff_charge' => 0.00,
                'is_default' => true,
                'is_pickup' => true,
                'is_dropoff' => true,
                'is_active' => true,
                'branch_id' => $acc,
            ],
            [
                'name' => 'Hotel Delivery - Accra Central',
                'pickup_charge' => 60.00,
                'dropoff_charge' => 60.00,
                'is_default' => false,
                'is_pickup' => true,
                'is_dropoff' => true,
                'is_active' => true,
                'branch_id' => $acc,
            ],
            [
                'name' => 'Kumasi Hub',
                'pickup_charge' => 200.00,
                'dropoff_charge' => 200.00,
                'is_default' => true,
                'is_pickup' => true,
                'is_dropoff' => true,
                'is_active' => true,
                'branch_id' => $ksi,
            ],
            [
                'name' => 'Takoradi Hub',
                'pickup_charge' => 180.00,
                'dropoff_charge' => 180.00,
                'is_default' => true,
                'is_pickup' => true,
                'is_dropoff' => true,
                'is_active' => true,
                'branch_id' => $tdi,
            ],
            [
                'name' => 'Tema Main Office',
                'pickup_charge' => 100.00,
                'dropoff_charge' => 100.00,
                'is_default' => true,
                'is_pickup' => true,
                'is_dropoff' => true,
                'is_active' => true,
                'branch_id' => $tma,
            ],
            [
                'name' => 'Lagos Main Office - Ikeja',
                'pickup_charge' => 5000.00,
                'dropoff_charge' => 5000.00,
                'is_default' => true,
                'is_pickup' => true,
                'is_dropoff' => true,
                'is_active' => true,
                'branch_id' => $los,
            ],
            [
                'name' => 'Lagos Airport - MMIA',
                'pickup_charge' => 8000.00,
                'dropoff_charge' => 8000.00,
                'is_default' => false,
                'is_pickup' => true,
                'is_dropoff' => true,
                'is_active' => true,
                'branch_id' => $los,
            ],
        ];

        $seeded = 0;

        foreach ($locations as $loc) {
            if (! $loc['branch_id']) {
                continue;
            }

            if (! RentalLocation::where('name', $loc['name'])->exists()) {
                RentalLocation::create($loc);
                $seeded++;
            }
        }

        $skipped = count($locations) - $seeded;
        $this->command->info("Seeded {$seeded} rental locations (skipped {$skipped} existing).");
    }
}
