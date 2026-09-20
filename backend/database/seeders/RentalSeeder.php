<?php

namespace Database\Seeders;

use App\Enums\RentalPaymentStatus;
use App\Enums\RentalSource;
use App\Enums\RentalStatus;
use App\Models\AdditionalCharge;
use App\Models\Customer;
use App\Models\Rental;
use App\Models\RentalLocation;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\warning;

/**
 * Seeds 12 rentals across 5 test vehicles.
 *
 * Status coverage:
 *   1  Yaris      - PENDING     (just created, not yet confirmed)
 *   2  Accord     - ACTIVE      (confirmed → picked up)
 *   3  RAV4       - OVERDUE     (active, past return date)
 *   4  E-Class    - RETURNED    (returned, awaiting approval)
 *   5  HiAce      - CANCELLED   (cancelled before pickup, with fee)
 *   6  Yaris      - CANCELLED   (cancelled far in advance, no fee)
 *   7  RAV4       - COMPLETED   (historical - 14 days, paid)
 *   8  RAV4       - COMPLETED   (historical - 5 days, paid)
 *   9  HiAce      - COMPLETED   (historical - 3 days, paid)
 *  10  Accord     - COMPLETED   (historical - 7 days)
 *  11  E-Class    - COMPLETED   (historical - 3 days, loyalty customer)
 *  12  HiAce      - CANCELLED   (cancelled by customer, mid-term)
 */
class RentalSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            warning('RentalSeeder seeds development data and is skipped in production by default.');
            if (! confirm('RentalSeeder - Run in production?', default: false)) {
                $this->command->warn('RentalSeeder skipped.');

                return;
            }
        }

        /* Resolve FKs */
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
            $this->command->warn('RentalSeeder: one or more core vehicles not found - run VehicleSeeder first.');

            return;
        }

        $manager = User::where('email', 'manager@ordaq.com')->first();
        $manager2 = User::where('email', 'manager1@ordaq.com')->first();

        $customers = Customer::all()->values();

        if ($customers->count() < 5) {
            $this->command->warn('RentalSeeder: fewer than 5 customers - run CustomerSeeder first.');

            return;
        }

        $c1 = $customers[0];
        $c2 = $customers[1];
        $c3 = $customers[2];
        $c4 = $customers[3];
        $c5 = $customers[4];
        $c6 = $customers->count() > 5 ? $customers[5] : $customers[0];
        $c7 = $customers->count() > 6 ? $customers[6] : $customers[1];

        $accraOffice = RentalLocation::where('name', 'Main Office - Accra')->first();
        $kumasiHub = RentalLocation::where('name', 'Kumasi Hub')->first();
        $takoradiHub = RentalLocation::where('name', 'Takoradi Hub')->first();

        /* Resolve auto-applied charges for Yaris (Economy) */
        // Insurance Fee (50) + Administration Fee (30) + Environmental Levy (20)
        $globalCharges = AdditionalCharge::where('scope', 'global')->where('is_active', true)->get();
        $suvCharges = AdditionalCharge::where('scope', 'category')
            ->whereHas('category', fn ($q) => $q->where('slug', 'suv'))
            ->where('is_active', true)->get();
        $luxuryCharges = AdditionalCharge::where('scope', 'category')
            ->whereHas('category', fn ($q) => $q->where('slug', 'luxury'))
            ->where('is_active', true)->get();
        $rav4VehicleCharge = AdditionalCharge::where('scope', 'vehicle')
            ->where('vehicle_id', $rav4->id)->where('is_active', true)->get();
        $eclassVehicleCharge = AdditionalCharge::where('scope', 'vehicle')
            ->where('vehicle_id', $eclass->id)->where('is_active', true)->get();

        /**
         * Helper: sum flat/per_day charges into total additional_charges.
         */
        $sumCharges = function ($charges, int $days): float {
            $total = 0.0;
            foreach ($charges as $c) {
                $total += $c->charge_type === 'per_day' ? ($c->amount * $days) : $c->amount;
            }

            return round($total, 2);
        };

        /**
         * Helper: build applied_charges_breakdown JSON for a set of charges.
         */
        $buildBreakdown = function ($charges, int $days): array {
            return $charges->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'scope' => $c->scope,
                'type' => $c->charge_type,
                'amount' => $c->charge_type === 'per_day' ? round($c->amount * $days, 2) : $c->amount,
            ])->values()->toArray();
        };

        /* Pre-calculate per-vehicle charge totals */
        $yarisAutoCharges = $globalCharges;
        $accordAutoCharges = $globalCharges;
        $rav4AutoCharges = $globalCharges->merge($suvCharges)->merge($rav4VehicleCharge);
        $eclassAutoCharges = $globalCharges->merge($luxuryCharges)->merge($eclassVehicleCharge);
        $hiaceAutoCharges = $globalCharges;
        $sportageAutoCharges = $globalCharges->merge($suvCharges);
        $corollaAutoCharges = $globalCharges;
        $tucsonAutoCharges = $globalCharges->merge($suvCharges);
        $camryAutoCharges = $globalCharges;

        /* Rental definitions */
        $definitions = [

            /* 1. PENDING - Toyota Yaris */
            [
                'reference' => 'RF-2026-00001',
                'vehicle_id' => $yaris->id,
                'customer_id' => $c1->id,
                'manager_id' => $manager?->id,
                'source' => RentalSource::Phone->value,
                'status' => RentalStatus::Pending->value,
                'payment_status' => RentalPaymentStatus::Pending->value,

                'pickup_date' => now()->addDay()->format('Y-m-d'),
                'pickup_time' => '09:00',
                'return_date' => now()->addDays(6)->format('Y-m-d'),
                'return_time' => '17:00',

                'pickup_location' => $accraOffice?->name,
                'pickup_location_id' => $accraOffice?->id,

                'rental_days' => 5,
                'daily_rate' => 180.00,
                'base_cost' => 900.00,
                'extras_cost' => 0.00,
                'additional_charges' => $sumCharges($yarisAutoCharges, 5),
                'location_charge' => 0.00,
                'subtotal' => 900.00 + $sumCharges($yarisAutoCharges, 5),
                'total_cost' => 900.00 + $sumCharges($yarisAutoCharges, 5),
                'total_discount_amount' => 0.00,
                'amount_paid' => 0.00,

                'applied_charges_breakdown' => $buildBreakdown($yarisAutoCharges, 5),

                'customer_notes' => 'Please have the car ready early if possible.',
            ],

            /* 2. ACTIVE - Honda Accord */
            [
                'reference' => 'RF-2026-00002',
                'vehicle_id' => $accord->id,
                'customer_id' => $c2->id,
                'manager_id' => $manager?->id,
                'confirmed_by' => $manager?->id,
                'source' => RentalSource::WalkIn->value,
                'status' => RentalStatus::Active->value,
                'payment_status' => RentalPaymentStatus::PartiallyPaid->value,

                'pickup_date' => now()->subDays(1)->format('Y-m-d'),
                'pickup_time' => '09:00',
                'return_date' => now()->addDays(6)->format('Y-m-d'),
                'return_time' => '17:00',
                'actual_pickup_date' => now()->subDay()->setTime(9, 15),

                'pickup_location' => $accraOffice?->name,
                'pickup_location_id' => $accraOffice?->id,

                'rental_days' => 7,
                'daily_rate' => 300.00,
                'base_cost' => 2100.00,
                'extras_cost' => 0.00,
                'additional_charges' => $sumCharges($accordAutoCharges, 7),
                'location_charge' => 0.00,
                'subtotal' => 2100.00 + $sumCharges($accordAutoCharges, 7),
                'total_cost' => 2100.00 + $sumCharges($accordAutoCharges, 7),
                'total_discount_amount' => 0.00,
                'amount_paid' => 1000.00,

                'applied_charges_breakdown' => $buildBreakdown($accordAutoCharges, 7),
            ],

            /* 3. OVERDUE - Toyota RAV4 */
            [
                'reference' => 'RF-2026-00003',
                'vehicle_id' => $rav4->id,
                'customer_id' => $c3->id,
                'manager_id' => $manager?->id,
                'confirmed_by' => $manager?->id,
                'source' => RentalSource::Phone->value,
                'status' => RentalStatus::Overdue->value,
                'payment_status' => RentalPaymentStatus::PartiallyPaid->value,

                'pickup_date' => now()->subDays(9)->format('Y-m-d'),
                'pickup_time' => '09:00',
                'return_date' => now()->subDays(2)->format('Y-m-d'),
                'return_time' => '17:00',
                'actual_pickup_date' => now()->subDays(9)->setTime(9, 30),

                'pickup_location' => $accraOffice?->name,
                'pickup_location_id' => $accraOffice?->id,

                'rental_days' => 7,
                'daily_rate' => 420.00,
                'base_cost' => 2940.00,
                'extras_cost' => 0.00,
                'additional_charges' => $sumCharges($rav4AutoCharges, 7),
                'location_charge' => 0.00,
                'subtotal' => 2940.00 + $sumCharges($rav4AutoCharges, 7),
                'total_cost' => 2940.00 + $sumCharges($rav4AutoCharges, 7),
                'total_discount_amount' => 0.00,
                'amount_paid' => 1500.00,
                'is_overdue' => true,

                'applied_charges_breakdown' => $buildBreakdown($rav4AutoCharges, 7),

                'admin_notes' => 'Customer has not responded to calls. Security deposit held.',
                'security_deposit_amount' => 500.00,
                'security_deposit_status' => 'held',
                'deposit_paid' => 500.00,
            ],

            /* 4. RETURNED (Pending Approval) - Mercedes E-Class */
            [
                'reference' => 'RF-2026-00004',
                'vehicle_id' => $eclass->id,
                'customer_id' => $c4->id,
                'manager_id' => $manager?->id,
                'confirmed_by' => $manager?->id,
                'source' => RentalSource::Website->value,
                'status' => RentalStatus::Returned->value,
                'payment_status' => RentalPaymentStatus::Paid->value,

                'pickup_date' => now()->subDays(8)->format('Y-m-d'),
                'pickup_time' => '10:00',
                'return_date' => now()->subDay()->format('Y-m-d'),
                'return_time' => '17:00',
                'actual_pickup_date' => now()->subDays(8)->setTime(10, 0),
                'actual_return_date' => now()->subDay()->setTime(16, 45),

                'pickup_location' => $accraOffice?->name,
                'pickup_location_id' => $accraOffice?->id,

                'rental_days' => 7,
                'daily_rate' => 800.00,
                'base_cost' => 5600.00,
                'extras_cost' => 0.00,
                'additional_charges' => $sumCharges($eclassAutoCharges, 7),
                'location_charge' => 0.00,
                'subtotal' => 5600.00 + $sumCharges($eclassAutoCharges, 7),
                'total_cost' => 5600.00 + $sumCharges($eclassAutoCharges, 7),
                'total_discount_amount' => 0.00,
                'amount_paid' => 5600.00 + $sumCharges($eclassAutoCharges, 7),

                'applied_charges_breakdown' => $buildBreakdown($eclassAutoCharges, 7),

                'settlement_status' => 'settled',
                'security_deposit_amount' => 1000.00,
                'security_deposit_status' => 'refunded',
                'deposit_paid' => 1000.00,
                'deposit_refunded' => 1000.00,
            ],

            /* 5. CANCELLED (with fee) - Toyota HiAce */
            [
                'reference' => 'RF-2026-00005',
                'vehicle_id' => $hiace->id,
                'customer_id' => $c5->id,
                'manager_id' => $manager?->id,
                'source' => RentalSource::Phone->value,
                'status' => RentalStatus::Cancelled->value,
                'payment_status' => RentalPaymentStatus::Refunded->value,

                'pickup_date' => now()->addDays(1)->format('Y-m-d'),
                'pickup_time' => '08:00',
                'return_date' => now()->addDays(8)->format('Y-m-d'),
                'return_time' => '17:00',

                'rental_days' => 7,
                'daily_rate' => 500.00,
                'base_cost' => 3500.00,
                'extras_cost' => 0.00,
                'additional_charges' => $sumCharges($hiaceAutoCharges, 7),
                'location_charge' => 0.00,
                'subtotal' => 3500.00 + $sumCharges($hiaceAutoCharges, 7),
                'total_cost' => 3500.00 + $sumCharges($hiaceAutoCharges, 7),
                'total_discount_amount' => 0.00,
                'amount_paid' => 0.00,

                'cancellation_reason' => 'Customer changed travel plans.',
                'cancellation_fee' => 175.00,
                'cancellation_amount_owed' => 175.00,
                'refund_amount' => 0.00,
                'cancelled_by_type' => 'customer',
                'cancelled_at' => now()->subHours(5),
            ],

            /* 6. CANCELLED (no fee - far in advance) - Toyota Yaris */
            [
                'reference' => 'RF-2026-00006',
                'vehicle_id' => $yaris->id,
                'customer_id' => $c6->id,
                'manager_id' => $manager?->id,
                'source' => RentalSource::Website->value,
                'status' => RentalStatus::Cancelled->value,
                'payment_status' => RentalPaymentStatus::Refunded->value,

                'pickup_date' => now()->addDays(30)->format('Y-m-d'),
                'pickup_time' => '09:00',
                'return_date' => now()->addDays(35)->format('Y-m-d'),
                'return_time' => '17:00',

                'rental_days' => 5,
                'daily_rate' => 180.00,
                'base_cost' => 900.00,
                'extras_cost' => 0.00,
                'additional_charges' => $sumCharges($yarisAutoCharges, 5),
                'location_charge' => 0.00,
                'subtotal' => 900.00 + $sumCharges($yarisAutoCharges, 5),
                'total_cost' => 900.00 + $sumCharges($yarisAutoCharges, 5),
                'total_discount_amount' => 0.00,
                'amount_paid' => 0.00,

                'cancellation_reason' => 'Cancelled with sufficient notice - no fee applied.',
                'cancellation_fee' => 0.00,
                'refund_amount' => 0.00,
                'cancelled_by_type' => 'customer',
                'cancelled_at' => now()->subDays(2),
            ],

            /* 7. COMPLETED - RAV4 historical (14 days) */
            [
                'reference' => 'RF-2026-00007',
                'vehicle_id' => $rav4->id,
                'customer_id' => $c1->id,
                'manager_id' => $manager?->id,
                'confirmed_by' => $manager?->id,
                'source' => RentalSource::Phone->value,
                'status' => RentalStatus::Completed->value,
                'payment_status' => RentalPaymentStatus::Paid->value,

                'pickup_date' => now()->subDays(30)->format('Y-m-d'),
                'pickup_time' => '09:00',
                'return_date' => now()->subDays(16)->format('Y-m-d'),
                'return_time' => '17:00',
                'actual_pickup_date' => now()->subDays(30)->setTime(9, 0),
                'actual_return_date' => now()->subDays(16)->setTime(17, 0),

                'rental_days' => 14,
                'daily_rate' => 420.00,
                'base_cost' => 5880.00,
                'extras_cost' => 0.00,
                'additional_charges' => $sumCharges($rav4AutoCharges, 14),
                'location_charge' => 0.00,
                'subtotal' => 5880.00 + $sumCharges($rav4AutoCharges, 14),
                'total_cost' => 5880.00 + $sumCharges($rav4AutoCharges, 14),
                'total_discount_amount' => 200.00, // Weekly Stay Bonus discount
                'amount_paid' => 5880.00 + $sumCharges($rav4AutoCharges, 14) - 200.00,

                'applied_charges_breakdown' => $buildBreakdown($rav4AutoCharges, 14),
                'settlement_status' => 'settled',
            ],

            /* 8. COMPLETED - RAV4 historical (5 days) */
            [
                'reference' => 'RF-2026-00008',
                'vehicle_id' => $rav4->id,
                'customer_id' => $c2->id,
                'manager_id' => $manager?->id,
                'confirmed_by' => $manager?->id,
                'source' => RentalSource::Website->value,
                'status' => RentalStatus::Completed->value,
                'payment_status' => RentalPaymentStatus::Paid->value,

                'pickup_date' => now()->subDays(55)->format('Y-m-d'),
                'pickup_time' => '10:00',
                'return_date' => now()->subDays(50)->format('Y-m-d'),
                'return_time' => '17:00',
                'actual_pickup_date' => now()->subDays(55)->setTime(10, 0),
                'actual_return_date' => now()->subDays(50)->setTime(17, 0),

                'rental_days' => 5,
                'daily_rate' => 420.00,
                'base_cost' => 2100.00,
                'extras_cost' => 0.00,
                'additional_charges' => $sumCharges($rav4AutoCharges, 5),
                'location_charge' => 0.00,
                'subtotal' => 2100.00 + $sumCharges($rav4AutoCharges, 5),
                'total_cost' => 2100.00 + $sumCharges($rav4AutoCharges, 5),
                'total_discount_amount' => 0.00,
                'amount_paid' => 2100.00 + $sumCharges($rav4AutoCharges, 5),

                'applied_charges_breakdown' => $buildBreakdown($rav4AutoCharges, 5),
                'settlement_status' => 'settled',
            ],

            /* 9. COMPLETED - HiAce historical (3 days) */
            [
                'reference' => 'RF-2026-00009',
                'vehicle_id' => $hiace->id,
                'customer_id' => $c3->id,
                'manager_id' => $manager2?->id ?? $manager?->id,
                'confirmed_by' => $manager2?->id ?? $manager?->id,
                'source' => RentalSource::WalkIn->value,
                'status' => RentalStatus::Completed->value,
                'payment_status' => RentalPaymentStatus::Paid->value,

                'pickup_date' => now()->subDays(20)->format('Y-m-d'),
                'pickup_time' => '08:00',
                'return_date' => now()->subDays(17)->format('Y-m-d'),
                'return_time' => '17:00',
                'actual_pickup_date' => now()->subDays(20)->setTime(8, 30),
                'actual_return_date' => now()->subDays(17)->setTime(16, 0),

                'rental_days' => 3,
                'daily_rate' => 500.00,
                'base_cost' => 1500.00,
                'extras_cost' => 0.00,
                'additional_charges' => $sumCharges($hiaceAutoCharges, 3),
                'location_charge' => 0.00,
                'subtotal' => 1500.00 + $sumCharges($hiaceAutoCharges, 3),
                'total_cost' => 1500.00 + $sumCharges($hiaceAutoCharges, 3),
                'total_discount_amount' => 0.00,
                'amount_paid' => 1500.00 + $sumCharges($hiaceAutoCharges, 3),

                'settlement_status' => 'settled',
            ],

            /* 10. COMPLETED - Accord historical (7 days) */
            [
                'reference' => 'RF-2026-00010',
                'vehicle_id' => $accord->id,
                'customer_id' => $c4->id,
                'manager_id' => $manager?->id,
                'confirmed_by' => $manager?->id,
                'source' => RentalSource::Phone->value,
                'status' => RentalStatus::Completed->value,
                'payment_status' => RentalPaymentStatus::Paid->value,

                'pickup_date' => now()->subDays(40)->format('Y-m-d'),
                'pickup_time' => '09:00',
                'return_date' => now()->subDays(33)->format('Y-m-d'),
                'return_time' => '17:00',
                'actual_pickup_date' => now()->subDays(40)->setTime(9, 0),
                'actual_return_date' => now()->subDays(33)->setTime(17, 15),

                'rental_days' => 7,
                'daily_rate' => 300.00,
                'base_cost' => 2100.00,
                'extras_cost' => 0.00,
                'additional_charges' => $sumCharges($accordAutoCharges, 7),
                'location_charge' => 0.00,
                'subtotal' => 2100.00 + $sumCharges($accordAutoCharges, 7),
                'total_cost' => 2100.00 + $sumCharges($accordAutoCharges, 7),
                'total_discount_amount' => 0.00,
                'amount_paid' => 2100.00 + $sumCharges($accordAutoCharges, 7),

                'settlement_status' => 'settled',
            ],

            /* 11. COMPLETED - E-Class historical (3 days) */
            [
                'reference' => 'RF-2026-00011',
                'vehicle_id' => $eclass->id,
                'customer_id' => $c5->id,
                'manager_id' => $manager?->id,
                'confirmed_by' => $manager?->id,
                'source' => RentalSource::Referral->value,
                'status' => RentalStatus::Completed->value,
                'payment_status' => RentalPaymentStatus::Paid->value,

                'pickup_date' => now()->subDays(15)->format('Y-m-d'),
                'pickup_time' => '11:00',
                'return_date' => now()->subDays(12)->format('Y-m-d'),
                'return_time' => '17:00',
                'actual_pickup_date' => now()->subDays(15)->setTime(11, 0),
                'actual_return_date' => now()->subDays(12)->setTime(17, 0),

                'pickup_location' => $accraOffice?->name,
                'pickup_location_id' => $accraOffice?->id,

                'rental_days' => 3,
                'daily_rate' => 800.00,
                'base_cost' => 2400.00,
                'extras_cost' => 0.00,
                'additional_charges' => $sumCharges($eclassAutoCharges, 3),
                'location_charge' => 0.00,
                'subtotal' => 2400.00 + $sumCharges($eclassAutoCharges, 3),
                'total_cost' => 2400.00 + $sumCharges($eclassAutoCharges, 3),
                'total_discount_amount' => 0.00,
                'amount_paid' => 2400.00 + $sumCharges($eclassAutoCharges, 3),

                'applied_charges_breakdown' => $buildBreakdown($eclassAutoCharges, 3),
                'settlement_status' => 'settled',
            ],

            /* 13. CONFIRMED - Kia Sportage (Kumasi) */
            ...($sportage ? [[
                'reference' => 'RF-2026-00013',
                'vehicle_id' => $sportage->id,
                'branch_id' => $sportage->branch_id,
                'customer_id' => $c1->id,
                'manager_id' => $manager?->id,
                'confirmed_by' => $manager?->id,
                'source' => RentalSource::WalkIn->value,
                'status' => RentalStatus::Confirmed->value,
                'payment_status' => RentalPaymentStatus::Pending->value,

                'pickup_date' => now()->addDays(2)->format('Y-m-d'),
                'pickup_time' => '10:00',
                'return_date' => now()->addDays(9)->format('Y-m-d'),
                'return_time' => '17:00',

                'pickup_location' => $kumasiHub?->name,
                'pickup_location_id' => $kumasiHub?->id,

                'rental_days' => 7,
                'daily_rate' => 380.00,
                'base_cost' => 2660.00,
                'extras_cost' => 0.00,
                'additional_charges' => $sumCharges($sportageAutoCharges, 7),
                'location_charge' => 0.00,
                'subtotal' => 2660.00 + $sumCharges($sportageAutoCharges, 7),
                'total_cost' => 2660.00 + $sumCharges($sportageAutoCharges, 7),
                'total_discount_amount' => 0.00,
                'amount_paid' => 0.00,

                'applied_charges_breakdown' => $buildBreakdown($sportageAutoCharges, 7),
            ]] : []),

            /* 14. ACTIVE - Toyota Corolla (Kumasi) */
            ...($corolla ? [[
                'reference' => 'RF-2026-00014',
                'vehicle_id' => $corolla->id,
                'branch_id' => $corolla->branch_id,
                'customer_id' => $c2->id,
                'manager_id' => $manager?->id,
                'confirmed_by' => $manager?->id,
                'source' => RentalSource::Phone->value,
                'status' => RentalStatus::Active->value,
                'payment_status' => RentalPaymentStatus::PartiallyPaid->value,

                'pickup_date' => now()->subDays(2)->format('Y-m-d'),
                'pickup_time' => '09:00',
                'return_date' => now()->addDays(5)->format('Y-m-d'),
                'return_time' => '17:00',
                'actual_pickup_date' => now()->subDays(2)->setTime(9, 0),

                'pickup_location' => $kumasiHub?->name,
                'pickup_location_id' => $kumasiHub?->id,

                'rental_days' => 7,
                'daily_rate' => 250.00,
                'base_cost' => 1750.00,
                'extras_cost' => 0.00,
                'additional_charges' => $sumCharges($corollaAutoCharges, 7),
                'location_charge' => 0.00,
                'subtotal' => 1750.00 + $sumCharges($corollaAutoCharges, 7),
                'total_cost' => 1750.00 + $sumCharges($corollaAutoCharges, 7),
                'total_discount_amount' => 0.00,
                'amount_paid' => 800.00,

                'applied_charges_breakdown' => $buildBreakdown($corollaAutoCharges, 7),
            ]] : []),

            /* 15. COMPLETED - Kia Sportage (Kumasi) historical */
            ...($sportage ? [[
                'reference' => 'RF-2026-00015',
                'vehicle_id' => $sportage->id,
                'branch_id' => $sportage->branch_id,
                'customer_id' => $c3->id,
                'manager_id' => $manager?->id,
                'confirmed_by' => $manager?->id,
                'source' => RentalSource::Website->value,
                'status' => RentalStatus::Completed->value,
                'payment_status' => RentalPaymentStatus::Paid->value,

                'pickup_date' => now()->subDays(25)->format('Y-m-d'),
                'pickup_time' => '10:00',
                'return_date' => now()->subDays(20)->format('Y-m-d'),
                'return_time' => '17:00',
                'actual_pickup_date' => now()->subDays(25)->setTime(10, 0),
                'actual_return_date' => now()->subDays(20)->setTime(17, 0),

                'pickup_location' => $kumasiHub?->name,
                'pickup_location_id' => $kumasiHub?->id,

                'rental_days' => 5,
                'daily_rate' => 380.00,
                'base_cost' => 1900.00,
                'extras_cost' => 0.00,
                'additional_charges' => $sumCharges($sportageAutoCharges, 5),
                'location_charge' => 0.00,
                'subtotal' => 1900.00 + $sumCharges($sportageAutoCharges, 5),
                'total_cost' => 1900.00 + $sumCharges($sportageAutoCharges, 5),
                'total_discount_amount' => 0.00,
                'amount_paid' => 1900.00 + $sumCharges($sportageAutoCharges, 5),

                'applied_charges_breakdown' => $buildBreakdown($sportageAutoCharges, 5),
                'settlement_status' => 'settled',
            ]] : []),

            /* 16. PENDING - Hyundai Tucson (Takoradi) */
            ...($tucson ? [[
                'reference' => 'RF-2026-00016',
                'vehicle_id' => $tucson->id,
                'branch_id' => $tucson->branch_id,
                'customer_id' => $c4->id,
                'manager_id' => $manager?->id,
                'source' => RentalSource::Referral->value,
                'status' => RentalStatus::Pending->value,
                'payment_status' => RentalPaymentStatus::Pending->value,

                'pickup_date' => now()->addDays(4)->format('Y-m-d'),
                'pickup_time' => '09:00',
                'return_date' => now()->addDays(7)->format('Y-m-d'),
                'return_time' => '17:00',

                'pickup_location' => $takoradiHub?->name,
                'pickup_location_id' => $takoradiHub?->id,

                'rental_days' => 3,
                'daily_rate' => 350.00,
                'base_cost' => 1050.00,
                'extras_cost' => 0.00,
                'additional_charges' => $sumCharges($tucsonAutoCharges, 3),
                'location_charge' => 0.00,
                'subtotal' => 1050.00 + $sumCharges($tucsonAutoCharges, 3),
                'total_cost' => 1050.00 + $sumCharges($tucsonAutoCharges, 3),
                'total_discount_amount' => 0.00,
                'amount_paid' => 0.00,

                'applied_charges_breakdown' => $buildBreakdown($tucsonAutoCharges, 3),
            ]] : []),

            /* 17. COMPLETED - Hyundai Tucson (Takoradi) historical */
            ...($tucson ? [[
                'reference' => 'RF-2026-00017',
                'vehicle_id' => $tucson->id,
                'branch_id' => $tucson->branch_id,
                'customer_id' => $c5->id,
                'manager_id' => $manager?->id,
                'confirmed_by' => $manager?->id,
                'source' => RentalSource::WalkIn->value,
                'status' => RentalStatus::Completed->value,
                'payment_status' => RentalPaymentStatus::Paid->value,

                'pickup_date' => now()->subDays(35)->format('Y-m-d'),
                'pickup_time' => '09:00',
                'return_date' => now()->subDays(29)->format('Y-m-d'),
                'return_time' => '17:00',
                'actual_pickup_date' => now()->subDays(35)->setTime(9, 0),
                'actual_return_date' => now()->subDays(29)->setTime(17, 0),

                'pickup_location' => $takoradiHub?->name,
                'pickup_location_id' => $takoradiHub?->id,

                'rental_days' => 6,
                'daily_rate' => 350.00,
                'base_cost' => 2100.00,
                'extras_cost' => 0.00,
                'additional_charges' => $sumCharges($tucsonAutoCharges, 6),
                'location_charge' => 0.00,
                'subtotal' => 2100.00 + $sumCharges($tucsonAutoCharges, 6),
                'total_cost' => 2100.00 + $sumCharges($tucsonAutoCharges, 6),
                'total_discount_amount' => 0.00,
                'amount_paid' => 2100.00 + $sumCharges($tucsonAutoCharges, 6),

                'settlement_status' => 'settled',
            ]] : []),

            /* 18. ACTIVE - Toyota Camry (Lagos) */
            ...($camry ? [[
                'reference' => 'RF-2026-00018',
                'vehicle_id' => $camry->id,
                'branch_id' => $camry->branch_id,
                'customer_id' => $c6->id,
                'manager_id' => $manager?->id,
                'confirmed_by' => $manager?->id,
                'source' => RentalSource::Phone->value,
                'status' => RentalStatus::Active->value,
                'payment_status' => RentalPaymentStatus::Paid->value,

                'pickup_date' => now()->subDays(1)->format('Y-m-d'),
                'pickup_time' => '08:00',
                'return_date' => now()->addDays(4)->format('Y-m-d'),
                'return_time' => '17:00',
                'actual_pickup_date' => now()->subDay()->setTime(8, 0),

                'rental_days' => 5,
                'daily_rate' => 280.00,
                'base_cost' => 1400.00,
                'extras_cost' => 0.00,
                'additional_charges' => $sumCharges($camryAutoCharges, 5),
                'location_charge' => 0.00,
                'subtotal' => 1400.00 + $sumCharges($camryAutoCharges, 5),
                'total_cost' => 1400.00 + $sumCharges($camryAutoCharges, 5),
                'total_discount_amount' => 0.00,
                'amount_paid' => 1400.00 + $sumCharges($camryAutoCharges, 5),

                'applied_charges_breakdown' => $buildBreakdown($camryAutoCharges, 5),
            ]] : []),

            /* 19. COMPLETED - Toyota Camry (Lagos) historical */
            ...($camry ? [[
                'reference' => 'RF-2026-00019',
                'vehicle_id' => $camry->id,
                'branch_id' => $camry->branch_id,
                'customer_id' => $c7->id,
                'manager_id' => $manager?->id,
                'confirmed_by' => $manager?->id,
                'source' => RentalSource::Website->value,
                'status' => RentalStatus::Completed->value,
                'payment_status' => RentalPaymentStatus::Paid->value,

                'pickup_date' => now()->subDays(45)->format('Y-m-d'),
                'pickup_time' => '10:00',
                'return_date' => now()->subDays(41)->format('Y-m-d'),
                'return_time' => '17:00',
                'actual_pickup_date' => now()->subDays(45)->setTime(10, 0),
                'actual_return_date' => now()->subDays(41)->setTime(17, 0),

                'rental_days' => 4,
                'daily_rate' => 280.00,
                'base_cost' => 1120.00,
                'extras_cost' => 0.00,
                'additional_charges' => $sumCharges($camryAutoCharges, 4),
                'location_charge' => 0.00,
                'subtotal' => 1120.00 + $sumCharges($camryAutoCharges, 4),
                'total_cost' => 1120.00 + $sumCharges($camryAutoCharges, 4),
                'total_discount_amount' => 0.00,
                'amount_paid' => 1120.00 + $sumCharges($camryAutoCharges, 4),

                'settlement_status' => 'settled',
            ]] : []),

            /* 12. CANCELLED (by customer, mid-advance) - HiAce */
            [
                'reference' => 'RF-2026-00012',
                'vehicle_id' => $hiace->id,
                'customer_id' => $c7->id,
                'manager_id' => $manager?->id,
                'source' => RentalSource::Website->value,
                'status' => RentalStatus::Cancelled->value,
                'payment_status' => RentalPaymentStatus::Refunded->value,

                'pickup_date' => now()->addDays(5)->format('Y-m-d'),
                'pickup_time' => '09:00',
                'return_date' => now()->addDays(12)->format('Y-m-d'),
                'return_time' => '17:00',

                'rental_days' => 7,
                'daily_rate' => 500.00,
                'base_cost' => 3500.00,
                'extras_cost' => 0.00,
                'additional_charges' => $sumCharges($hiaceAutoCharges, 7),
                'location_charge' => 0.00,
                'subtotal' => 3500.00 + $sumCharges($hiaceAutoCharges, 7),
                'total_cost' => 3500.00 + $sumCharges($hiaceAutoCharges, 7),
                'total_discount_amount' => 0.00,
                'amount_paid' => 0.00,

                'cancellation_reason' => 'Customer found a better deal elsewhere.',
                'cancellation_fee' => 87.50,
                'cancellation_amount_owed' => 87.50,
                'refund_amount' => 0.00,
                'cancelled_by_type' => 'customer',
                'cancelled_at' => now()->subDay(),
            ],

            /* 20. OVERDUE (1h) - HiAce - hourly rate */
            // Scheduled return was exactly 1 hour ago → 1h × GHS 100 = GHS 100
            [
                'reference' => 'RF-2026-00020',
                'vehicle_id' => $hiace->id,
                'customer_id' => $c1->id,
                'manager_id' => $manager?->id,
                'confirmed_by' => $manager?->id,
                'source' => RentalSource::WalkIn->value,
                'status' => RentalStatus::Overdue->value,
                'payment_status' => RentalPaymentStatus::PartiallyPaid->value,

                'pickup_date' => now()->subDays(4)->format('Y-m-d'),
                'pickup_time' => '09:00',
                'return_date' => now()->subHour()->format('Y-m-d'),
                'return_time' => now()->subHour()->format('H:i'),
                'actual_pickup_date' => now()->subDays(4)->setTime(9, 0),

                'pickup_location' => $accraOffice?->name,
                'pickup_location_id' => $accraOffice?->id,

                'rental_days' => 3,
                'daily_rate' => 500.00,
                'base_cost' => 1500.00,
                'extras_cost' => 0.00,
                'additional_charges' => $sumCharges($hiaceAutoCharges, 3),
                'location_charge' => 0.00,
                'subtotal' => 1500.00 + $sumCharges($hiaceAutoCharges, 3),
                'total_cost' => 1500.00 + $sumCharges($hiaceAutoCharges, 3),
                'total_discount_amount' => 0.00,
                'amount_paid' => 800.00,
                'is_overdue' => true,
                'overdue_fee' => 100.00,

                'applied_charges_breakdown' => $buildBreakdown($hiaceAutoCharges, 3),
                'admin_notes' => 'Overdue test: 1h late - hourly rate applies.',
            ],

            /* 21. OVERDUE (2h 55m) - Yaris - near threshold */
            // Scheduled return was 2h 55m ago → ceil(175/60)=3h × GHS 100 = GHS 300
            [
                'reference' => 'RF-2026-00021',
                'vehicle_id' => $yaris->id,
                'customer_id' => $c2->id,
                'manager_id' => $manager?->id,
                'confirmed_by' => $manager?->id,
                'source' => RentalSource::Phone->value,
                'status' => RentalStatus::Overdue->value,
                'payment_status' => RentalPaymentStatus::Pending->value,

                'pickup_date' => now()->subDays(4)->format('Y-m-d'),
                'pickup_time' => '09:00',
                'return_date' => now()->subHours(2)->subMinutes(55)->format('Y-m-d'),
                'return_time' => now()->subHours(2)->subMinutes(55)->format('H:i'),
                'actual_pickup_date' => now()->subDays(4)->setTime(9, 0),

                'pickup_location' => $accraOffice?->name,
                'pickup_location_id' => $accraOffice?->id,

                'rental_days' => 3,
                'daily_rate' => 180.00,
                'base_cost' => 540.00,
                'extras_cost' => 0.00,
                'additional_charges' => $sumCharges($yarisAutoCharges, 3),
                'location_charge' => 0.00,
                'subtotal' => 540.00 + $sumCharges($yarisAutoCharges, 3),
                'total_cost' => 540.00 + $sumCharges($yarisAutoCharges, 3),
                'total_discount_amount' => 0.00,
                'amount_paid' => 0.00,
                'is_overdue' => true,
                'overdue_fee' => 300.00,

                'applied_charges_breakdown' => $buildBreakdown($yarisAutoCharges, 3),
                'admin_notes' => 'Overdue test: 2h 55m late - still hourly (below 3h threshold), billed 3h.',
            ],

            /* 22. OVERDUE (4h) - Sportage - converts to daily rate */
            // Scheduled return was 4h ago → past 3h threshold → ceil(240/1440)=1d × daily rate
            ...($sportage ? [[
                'reference' => 'RF-2026-00022',
                'vehicle_id' => $sportage->id,
                'branch_id' => $sportage->branch_id,
                'customer_id' => $c3->id,
                'manager_id' => $manager?->id,
                'confirmed_by' => $manager?->id,
                'source' => RentalSource::Website->value,
                'status' => RentalStatus::Overdue->value,
                'payment_status' => RentalPaymentStatus::PartiallyPaid->value,

                'pickup_date' => now()->subDays(4)->format('Y-m-d'),
                'pickup_time' => '09:00',
                'return_date' => now()->subHours(4)->format('Y-m-d'),
                'return_time' => now()->subHours(4)->format('H:i'),
                'actual_pickup_date' => now()->subDays(4)->setTime(9, 0),

                'pickup_location' => $accraOffice?->name,
                'pickup_location_id' => $accraOffice?->id,

                'rental_days' => 3,
                'daily_rate' => 380.00,
                'base_cost' => 1140.00,
                'extras_cost' => 0.00,
                'additional_charges' => $sumCharges($sportageAutoCharges, 3),
                'location_charge' => 0.00,
                'subtotal' => 1140.00 + $sumCharges($sportageAutoCharges, 3),
                'total_cost' => 1140.00 + $sumCharges($sportageAutoCharges, 3),
                'total_discount_amount' => 0.00,
                'amount_paid' => 600.00,
                'is_overdue' => true,
                'overdue_fee' => 380.00,

                'applied_charges_breakdown' => $buildBreakdown($sportageAutoCharges, 3),
                'admin_notes' => 'Overdue test: 4h late - past 3h threshold, converts to 1 full-day charge.',
            ]] : []),

        ];

        $seeded = 0;
        $skipped = 0;

        foreach ($definitions as $def) {
            if (Rental::where('reference', $def['reference'])->exists()) {
                $skipped++;

                continue;
            }

            Rental::create($def);
            $seeded++;
        }

        /* Update vehicle statuses for active/overdue/returned rentals */
        $accord->update(['status' => 'rented']);
        $rav4->update(['status' => 'rented']);
        $eclass->update(['status' => 'rented']);
        $corolla?->update(['status' => 'rented']);
        $camry?->update(['status' => 'rented']);
        // Overdue test vehicles
        $hiace->update(['status' => 'rented']);
        $yaris->update(['status' => 'rented']);
        $sportage?->update(['status' => 'rented']);

        $this->command->info("Seeded {$seeded} rentals (skipped {$skipped} existing).");
    }
}
