<?php

namespace Database\Seeders;

use App\Models\AdditionalCharge;
use App\Models\Category;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\warning;

/**
 * Add-on charges seeder.
 *
 * Scope values  : global | category | vehicle | regular
 * Charge types  : flat | per_day
 *
 * Airport transfer is NOT listed here - it is handled via RentalLocation
 * pickup/dropoff charges (Terminal 1 / Terminal 2 each carry a 150 charge).
 */
class AdditionalChargeSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            warning('AdditionalChargeSeeder seeds development data and is skipped in production by default.');
            if (! confirm('AdditionalChargeSeeder - Run in production?', default: false)) {
                $this->command->warn('AdditionalChargeSeeder skipped.');

                return;
            }
        }

        $categorySuv = Category::where('slug', 'suv')->value('id');
        $categoryLux = Category::where('slug', 'luxury')->value('id');
        $vehicleRav4 = Vehicle::where('license_plate', 'GR-9012-23')->value('id');  // RAV4
        $vehicleEcls = Vehicle::where('license_plate', 'GR-3456-24')->value('id');  // E-Class

        $charges = [

            /* Global charges (auto-applied to every rental) */
            [
                'name' => 'Insurance Fee',
                'description' => 'Mandatory basic insurance coverage included in every rental.',
                'scope' => 'global',
                'charge_type' => 'flat',
                'amount' => 50.00,
                'is_active' => true,
            ],
            [
                'name' => 'Administration Fee',
                'description' => 'One-time rental processing and documentation fee.',
                'scope' => 'global',
                'charge_type' => 'flat',
                'amount' => 30.00,
                'is_active' => true,
            ],
            [
                'name' => 'Environmental Levy',
                'description' => 'Statutory environmental levy charged on all vehicle rentals.',
                'scope' => 'global',
                'charge_type' => 'flat',
                'amount' => 20.00,
                'is_active' => true,
            ],

            /* Category charges (auto-applied per category) */
            [
                'name' => 'SUV Premium Surcharge',
                'description' => 'Additional surcharge applied to all SUV rentals.',
                'scope' => 'category',
                'category_id' => $categorySuv,
                'charge_type' => 'flat',
                'amount' => 80.00,
                'is_active' => true,
            ],
            [
                'name' => 'Luxury Service Fee',
                'description' => 'Valet, premium detailing, and concierge fee for luxury vehicles.',
                'scope' => 'category',
                'category_id' => $categoryLux,
                'charge_type' => 'flat',
                'amount' => 150.00,
                'is_active' => true,
            ],

            /* Vehicle-specific charges (auto-applied to one vehicle) */
            [
                'name' => 'RAV4 Off-Road Kit',
                'description' => 'Off-road accessories pre-fitted on the RAV4 (roof rack, recovery kit).',
                'scope' => 'vehicle',
                'vehicle_id' => $vehicleRav4,
                'charge_type' => 'flat',
                'amount' => 120.00,
                'is_active' => true,
            ],
            [
                'name' => 'E-Class Enhanced Insurance',
                'description' => 'Comprehensive insurance tier required for the Mercedes E-Class.',
                'scope' => 'vehicle',
                'vehicle_id' => $vehicleEcls,
                'charge_type' => 'flat',
                'amount' => 200.00,
                'is_active' => true,
            ],

            /* Regular (selectable add-ons) */
            [
                'name' => 'Child Safety Seat',
                'description' => 'Certified child seat for ages 0–12. Sanitised between rentals.',
                'scope' => 'regular',
                'charge_type' => 'flat',
                'amount' => 40.00,
                'stock_quantity' => 4,
                'is_active' => true,
            ],
            [
                'name' => 'GPS Navigation Device',
                'description' => 'Portable GPS pre-loaded with local and regional maps.',
                'scope' => 'regular',
                'charge_type' => 'flat',
                'amount' => 25.00,
                'stock_quantity' => 6,
                'is_active' => true,
            ],
            [
                'name' => 'Additional Authorised Driver',
                'description' => 'Register a second driver on the rental agreement.',
                'scope' => 'regular',
                'charge_type' => 'flat',
                'amount' => 60.00,
                'is_active' => true,
                // no stock - it's a service, not a physical item
            ],
            [
                'name' => 'Full Tank Fuel Package',
                'description' => 'Return the vehicle without worrying about fuel - full tank guaranteed.',
                'scope' => 'regular',
                'charge_type' => 'flat',
                'amount' => 90.00,
                'is_active' => true,
                // no stock - service-based
            ],
            [
                'name' => 'Dashcam Rental',
                'description' => 'Front-facing dashcam for trip recording and insurance evidence.',
                'scope' => 'regular',
                'charge_type' => 'flat',
                'amount' => 35.00,
                'stock_quantity' => 5,
                'is_active' => true,
            ],
            [
                'name' => 'Portable WiFi Hotspot',
                'description' => 'In-vehicle 4G WiFi hotspot - unlimited data.',
                'scope' => 'regular',
                'charge_type' => 'per_day',
                'amount' => 15.00,
                'stock_quantity' => 8,
                'is_active' => true,
            ],
            [
                'name' => 'Baby Stroller',
                'description' => 'Compact foldable stroller, ideal for family trips.',
                'scope' => 'regular',
                'charge_type' => 'flat',
                'amount' => 30.00,
                'stock_quantity' => 3,
                'is_active' => true,
            ],
        ];

        $seeded = 0;

        foreach ($charges as $charge) {
            // Skip if the FK target doesn't exist
            if (isset($charge['vehicle_id']) && ! $charge['vehicle_id']) {
                continue;
            }
            if (isset($charge['category_id']) && ! $charge['category_id']) {
                continue;
            }

            $exists = AdditionalCharge::where('name', $charge['name'])
                ->where('scope', $charge['scope'])
                ->first();

            if (! $exists) {
                AdditionalCharge::create($charge);
                $seeded++;
            }
        }

        $skipped = count($charges) - $seeded;
        $this->command->info("Seeded {$seeded} additional charges (skipped {$skipped} existing).");
    }
}
