<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\FleetVehicle;
use Illuminate\Database\Seeder;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\warning;

/**
 * Seed airport fleet vehicles for testing the driver assignment flow.
 *
 * All vehicles are tied to branches with airport service (ACC, KSI).
 */
class FleetVehicleSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            warning('FleetVehicleSeeder seeds development data and is skipped in production by default.');
            if (! confirm('FleetVehicleSeeder - Run in production?', default: false)) {
                $this->command->warn('FleetVehicleSeeder skipped.');

                return;
            }
        }

        $acc = Branch::where('code', 'ACC')->value('id');
        $ksi = Branch::where('code', 'KSI')->value('id');

        $vehicles = [
            /* ACC - Accra HQ (airport branch) */
            [
                'branch_id' => $acc,
                'make' => 'Mercedes-Benz',
                'model' => 'V-Class',
                'year' => 2026,
                'color' => 'Pearl White',
                'license_plate' => 'FLT-001-ACC',
                'seats' => 7,
                'features' => ['Wi-Fi', 'Leather seats', 'Climate control', 'Luggage space'],
                'has_insurance' => true,
                'insurance_expiry_date' => now()->addMonths(18)->format('Y-m-d'),
                'has_roadworthy' => true,
                'roadworthy_expiry_date' => now()->addMonths(16)->format('Y-m-d'),
                'status' => 'available',
                'is_active' => true,
            ],
            [
                'branch_id' => $acc,
                'make' => 'Toyota',
                'model' => 'Land Cruiser',
                'year' => 2025,
                'color' => 'Obsidian Black',
                'license_plate' => 'FLT-002-ACC',
                'seats' => 7,
                'features' => ['4x4', 'Leather seats', 'Sunroof', 'Climate control'],
                'has_insurance' => true,
                'insurance_expiry_date' => now()->addMonths(14)->format('Y-m-d'),
                'has_roadworthy' => true,
                'roadworthy_expiry_date' => now()->addMonths(12)->format('Y-m-d'),
                'status' => 'available',
                'is_active' => true,
            ],
            [
                'branch_id' => $acc,
                'make' => 'Toyota',
                'model' => 'Corolla',
                'year' => 2024,
                'color' => 'Silver',
                'license_plate' => 'FLT-003-ACC',
                'seats' => 5,
                'features' => ['Air conditioning', 'Bluetooth', 'USB charging'],
                'has_insurance' => true,
                'insurance_expiry_date' => now()->addMonths(10)->format('Y-m-d'),
                'has_roadworthy' => true,
                'roadworthy_expiry_date' => now()->addMonths(8)->format('Y-m-d'),
                'status' => 'available',
                'is_active' => true,
            ],
            [
                'branch_id' => $acc,
                'make' => 'Ford',
                'model' => 'Transit',
                'year' => 2025,
                'color' => 'Pearl White',
                'license_plate' => 'FLT-004-ACC',
                'seats' => 14,
                'features' => ['Air conditioning', 'Luggage space', 'Group transport'],
                'has_insurance' => true,
                'insurance_expiry_date' => now()->addMonths(12)->format('Y-m-d'),
                'has_roadworthy' => true,
                'roadworthy_expiry_date' => now()->addMonths(10)->format('Y-m-d'),
                'status' => 'available',
                'is_active' => true,
            ],
            /* KSI - Kumasi Airport branch */
            [
                'branch_id' => $ksi,
                'make' => 'Toyota',
                'model' => 'HiAce',
                'year' => 2024,
                'color' => 'Silver',
                'license_plate' => 'FLT-001-KSI',
                'seats' => 10,
                'features' => ['Air conditioning', 'Luggage space'],
                'has_insurance' => true,
                'insurance_expiry_date' => now()->addMonths(9)->format('Y-m-d'),
                'has_roadworthy' => true,
                'roadworthy_expiry_date' => now()->addMonths(7)->format('Y-m-d'),
                'status' => 'available',
                'is_active' => true,
            ],
        ];

        $seeded = 0;
        $skipped = 0;

        foreach ($vehicles as $data) {
            if (! $data['branch_id']) {
                $this->command->warn("Skipping {$data['make']} {$data['model']} - branch not found.");

                continue;
            }

            if (FleetVehicle::where('license_plate', $data['license_plate'])->exists()) {
                $skipped++;

                continue;
            }

            FleetVehicle::create($data);
            $seeded++;
        }

        $this->command->info("Seeded {$seeded} fleet vehicles (skipped {$skipped} existing).");
    }
}
