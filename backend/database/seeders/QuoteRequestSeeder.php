<?php

namespace Database\Seeders;

use App\Enums\QuoteRequestStatus;
use App\Models\Customer;
use App\Models\QuoteRequest;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\warning;

class QuoteRequestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (app()->isProduction()) {
            warning('QuoteRequestSeeder seeds development data and is skipped in production by default.');
            if (! confirm('QuoteRequestSeeder - Run in production?', default: false)) {
                $this->command->warn('QuoteRequestSeeder skipped.');

                return;
            }
        }

        $vehicles = Vehicle::all();

        if ($vehicles->isEmpty()) {
            $this->command->warn('Skipping QuoteRequestSeeder: no vehicles found.');

            return;
        }

        // An existing customer to link to quote #2
        $existingCustomer = Customer::where('email', 'kwame.mensah@example.com')->first();

        $quotes = [
            /* Quote 1: new customer + expected_pickup_date set */
            [
                'vehicle_id' => $vehicles->first()->id,
                'name' => 'John Mensah',
                'email' => 'john.mensah@gmail.com',
                'phone' => '+233244876543',
                'rental_days' => 7,
                'expected_pickup_date' => now()->addDays(10)->format('Y-m-d'),
                'message' => 'I need a vehicle for a family road trip to Kumasi.',
                'status' => QuoteRequestStatus::Pending->value,
            ],

            /* Quote 2: existing customer linked via customer_id */
            [
                'vehicle_id' => $vehicles->skip(1)->first()?->id ?? $vehicles->first()->id,
                'customer_id' => $existingCustomer?->id,
                'name' => $existingCustomer?->name ?? 'Kwame Mensah',
                'email' => $existingCustomer?->email ?? 'kwame.mensah@example.com',
                'phone' => $existingCustomer?->phone ?? '+233244123456',
                'rental_days' => 3,
                'message' => 'Business trip to Takoradi. Need a comfortable sedan.',
                'status' => QuoteRequestStatus::Contacted->value,
                'admin_notes' => 'Existing customer - linked profile. Follow up with pricing.',
                'contacted_at' => now()->subDays(2)->toISOString(),
            ],

            /* Quote 3: brand-new customer, no pickup date */
            [
                'vehicle_id' => $vehicles->skip(2)->first()?->id ?? $vehicles->first()->id,
                'name' => 'Ama Darkwa',
                'email' => 'ama.darkwa@yahoo.com',
                'phone' => '+233208123456',
                'rental_days' => 5,
                'message' => 'Airport pickup required. Arriving at midnight.',
                'status' => QuoteRequestStatus::Pending->value,
            ],
        ];

        $seeded = 0;

        foreach ($quotes as $quoteData) {
            $data = array_merge($quoteData, [
                'reference' => 'QR-' . now()->format('Y') . '-' . strtoupper(Str::random(5)),
            ]);

            QuoteRequest::create($data);
            $seeded++;
        }

        $this->command->info("Seeded {$seeded} quote requests.");
    }
}
