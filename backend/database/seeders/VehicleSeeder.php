<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\warning;

/**
 * Seed 5 core test vehicles covering all major categories.
 *
 * These license plates are referenced by RentalSeeder:
 *   GR-1234-23  Toyota Yaris      Economy  Accra HQ  →  PENDING rental
 *   GR-8901-23  Honda Accord      Sedan    Accra HQ  →  ACTIVE rental
 *   GR-9012-23  Toyota RAV4       SUV      Accra HQ  →  OVERDUE rental + historical completed
 *   GR-3456-24  Mercedes E-Class  Luxury   Accra HQ  →  RETURNED rental
 *   GR-0123-23  Toyota HiAce      Van      Tema      →  CANCELLED rental + historical completed
 */
class VehicleSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            warning('VehicleSeeder seeds development data and is skipped in production by default.');
            if (! confirm('VehicleSeeder - Run in production?', default: false)) {
                $this->command->warn('VehicleSeeder skipped.');

                return;
            }
        }

        $economy = Category::where('slug', 'economy')->value('id');
        $sedan = Category::where('slug', 'sedan')->value('id');
        $suv = Category::where('slug', 'suv')->value('id');
        $luxury = Category::where('slug', 'luxury')->value('id');
        $van = Category::where('slug', 'van')->value('id');

        $acc = Branch::where('code', 'ACC')->value('id');
        $tma = Branch::where('code', 'TMA')->value('id');
        $ksi = Branch::where('code', 'KSI')->value('id');
        $tdi = Branch::where('code', 'TDI')->value('id');
        $los = Branch::where('code', 'LOS')->value('id');

        $vehicles = [
            /* 1. Economy - Accra HQ */
            [
                'category_id' => $economy,
                'branch_id' => $acc,
                'name' => 'Toyota Yaris',
                'make' => 'Toyota',
                'model' => 'Yaris',
                'year' => 2023,
                'license_plate' => 'GR-1234-23',
                'vin' => 'JTDKB20U790123456',
                'color' => 'White',
                'seats' => 5,
                'fuel_type' => 'petrol',
                'engine_size' => '1.5L',
                'odometer' => 12500,
                'transmission' => 'automatic',
                'has_insurance' => true,
                'has_roadworthy' => true,
                'roadworthy_expiry_date' => now()->addMonths(10)->format('Y-m-d'),
                'insurance_expiry_date' => now()->addMonths(8)->format('Y-m-d'),
                'daily_rate' => 180.00,
                'price_visible' => true,
                'status' => 'available',
                'is_featured' => false,
            ],
            /* 2. Sedan - Accra HQ - insurance expiring in 20 days (triggers expiry alert) */
            [
                'category_id' => $sedan,
                'branch_id' => $acc,
                'name' => 'Honda Accord',
                'make' => 'Honda',
                'model' => 'Accord',
                'year' => 2023,
                'license_plate' => 'GR-8901-23',
                'vin' => '1HGCV1F34PA890100',
                'color' => 'Silver',
                'seats' => 5,
                'fuel_type' => 'petrol',
                'engine_size' => '2.0L',
                'odometer' => 18200,
                'transmission' => 'automatic',
                'has_insurance' => true,
                'has_roadworthy' => true,
                'roadworthy_expiry_date' => now()->addMonths(14)->format('Y-m-d'),
                'insurance_expiry_date' => now()->addDays(20)->format('Y-m-d'),
                'daily_rate' => 300.00,
                'price_visible' => true,
                'status' => 'available',
                'is_featured' => true,
            ],
            /* 3. SUV - Accra HQ */
            [
                'category_id' => $suv,
                'branch_id' => $acc,
                'name' => 'Toyota RAV4',
                'make' => 'Toyota',
                'model' => 'RAV4',
                'year' => 2023,
                'license_plate' => 'GR-9012-23',
                'vin' => '2T3BFREV4NW901234',
                'color' => 'Black',
                'seats' => 5,
                'fuel_type' => 'petrol',
                'engine_size' => '2.5L',
                'odometer' => 9800,
                'transmission' => 'automatic',
                'has_insurance' => true,
                'has_roadworthy' => true,
                'roadworthy_expiry_date' => now()->addMonths(16)->format('Y-m-d'),
                'insurance_expiry_date' => now()->addMonths(13)->format('Y-m-d'),
                'daily_rate' => 420.00,
                'price_visible' => true,
                'status' => 'available',
                'is_featured' => true,
            ],
            /* 4. Luxury - Accra HQ */
            [
                'category_id' => $luxury,
                'branch_id' => $acc,
                'name' => 'Mercedes-Benz E-Class',
                'make' => 'Mercedes-Benz',
                'model' => 'E-Class',
                'year' => 2024,
                'license_plate' => 'GR-3456-24',
                'vin' => 'WDDZF4JB0KA345678',
                'color' => 'Obsidian Black',
                'seats' => 5,
                'fuel_type' => 'diesel',
                'engine_size' => '3.0L',
                'odometer' => 3200,
                'transmission' => 'automatic',
                'has_insurance' => true,
                'has_roadworthy' => true,
                'roadworthy_expiry_date' => now()->addMonths(20)->format('Y-m-d'),
                'insurance_expiry_date' => now()->addMonths(18)->format('Y-m-d'),
                'daily_rate' => 800.00,
                'price_visible' => true,
                'status' => 'available',
                'is_featured' => true,
            ],
            /* 5. Van - Tema Branch - roadworthy expiring in 15 days (triggers expiry alert) */
            [
                'category_id' => $van,
                'branch_id' => $tma,
                'name' => 'Toyota HiAce',
                'make' => 'Toyota',
                'model' => 'HiAce',
                'year' => 2023,
                'license_plate' => 'GR-0123-23',
                'vin' => 'JT2AE09B6X0012345',
                'color' => 'Pearl White',
                'seats' => 14,
                'fuel_type' => 'diesel',
                'engine_size' => '2.8L',
                'odometer' => 31000,
                'transmission' => 'manual',
                'has_insurance' => true,
                'has_roadworthy' => true,
                'roadworthy_expiry_date' => now()->addDays(15)->format('Y-m-d'),
                'insurance_expiry_date' => now()->addMonths(5)->format('Y-m-d'),
                'daily_rate' => 500.00,
                'price_visible' => true,
                'status' => 'available',
                'is_featured' => false,
            ],
            /* 6. SUV - Kumasi Branch */
            [
                'category_id' => $suv,
                'branch_id' => $ksi,
                'name' => 'Kia Sportage',
                'make' => 'Kia',
                'model' => 'Sportage',
                'year' => 2023,
                'license_plate' => 'GR-2345-23',
                'vin' => 'KNDPMCAC7N7234567',
                'color' => 'Midnight Black',
                'seats' => 5,
                'fuel_type' => 'petrol',
                'engine_size' => '2.0L',
                'odometer' => 14500,
                'transmission' => 'automatic',
                'has_insurance' => true,
                'has_roadworthy' => true,
                'roadworthy_expiry_date' => now()->addMonths(12)->format('Y-m-d'),
                'insurance_expiry_date' => now()->addMonths(9)->format('Y-m-d'),
                'daily_rate' => 380.00,
                'price_visible' => true,
                'status' => 'available',
                'is_featured' => true,
            ],
            /* 7. Sedan - Kumasi Branch */
            [
                'category_id' => $sedan,
                'branch_id' => $ksi,
                'name' => 'Toyota Corolla',
                'make' => 'Toyota',
                'model' => 'Corolla',
                'year' => 2023,
                'license_plate' => 'GR-4567-23',
                'vin' => 'JTDBR32E8X0045678',
                'color' => 'Silver',
                'seats' => 5,
                'fuel_type' => 'petrol',
                'engine_size' => '1.8L',
                'odometer' => 22000,
                'transmission' => 'automatic',
                'has_insurance' => true,
                'has_roadworthy' => true,
                'roadworthy_expiry_date' => now()->addMonths(11)->format('Y-m-d'),
                'insurance_expiry_date' => now()->addMonths(8)->format('Y-m-d'),
                'daily_rate' => 250.00,
                'price_visible' => true,
                'status' => 'available',
                'is_featured' => false,
            ],
            /* 8. SUV - Takoradi Branch */
            [
                'category_id' => $suv,
                'branch_id' => $tdi,
                'name' => 'Hyundai Tucson',
                'make' => 'Hyundai',
                'model' => 'Tucson',
                'year' => 2023,
                'license_plate' => 'GR-6789-23',
                'vin' => '5NMZF4LB1NH678901',
                'color' => 'Phantom Black',
                'seats' => 5,
                'fuel_type' => 'diesel',
                'engine_size' => '2.0L',
                'odometer' => 18700,
                'transmission' => 'automatic',
                'has_insurance' => true,
                'has_roadworthy' => true,
                'roadworthy_expiry_date' => now()->addMonths(15)->format('Y-m-d'),
                'insurance_expiry_date' => now()->addMonths(12)->format('Y-m-d'),
                'daily_rate' => 350.00,
                'price_visible' => true,
                'status' => 'available',
                'is_featured' => true,
            ],
            /* 9. Sedan - Lagos Branch */
            [
                'category_id' => $sedan,
                'branch_id' => $los,
                'name' => 'Toyota Camry',
                'make' => 'Toyota',
                'model' => 'Camry',
                'year' => 2024,
                'license_plate' => 'LAG-1234-24',
                'vin' => '4T1BF1FK5EU123456',
                'color' => 'Pearl White',
                'seats' => 5,
                'fuel_type' => 'petrol',
                'engine_size' => '2.5L',
                'odometer' => 8200,
                'transmission' => 'automatic',
                'has_insurance' => true,
                'has_roadworthy' => true,
                'roadworthy_expiry_date' => now()->addMonths(18)->format('Y-m-d'),
                'insurance_expiry_date' => now()->addMonths(15)->format('Y-m-d'),
                'daily_rate' => 280.00,
                'price_visible' => true,
                'status' => 'available',
                'is_featured' => true,
            ],
        ];

        $seeded = 0;
        $skipped = 0;

        foreach ($vehicles as $data) {
            if (! $data['category_id']) {
                $this->command->warn("Skipping {$data['name']} - category not found (run CategorySeeder first).");

                continue;
            }

            if (Vehicle::where('license_plate', $data['license_plate'])->exists()) {
                $skipped++;

                continue;
            }

            Vehicle::create($data);
            $seeded++;
        }

        $this->command->info("Seeded {$seeded} vehicles (skipped {$skipped} existing).");
    }
}
