<?php

namespace Database\Seeders;

use App\Models\Airport;
use App\Models\AirportPackage;
use App\Models\AirportPackageAssignment;
use Illuminate\Database\Seeder;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\warning;

class AirportPackageAssignmentSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            warning('AirportPackageAssignmentSeeder seeds development data and is skipped in production by default.');
            if (! confirm('AirportPackageAssignmentSeeder - Run in production?', default: false)) {
                $this->command->warn('AirportPackageAssignmentSeeder skipped.');

                return;
            }
        }

        // base_price per airport per package (currency follows the branch)
        $assignments = [
            'Murtala Mohammed International Airport' => [
                'Economy Transfer' => 8000,
                'Business Transfer' => 15000,
                'Premium Transfer' => 25000,
                'Executive Transfer' => 40000,
            ],
            'Kotoka International Airport' => [
                'Economy Transfer' => 120,
                'Business Transfer' => 220,
                'Premium Transfer' => 380,
                'Executive Transfer' => 600,
            ],
            'Kumasi Airport' => [
                'Economy Transfer' => 100,
                'Business Transfer' => 180,
                'Premium Transfer' => 300,
                'Executive Transfer' => 480,
            ],
        ];

        $seeded = 0;
        foreach ($assignments as $airportName => $packages) {
            $airport = Airport::where('name', $airportName)->first();
            if (! $airport) {
                $this->command->warn("Airport not found: {$airportName} - skipping.");

                continue;
            }

            foreach ($packages as $packageName => $basePrice) {
                $package = AirportPackage::where('name', $packageName)->first();
                if (! $package) {
                    $this->command->warn("Package not found: {$packageName} - skipping.");

                    continue;
                }

                if (AirportPackageAssignment::where('package_id', $package->id)
                    ->where('airport_id', $airport->id)
                    ->exists()
                ) {
                    continue;
                }

                AirportPackageAssignment::create([
                    'package_id' => $package->id,
                    'airport_id' => $airport->id,
                    'base_price' => $basePrice,
                    'is_active' => true,
                ]);
                $seeded++;
            }
        }

        $this->command->info("Seeded {$seeded} airport package assignments.");
    }
}
