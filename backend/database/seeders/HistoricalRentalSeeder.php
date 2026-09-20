<?php

namespace Database\Seeders;

use App\Enums\RentalPaymentStatus;
use App\Enums\RentalSource;
use App\Enums\RentalStatus;
use App\Enums\TransactionType;
use App\Models\Customer;
use App\Models\PaymentTransaction;
use App\Models\Rental;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\warning;

/**
 * Seeds 12 months of completed rental history for dashboard/report graphs.
 *
 * Each month generates 6–8 completed rentals across available vehicles.
 * Corresponding PaymentTransaction records use actual_return_date as paid_at
 * so revenue charts show accurate monthly data.
 */
class HistoricalRentalSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            warning('HistoricalRentalSeeder seeds development data and is skipped in production by default.');
            if (! confirm('HistoricalRentalSeeder - Run in production?', default: false)) {
                $this->command->warn('HistoricalRentalSeeder skipped.');

                return;
            }
        }

        $yaris = Vehicle::where('license_plate', 'GR-1234-23')->first();
        $accord = Vehicle::where('license_plate', 'GR-8901-23')->first();
        $rav4 = Vehicle::where('license_plate', 'GR-9012-23')->first();
        $eclass = Vehicle::where('license_plate', 'GR-3456-24')->first();
        $hiace = Vehicle::where('license_plate', 'GR-0123-23')->first();
        $sportage = Vehicle::where('license_plate', 'GR-2345-23')->first();
        $corolla = Vehicle::where('license_plate', 'GR-4567-23')->first();
        $tucson = Vehicle::where('license_plate', 'GR-6789-23')->first();
        $camry = Vehicle::where('license_plate', 'LAG-1234-24')->first();

        if (! $yaris || ! $accord || ! $rav4 || ! $eclass || ! $hiace) {
            $this->command->warn('HistoricalRentalSeeder: core vehicles not found - run VehicleSeeder first.');

            return;
        }

        $manager = User::where('email', 'manager@ordaq.com')->first();
        $customers = Customer::all()->values();

        if ($customers->count() < 3) {
            $this->command->warn('HistoricalRentalSeeder: fewer than 3 customers - run CustomerSeeder first.');

            return;
        }

        /*
         * Vehicle pool with daily rates and flat additional charges.
         * Global charges: Insurance (50) + Admin (30) + Environmental Levy (20) = 100 flat.
         * SUV adds 80 flat. Luxury adds 150 flat. Vehicle-specific: RAV4 +120, E-Class +200.
         */
        $vehiclePool = array_filter([
            $yaris ? ['vehicle' => $yaris, 'rate' => 180.00, 'extra' => 100.00] : null,
            $accord ? ['vehicle' => $accord, 'rate' => 300.00, 'extra' => 100.00] : null,
            $rav4 ? ['vehicle' => $rav4, 'rate' => 420.00, 'extra' => 300.00] : null,
            $eclass ? ['vehicle' => $eclass, 'rate' => 800.00, 'extra' => 350.00] : null,
            $hiace ? ['vehicle' => $hiace, 'rate' => 500.00, 'extra' => 100.00] : null,
            $sportage ? ['vehicle' => $sportage, 'rate' => 380.00, 'extra' => 180.00] : null,
            $corolla ? ['vehicle' => $corolla, 'rate' => 250.00, 'extra' => 100.00] : null,
            $tucson ? ['vehicle' => $tucson, 'rate' => 350.00, 'extra' => 180.00] : null,
            $camry ? ['vehicle' => $camry, 'rate' => 280.00, 'extra' => 100.00] : null,
        ]);

        $vehiclePool = array_values($vehiclePool);
        $poolSize = count($vehiclePool);
        $sources = [RentalSource::Phone->value, RentalSource::Website->value, RentalSource::WalkIn->value, RentalSource::Referral->value];
        $dayLengths = [2, 3, 5, 7, 3, 4, 6, 2];

        $seeded = 0;
        $skipped = 0;

        for ($monthOffset = 12; $monthOffset >= 1; $monthOffset--) {
            $monthStart = now()->startOfMonth()->subMonths($monthOffset);
            $rentalCountThisMonth = ($monthOffset % 3 === 0) ? 8 : 6;

            for ($i = 0; $i < $rentalCountThisMonth; $i++) {
                $vehicleEntry = $vehiclePool[($i + $monthOffset) % $poolSize];
                $vehicle = $vehicleEntry['vehicle'];
                $dailyRate = $vehicleEntry['rate'];
                $extraCharges = $vehicleEntry['extra'];

                $days = $dayLengths[$i % count($dayLengths)];
                $customer = $customers[($i + $monthOffset) % $customers->count()];

                $pickupDay = (($i * 3) % 18) + 1;
                $pickupDate = $monthStart->copy()->addDays($pickupDay - 1)->setTime(9, 0);
                $returnDate = $pickupDate->copy()->addDays($days)->setTime(17, 0);

                if ($returnDate->month !== $monthStart->month) {
                    $returnDate = $monthStart->copy()->endOfMonth()->setTime(17, 0);
                    $days = max(1, (int) $pickupDate->diffInDays($returnDate));
                }

                $baseCost = round($dailyRate * $days, 2);
                $totalCost = round($baseCost + $extraCharges, 2);

                $year = $monthStart->format('Y');
                $month = $monthStart->format('m');
                $reference = "RFH-{$year}{$month}-" . str_pad($i + 1, 2, '0', STR_PAD_LEFT);

                if (Rental::where('reference', $reference)->exists()) {
                    $skipped++;

                    continue;
                }

                $rental = Rental::create([
                    'reference' => $reference,
                    'vehicle_id' => $vehicle->id,
                    'branch_id' => $vehicle->branch_id,
                    'customer_id' => $customer->id,
                    'manager_id' => $manager?->id,
                    'confirmed_by' => $manager?->id,
                    'source' => $sources[$i % count($sources)],
                    'status' => RentalStatus::Completed->value,
                    'payment_status' => RentalPaymentStatus::Paid->value,
                    'settlement_status' => 'settled',

                    'pickup_date' => $pickupDate->format('Y-m-d'),
                    'pickup_time' => '09:00',
                    'return_date' => $returnDate->format('Y-m-d'),
                    'return_time' => '17:00',
                    'actual_pickup_date' => $pickupDate,
                    'actual_return_date' => $returnDate,

                    'rental_days' => $days,
                    'daily_rate' => $dailyRate,
                    'base_cost' => $baseCost,
                    'extras_cost' => 0.00,
                    'additional_charges' => $extraCharges,
                    'location_charge' => 0.00,
                    'subtotal' => $totalCost,
                    'total_cost' => $totalCost,
                    'total_discount_amount' => 0.00,
                    'amount_paid' => $totalCost,
                ]);

                PaymentTransaction::create([
                    'reference' => 'SEED-' . strtoupper(Str::random(8)),
                    'provider' => 'manual',
                    'channel' => 'cash',
                    'type' => TransactionType::ManualPayment->value,
                    'amount' => $totalCost,
                    'currency' => 'GHS',
                    'status' => 'paid',
                    'paid_at' => $returnDate,
                    'description' => 'Historical seeded payment',
                    'payer_name' => $customer->name ?? 'Unknown',
                    'payer_email' => $customer->email ?? '',
                    'payer_phone' => $customer->phone ?? '',
                    'transactable_type' => 'rental',
                    'transactable_id' => $rental->id,
                    'processed_by_user_id' => null,
                ]);

                $seeded++;
            }
        }

        $this->command->info("HistoricalRentalSeeder: seeded {$seeded} rentals with transactions (skipped {$skipped} existing).");
    }
}
