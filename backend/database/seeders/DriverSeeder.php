<?php

namespace Database\Seeders;

use App\Enums\DriverIdType;
use App\Enums\DriverStatus;
use App\Models\Driver;
use App\Models\User;
use Illuminate\Database\Seeder;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\warning;

/**
 * Seed airport-capable drivers for testing the driver assignment flow.
 */
class DriverSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            warning('DriverSeeder seeds development data and is skipped in production by default.');
            if (! confirm('DriverSeeder - Run in production?', default: false)) {
                $this->command->warn('DriverSeeder skipped.');

                return;
            }
        }

        $drivers = [
            /* License expiring in 18 days - triggers driver document expiry alert */
            [
                'first_name' => 'Kwame',
                'last_name' => 'Asante',
                'phone_number' => '+233244000001',
                'email' => 'kwame.asante@swiftflitz.com',
                'date_of_birth' => '1988-03-15',
                'address' => 'Airport Residential Area',
                'city' => 'Accra',
                'id_type' => DriverIdType::Passport,
                'id_number' => 'GHA-001-DRV',
                'id_expiry_date' => now()->addYears(4)->format('Y-m-d'),
                'license_number' => 'LIC-GHA-DRV-001',
                'license_class' => 'B',
                'license_expiry_date' => now()->addDays(18)->format('Y-m-d'),
                'license_verified' => true,
                'available_for_chauffeur' => true,
                'available_for_airport' => true,
                'status' => DriverStatus::Available,
                'is_active' => true,
            ],
            [
                'first_name' => 'Ama',
                'last_name' => 'Boateng',
                'phone_number' => '+233244000002',
                'email' => 'ama.boateng@swiftflitz.com',
                'date_of_birth' => '1992-07-22',
                'address' => 'Cantonments',
                'city' => 'Accra',
                'id_type' => DriverIdType::GhanaCard,
                'id_number' => 'GHA-002-DRV',
                'id_expiry_date' => now()->addYears(5)->format('Y-m-d'),
                'license_number' => 'LIC-GHA-DRV-002',
                'license_class' => 'B',
                'license_expiry_date' => now()->addYears(4)->format('Y-m-d'),
                'license_verified' => true,
                'available_for_chauffeur' => false,
                'available_for_airport' => true,
                'status' => DriverStatus::Available,
                'is_active' => true,
            ],
            [
                'first_name' => 'Kofi',
                'last_name' => 'Mensah',
                'phone_number' => '+233244000003',
                'email' => 'kofi.mensah@swiftflitz.com',
                'date_of_birth' => '1985-11-08',
                'address' => 'East Legon',
                'city' => 'Accra',
                'id_type' => DriverIdType::Passport,
                'id_number' => 'GHA-003-DRV',
                'id_expiry_date' => now()->addYears(3)->format('Y-m-d'),
                'license_number' => 'LIC-GHA-DRV-003',
                'license_class' => 'B+E',
                'license_expiry_date' => now()->addYears(5)->format('Y-m-d'),
                'license_verified' => true,
                'available_for_chauffeur' => true,
                'available_for_airport' => true,
                'status' => DriverStatus::Available,
                'is_active' => true,
            ],
            /* ID expiring in 25 days - triggers driver document expiry alert */
            [
                'first_name' => 'Abena',
                'last_name' => 'Darko',
                'phone_number' => '+233244000004',
                'email' => 'abena.darko@swiftflitz.com',
                'date_of_birth' => '1995-01-30',
                'address' => 'Tema',
                'city' => 'Tema',
                'id_type' => DriverIdType::GhanaCard,
                'id_number' => 'GHA-004-DRV',
                'id_expiry_date' => now()->addDays(25)->format('Y-m-d'),
                'license_number' => 'LIC-GHA-DRV-004',
                'license_class' => 'B',
                'license_expiry_date' => now()->addYears(3)->format('Y-m-d'),
                'license_verified' => true,
                'available_for_chauffeur' => false,
                'available_for_airport' => true,
                'status' => DriverStatus::Available,
                'is_active' => true,
            ],
        ];

        $adminId = User::role('super_admin')->value('id');

        if (! $adminId) {
            $this->command->warn('No super_admin user found - skipping DriverSeeder.');

            return;
        }

        $seeded = 0;
        $skipped = 0;

        foreach ($drivers as $data) {
            $data['created_by'] = $adminId;
            if (Driver::where('license_number', $data['license_number'])->exists()) {
                $skipped++;

                continue;
            }

            Driver::create($data);
            $seeded++;
        }

        $this->command->info("Seeded {$seeded} drivers (skipped {$skipped} existing).");
    }
}
