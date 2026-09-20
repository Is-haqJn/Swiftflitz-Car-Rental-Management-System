<?php

namespace Database\Seeders;

use App\Enums\AirportLocationType;
use App\Models\Airport;
use App\Models\AirportLocation;
use App\Models\Branch;
use Illuminate\Database\Seeder;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\warning;

class AirportLocationSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            warning('AirportLocationSeeder seeds development data and is skipped in production by default.');
            if (! confirm('AirportLocationSeeder - Run in production?', default: false)) {
                $this->command->warn('AirportLocationSeeder skipped.');

                return;
            }
        }

        $seeded = 0;

        /* Terminals (airport_id set, branch_id null) */
        $terminals = [
            'Murtala Mohammed International Airport' => [
                'Domestic Terminal',
                'International Terminal',
            ],
            'Kotoka International Airport' => [
                'Terminal 1',
                'Terminal 3',
            ],
            'Kumasi Airport' => [
                'Main Terminal',
            ],
        ];

        foreach ($terminals as $airportName => $names) {
            $airportId = Airport::where('name', $airportName)->value('id');
            if (! $airportId) {
                $this->command->warn("Airport not found: {$airportName} - skipping terminals.");

                continue;
            }

            foreach ($names as $name) {
                if (AirportLocation::where('name', $name)->exists()) {
                    continue;
                }

                AirportLocation::create([
                    'location_type' => AirportLocationType::Terminal,
                    'airport_id' => $airportId,
                    'branch_id' => null,
                    'name' => $name,
                    'has_charge' => false,
                    'is_active' => true,
                ]);
                $seeded++;
            }
        }

        /* Areas (branch_id set, airport_id null) */
        $areas = [
            'LOS' => [
                'Arrivals Holding Bay',
                'Departure Drop-off',
            ],
            'ACC' => [
                'Accra Central Pickup Point',
                'Airport Road Staging Area',
            ],
            'KSI' => [
                'Kumasi Pickup Bay',
            ],
        ];

        foreach ($areas as $branchCode => $names) {
            $branchId = Branch::where('code', $branchCode)->value('id');
            if (! $branchId) {
                $this->command->warn("Branch not found: {$branchCode} - skipping areas.");

                continue;
            }

            foreach ($names as $name) {
                if (AirportLocation::where('name', $name)->exists()) {
                    continue;
                }

                AirportLocation::create([
                    'location_type' => AirportLocationType::Area,
                    'airport_id' => null,
                    'branch_id' => $branchId,
                    'name' => $name,
                    'has_charge' => false,
                    'is_active' => true,
                ]);
                $seeded++;
            }
        }

        $this->command->info("Seeded {$seeded} airport locations.");
    }
}
