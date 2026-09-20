<?php

namespace Database\Factories;

use App\Enums\RentalPaymentStatus;
use App\Enums\RentalSource;
use App\Enums\RentalStatus;
use App\Models\Customer;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Rental>
 */
class RentalFactory extends Factory
{
    public function definition(): array
    {
        $pickupDate = fake()->dateTimeBetween('+1 day', '+10 days');
        $returnDate = fake()->dateTimeBetween('+11 days', '+20 days');
        $rentalDays = max(1, (int) $pickupDate->diff($returnDate)->days);
        $dailyRate = fake()->randomFloat(2, 100, 500);
        $baseCost = round($dailyRate * $rentalDays, 2);

        return [
            'reference' => 'RF-' . now()->format('Y') . '-' . strtoupper(Str::random(5)),
            'vehicle_id' => Vehicle::factory(),
            'customer_id' => Customer::factory(),
            'manager_id' => null,
            'confirmed_by' => null,
            'branch_id' => null,
            'source' => RentalSource::WalkIn->value,
            'status' => RentalStatus::Pending->value,
            'payment_status' => RentalPaymentStatus::Pending->value,
            'pickup_date' => $pickupDate->format('Y-m-d'),
            'pickup_time' => '09:00',
            'return_date' => $returnDate->format('Y-m-d'),
            'return_time' => '17:00',
            'actual_pickup_date' => null,
            'actual_return_date' => null,
            'rental_days' => $rentalDays,
            'daily_rate' => $dailyRate,
            'base_cost' => $baseCost,
            'extras_cost' => 0,
            'additional_charges' => 0,
            'location_charge' => 0,
            'subtotal' => $baseCost,
            'vat_amount' => null,
            'total_cost' => $baseCost,
            'rule_discount_amount' => 0,
            'coupon_discount_amount' => 0,
            'manual_discount_amount' => 0,
            'total_discount_amount' => 0,
            'amount_paid' => 0.0,
            'security_deposit_amount' => null,
            'security_deposit_status' => null,
            'skip_security_deposit' => false,
            'deposit_paid' => 0,
            'deposit_refunded' => 0,
            'deposit_waived' => false,
            'overdue_fee' => null,
            'late_pickup_fee' => null,
            'is_overdue' => false,
            'overdue_waived' => false,
            'is_early_return' => false,
            'early_return_refund' => 0,
            'has_damage' => false,
            'customer_notes' => null,
            'admin_notes' => null,
        ];
    }

    public function confirmed(): static
    {
        return $this->state(fn () => [
            'status' => RentalStatus::Confirmed->value,
        ]);
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => RentalStatus::Active->value,
            'actual_pickup_date' => now()->subDays(2)->toDateTimeString(),
            'pickup_date' => now()->subDays(2)->format('Y-m-d'),
            'return_date' => now()->addDays(3)->format('Y-m-d'),
        ]);
    }

    public function overdue(): static
    {
        return $this->state(fn () => [
            'status' => RentalStatus::Overdue->value,
            'actual_pickup_date' => now()->subDays(10)->toDateTimeString(),
            'pickup_date' => now()->subDays(10)->format('Y-m-d'),
            'return_date' => now()->subDays(3)->format('Y-m-d'),
            'is_overdue' => true,
        ]);
    }

    public function returned(): static
    {
        return $this->state(fn () => [
            'status' => RentalStatus::Returned->value,
            'actual_pickup_date' => now()->subDays(5)->toDateTimeString(),
            'actual_return_date' => now()->toDateTimeString(),
            'settlement_status' => 'settled',
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn () => [
            'status' => RentalStatus::Completed->value,
            'actual_pickup_date' => now()->subDays(7)->toDateTimeString(),
            'actual_return_date' => now()->subDays(1)->toDateTimeString(),
            'settlement_status' => 'settled',
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn () => [
            'status' => RentalStatus::Cancelled->value,
            'cancelled_at' => now()->toDateTimeString(),
        ]);
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'payment_status' => RentalPaymentStatus::Paid->value,
            'amount_paid' => $attributes['total_cost'],
        ]);
    }

    public function withDeposit(float $amount = 200.00): static
    {
        return $this->state(fn () => [
            'security_deposit_amount' => $amount,
            'security_deposit_status' => 'held',
            'deposit_paid' => $amount,
        ]);
    }

    public function withManager(): static
    {
        return $this->state(fn () => [
            'manager_id' => User::factory(),
        ]);
    }
}
