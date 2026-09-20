<?php

namespace Database\Seeders;

use App\Models\Airport;
use App\Models\Branch;
use Illuminate\Database\Seeder;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\warning;

class AirportSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            warning('AirportSeeder seeds development data and is skipped in production by default.');
            if (! confirm('AirportSeeder - Run in production?', default: false)) {
                $this->command->warn('AirportSeeder skipped.');

                return;
            }
        }

        $airports = [
            [
                'name' => 'Murtala Mohammed International Airport',
                'city' => 'Lagos',
                'country' => 'Nigeria',
                'is_active' => true,
                'branch_code' => 'LOS',
            ],
            [
                'name' => 'Kotoka International Airport',
                'city' => 'Accra',
                'country' => 'Ghana',
                'is_active' => true,
                'branch_code' => 'ACC',
            ],
            [
                'name' => 'Kumasi Airport',
                'city' => 'Kumasi',
                'country' => 'Ghana',
                'is_active' => true,
                'branch_code' => 'KSI',
            ],
        ];

        $seeded = 0;
        foreach ($airports as $data) {
            $branchCode = $data['branch_code'];
            unset($data['branch_code']);

            if (Airport::where('name', $data['name'])->exists()) {
                continue;
            }

            $airport = Airport::create($data);
            $seeded++;

            // Link to branch if not already linked
            $branch = Branch::where('code', $branchCode)->first();
            if ($branch && ! $branch->airport_id) {
                $branch->update([
                    'airport_id' => $airport->id,
                    'has_airport_service' => true,
                ]);
            }
        }

        $this->command->info("Seeded {$seeded} airports.");
    }
}
