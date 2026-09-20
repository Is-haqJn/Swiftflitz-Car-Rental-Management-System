<?php

namespace Database\Seeders;

use App\Models\AirportPackage;
use Illuminate\Database\Seeder;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\warning;

class AirportPackageSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            warning('AirportPackageSeeder seeds development data and is skipped in production by default.');
            if (! confirm('AirportPackageSeeder - Run in production?', default: false)) {
                $this->command->warn('AirportPackageSeeder skipped.');

                return;
            }
        }

        $packages = [
            [
                'name' => 'Economy Transfer',
                'description' => 'Budget-friendly shared ride with a standard vehicle.',
                'features' => ['Standard vehicle', 'Meet & assist', 'Flight tracking'],
                'is_available_for_pickup' => true,
                'is_available_for_dropoff' => true,
                'auto_assign_vehicle' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Business Transfer',
                'description' => 'Private mid-range vehicle for business travellers.',
                'features' => ['Private vehicle', 'Meet & greet', 'Flight tracking', 'Complimentary water'],
                'is_available_for_pickup' => true,
                'is_available_for_dropoff' => true,
                'auto_assign_vehicle' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Premium Transfer',
                'description' => 'Luxury sedan with a professional chauffeur.',
                'features' => ['Luxury sedan', 'Professional chauffeur', 'Meet & greet', 'Flight tracking', 'Complimentary refreshments'],
                'is_available_for_pickup' => true,
                'is_available_for_dropoff' => true,
                'auto_assign_vehicle' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Executive Transfer',
                'description' => 'Executive SUV with full meet & greet service.',
                'features' => ['Executive SUV', 'Dedicated chauffeur', 'Meet & greet', 'Flight tracking', 'Complimentary refreshments', 'Porter assistance'],
                'is_available_for_pickup' => true,
                'is_available_for_dropoff' => true,
                'auto_assign_vehicle' => true,
                'is_active' => true,
            ],
        ];

        $seeded = 0;
        foreach ($packages as $data) {
            if (AirportPackage::where('name', $data['name'])->exists()) {
                continue;
            }

            AirportPackage::create($data);
            $seeded++;
        }

        $this->command->info("Seeded {$seeded} airport packages.");
    }
}
