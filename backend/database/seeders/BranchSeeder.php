<?php

namespace Database\Seeders;

use App\Enums\RoleEnum;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\warning;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            warning('BranchSeeder seeds development data and is skipped in production by default.');
            if (! confirm('BranchSeeder - Run in production?', default: false)) {
                $this->command->warn('BranchSeeder skipped.');

                return;
            }
        }

        $branches = [
            [
                'name' => 'Accra HQ',
                'code' => 'ACC',
                'address' => 'No. 1 Independence Avenue, Accra',
                'description' => 'Main headquarters in Accra',
                'is_active' => true,
            ],
            [
                'name' => 'Kumasi Branch',
                'code' => 'KSI',
                'address' => 'Adum, Kumasi',
                'description' => 'Kumasi operations branch',
                'is_active' => true,
            ],
            [
                'name' => 'Takoradi Branch',
                'code' => 'TDI',
                'address' => 'Market Circle, Takoradi',
                'description' => 'Western region branch',
                'is_active' => true,
            ],
            [
                'name' => 'Tema Branch',
                'code' => 'TMA',
                'address' => 'Community 1, Tema',
                'description' => 'Tema industrial area branch',
                'is_active' => true,
            ],
        ];

        $branches[] = [
            'name' => 'Lagos Branch',
            'code' => 'LOS',
            'address' => '1 Airport Road, Ikeja, Lagos',
            'description' => 'Lagos airport operations branch',
            'is_active' => true,
            'currency' => 'NGN',
            'currency_symbol' => '₦',
            'exchange_rate' => 0.085,
            'has_airport_service' => true,
        ];

        $seeded = 0;
        foreach ($branches as $branchData) {
            if (! Branch::where('code', $branchData['code'])->exists()) {
                Branch::create($branchData);
                $seeded++;
            }
        }

        $this->command->info("Seeded {$seeded} branches.");

        /* Seed extra test managers */
        $manager1 = User::firstOrCreate(
            ['email' => 'manager1@ordaq.com'],
            [
                'name' => 'Manager One',
                'username' => 'manager1',
                'password' => Hash::make('password'),
            ]
        );
        if (! $manager1->hasRole(RoleEnum::MANAGER)) {
            $manager1->assignRole(RoleEnum::MANAGER);
        }
        $this->command->info('Seeded manager1@ordaq.com');

        $manager2 = User::firstOrCreate(
            ['email' => 'manager2@ordaq.com'],
            [
                'name' => 'Manager Two',
                'username' => 'manager2',
                'password' => Hash::make('password'),
            ]
        );
        if (! $manager2->hasRole(RoleEnum::MANAGER)) {
            $manager2->assignRole(RoleEnum::MANAGER);
        }
        $this->command->info('Seeded manager2@ordaq.com');

        /* Branch assignments */
        // manager@ordaq.com  → Accra + Kumasi
        // manager1@ordaq.com → Accra only
        // manager2@ordaq.com → Kumasi only
        $accra = Branch::where('code', 'ACC')->first();
        $kumasi = Branch::where('code', 'KSI')->first();
        $manager = User::where('email', 'manager@ordaq.com')->first();

        if ($accra && $manager) {
            $accra->managers()->syncWithoutDetaching([$manager->id, $manager1->id]);
            $this->command->info('Assigned manager + manager1 to Accra HQ.');
        }
        if ($kumasi && $manager) {
            $kumasi->managers()->syncWithoutDetaching([$manager->id, $manager2->id]);
            $this->command->info('Assigned manager + manager2 to Kumasi.');
        }

        /* Lagos Branch manager */
        $manager3 = User::firstOrCreate(
            ['email' => 'manager3@ordaq.com'],
            [
                'name' => 'Manager Three',
                'username' => 'manager3',
                'password' => Hash::make('password'),
            ]
        );
        if (! $manager3->hasRole(RoleEnum::MANAGER)) {
            $manager3->assignRole(RoleEnum::MANAGER);
        }
        $this->command->info('Seeded manager3@ordaq.com');

        $lagos = Branch::where('code', 'LOS')->first();
        if ($lagos && $manager3) {
            $lagos->managers()->syncWithoutDetaching([$manager3->id]);
            $this->command->info('Assigned manager3 to Lagos Branch.');
        }

        /* Assign viewer and staff to Accra branch */
        $viewer = User::where('email', 'user@ordaq.com')->first();
        $staff = User::where('email', 'staff@ordaq.com')->first();

        if ($accra && $viewer) {
            $accra->managers()->syncWithoutDetaching([$viewer->id]);
            $this->command->info('Assigned viewer (user@ordaq.com) to Accra HQ.');
        }

        if ($accra && $staff) {
            $accra->managers()->syncWithoutDetaching([$staff->id]);
            $this->command->info('Assigned staff (staff@ordaq.com) to Accra HQ.');
        }
    }
}
