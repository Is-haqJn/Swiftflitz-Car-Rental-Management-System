<?php

namespace Database\Factories;

use App\Enums\ChauffeurBookingStatus;
use App\Enums\ChauffeurPaymentStatus;
use App\Models\Branch;
use App\Models\ChauffeurBooking;
use App\Models\ChauffeurCustomer;
use App\Models\FleetVehicle;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ChauffeurBooking>
 */
class ChauffeurBookingFactory extends Factory
{
    public function definition(): array
    {
        $basePrice = fake()->randomFloat(2, 200, 800);
        $vatRate = 15.0;
        $vatAmount = round($basePrice * $vatRate / 100, 2);
        $total = round($basePrice + $vatAmount, 2);

        $pickupTime = fake()->dateTimeBetween('+1 day', '+14 days');
        $returnTime = (clone $pickupTime)->modify('+' . fake()->numberBetween(2, 10) . ' hours');

        return [
            'booking_reference' => 'CHF-' . date('Y') . '-' . str_pad(fake()->numberBetween(1, 99999), 5, '0', STR_PAD_LEFT),
            'branch_id' => Branch::factory(),
            'vehicle_id' => FleetVehicle::factory()->available(),
            'driver_id' => null,
            'chauffeur_customer_id' => ChauffeurCustomer::factory(),
            'pickup_location_id' => null,
            'pickup_time' => $pickupTime->format('Y-m-d H:i:s'),
            'return_time' => $returnTime->format('Y-m-d H:i:s'),
            'actual_pickup_time' => null,
            'actual_return_time' => null,
            'base_price_snapshot' => $basePrice,
            'pickup_charge_snapshot' => 0.00,
            'vat_rate_snapshot' => $vatRate,
            'vat_amount' => $vatAmount,
            'overtime_hours' => 0.00,
            'overtime_charge' => 0.00,
            'total_amount' => $total,
            'payment_status' => ChauffeurPaymentStatus::Pending,
            'payment_method' => null,
            'payment_reference' => null,
            'booking_status' => ChauffeurBookingStatus::Pending,
            'cancellation_fee_applied' => null,
            'no_show_fee_applied' => null,
            'cancelled_at' => null,
            'cancelled_by' => null,
            'staff_notes' => null,
            'created_by' => User::factory(),
        ];
    }

    public function confirmed(): static
    {
        return $this->state(fn (array $attributes) => [
            'booking_status' => ChauffeurBookingStatus::Confirmed,
        ]);
    }

    public function driverAssigned(): static
    {
        return $this->state(fn (array $attributes) => [
            'booking_status' => ChauffeurBookingStatus::DriverAssigned,
        ]);
    }

    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'booking_status' => ChauffeurBookingStatus::InProgress,
            'actual_pickup_time' => now()->subHours(2),
        ]);
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'payment_status' => ChauffeurPaymentStatus::Paid,
            'payment_method' => 'cash',
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'booking_status' => ChauffeurBookingStatus::Cancelled,
            'cancelled_at' => now(),
        ]);
    }
}
