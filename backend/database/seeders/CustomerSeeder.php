<?php

namespace Database\Seeders;

use App\Enums\CustomerIdType;
use App\Models\Customer;
use Illuminate\Database\Seeder;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\warning;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (app()->isProduction()) {
            warning('CustomerSeeder seeds development data and is skipped in production by default.');
            if (! confirm('CustomerSeeder - Run in production?', default: false)) {
                $this->command->warn('CustomerSeeder skipped.');

                return;
            }
        }

        $customers = [
            [
                'name' => 'Kwame Mensah',
                'email' => 'kwame.mensah@example.com',
                'phone' => '+233244123456',
                'alt_phone' => '+233201987654',
                'address' => '12 Independence Avenue, Accra',
                'license_number' => 'GH-ACC-001234',
                'license_expiry_date' => now()->addYears(2)->format('Y-m-d'),
                'id_type' => CustomerIdType::GhanaCard->value,
                'id_number' => 'GHA-123456789-0',
                'date_of_birth' => '1990-05-15',
                'emergency_contact' => ['name' => 'Ama Mensah', 'phone' => '+233244555666', 'relationship' => 'Wife'],
                'notes' => 'Preferred customer. Always pays on time.',
                'is_blacklisted' => false,
                'blacklist_reason' => null,
            ],
            [
                'name' => 'Akosua Boateng',
                'email' => 'akosua.boateng@example.com',
                'phone' => '+233245678901',
                'alt_phone' => null,
                'address' => '45 Castle Road, Kumasi',
                'license_number' => 'GH-KSI-005678',
                'license_expiry_date' => now()->addMonths(18)->format('Y-m-d'),
                'id_type' => CustomerIdType::Passport->value,
                'id_number' => 'A1234567',
                'date_of_birth' => '1985-08-22',
                'emergency_contact' => ['name' => 'Kofi Boateng', 'phone' => '+233244777888', 'relationship' => 'Brother'],
                'notes' => 'Corporate client. Frequent business rentals.',
                'is_blacklisted' => false,
                'blacklist_reason' => null,
            ],
            [
                'name' => 'Yaw Asante',
                'email' => 'yaw.asante@example.com',
                'phone' => '+233203456789',
                'alt_phone' => '+233277123456',
                'address' => '78 Oxford Street, Osu, Accra',
                'license_number' => 'GH-ACC-009876',
                'license_expiry_date' => now()->addMonths(6)->format('Y-m-d'),
                'id_type' => CustomerIdType::VoterId->value,
                'id_number' => '12345678901',
                'date_of_birth' => '1992-12-03',
                'emergency_contact' => ['name' => 'Abena Asante', 'phone' => '+233244999000', 'relationship' => 'Sister'],
                'notes' => 'Prefers SUVs for family trips.',
                'is_blacklisted' => false,
                'blacklist_reason' => null,
            ],
            [
                'name' => 'Efua Darko',
                'email' => 'efua.darko@example.com',
                'phone' => '+233276543210',
                'alt_phone' => null,
                'address' => '34 Ring Road East, Accra',
                'license_number' => 'GH-ACC-004567',
                'license_expiry_date' => now()->addYears(3)->format('Y-m-d'),
                'id_type' => CustomerIdType::GhanaCard->value,
                'id_number' => 'GHA-987654321-1',
                'date_of_birth' => '1988-03-10',
                'emergency_contact' => ['name' => 'Kwabena Darko', 'phone' => '+233244111222', 'relationship' => 'Husband'],
                'notes' => 'New customer. First-time renter.',
                'is_blacklisted' => false,
                'blacklist_reason' => null,
            ],
            [
                'name' => 'Kofi Owusu',
                'email' => 'kofi.owusu@example.com',
                'phone' => '+233208765432',
                'alt_phone' => '+233245111333',
                'address' => '56 Spintex Road, Accra',
                'license_number' => 'GH-ACC-007890',
                'license_expiry_date' => now()->subDays(30)->format('Y-m-d'),
                'id_type' => CustomerIdType::GhanaCard->value,
                'id_number' => 'GHA-555666777-8',
                'date_of_birth' => '1995-07-18',
                'emergency_contact' => ['name' => 'Ama Owusu', 'phone' => '+233244333444', 'relationship' => 'Mother'],
                'notes' => 'License expired. Needs renewal before next booking.',
                'is_blacklisted' => false,
                'blacklist_reason' => null,
            ],
            [
                'name' => 'Ama Opoku',
                'email' => 'ama.opoku@example.com',
                'phone' => '+233277654321',
                'alt_phone' => null,
                'address' => '90 Tema Station Road, Tema',
                'license_number' => 'GH-TMA-003456',
                'license_expiry_date' => now()->addYears(1)->format('Y-m-d'),
                'id_type' => CustomerIdType::Passport->value,
                'id_number' => 'B9876543',
                'date_of_birth' => '1993-11-25',
                'emergency_contact' => ['name' => 'Kwesi Opoku', 'phone' => '+233244555777', 'relationship' => 'Father'],
                'notes' => 'VIP customer. Always books luxury vehicles.',
                'is_blacklisted' => false,
                'blacklist_reason' => null,
            ],
            [
                'name' => 'Kwabena Frimpong',
                'email' => 'kwabena.frimpong@example.com',
                'phone' => '+233245987654',
                'alt_phone' => '+233208444555',
                'address' => '23 Liberation Road, Kumasi',
                'license_number' => 'GH-KSI-008901',
                'license_expiry_date' => now()->addMonths(9)->format('Y-m-d'),
                'id_type' => CustomerIdType::VoterId->value,
                'id_number' => '98765432109',
                'date_of_birth' => '1987-04-30',
                'emergency_contact' => ['name' => 'Adwoa Frimpong', 'phone' => '+233244666777', 'relationship' => 'Wife'],
                'notes' => null,
                'is_blacklisted' => false,
                'blacklist_reason' => null,
            ],
            [
                'name' => 'Samuel Appiah',
                'email' => 'samuel.appiah@example.com',
                'phone' => '+233204123456',
                'alt_phone' => null,
                'address' => '67 Airport Road, Accra',
                'license_number' => 'GH-ACC-002345',
                'license_expiry_date' => now()->addMonths(3)->format('Y-m-d'),
                'id_type' => CustomerIdType::GhanaCard->value,
                'id_number' => 'GHA-111222333-4',
                'date_of_birth' => '1991-09-12',
                'emergency_contact' => ['name' => 'Grace Appiah', 'phone' => '+233244888999', 'relationship' => 'Sister'],
                'notes' => 'Late payment history. Monitor closely.',
                'is_blacklisted' => false,
                'blacklist_reason' => null,
            ],
            [
                'name' => 'Abena Adjei',
                'email' => 'abena.adjei@example.com',
                'phone' => '+233276111222',
                'alt_phone' => '+233245666777',
                'address' => '15 Haatso Road, Accra',
                'license_number' => 'GH-ACC-006789',
                'license_expiry_date' => now()->addYears(5)->format('Y-m-d'),
                'id_type' => CustomerIdType::Passport->value,
                'id_number' => 'C5432109',
                'date_of_birth' => '1989-02-28',
                'emergency_contact' => ['name' => 'Yaw Adjei', 'phone' => '+233244222333', 'relationship' => 'Husband'],
                'notes' => 'Travel agent. Books multiple vehicles for tours.',
                'is_blacklisted' => false,
                'blacklist_reason' => null,
            ],
            [
                'name' => 'Kwasi Osei',
                'email' => 'kwasi.osei@example.com',
                'phone' => '+233208999000',
                'alt_phone' => null,
                'address' => '42 East Legon, Accra',
                'license_number' => 'GH-ACC-001111',
                'license_expiry_date' => now()->addMonths(8)->format('Y-m-d'),
                'id_type' => CustomerIdType::GhanaCard->value,
                'id_number' => 'GHA-444555666-7',
                'date_of_birth' => '1994-06-20',
                'emergency_contact' => null,
                'notes' => 'Returned vehicle damaged. Blacklisted.',
                'is_blacklisted' => true,
                'blacklist_reason' => 'Returned vehicle with undisclosed damage. Refused to pay repair costs.',
            ],
        ];

        $seeded = 0;

        foreach ($customers as $customerData) {
            if (! Customer::where('email', $customerData['email'])->exists()) {
                Customer::create($customerData);
                $seeded++;
            }
        }

        $this->command->info("Seeded {$seeded} customers (skipped " . (count($customers) - $seeded) . ' existing).');
    }
}
