<?php

namespace Database\Factories;

use App\Enums\AirportAssignmentMode;
use App\Enums\AirportBookingDirection;
use App\Enums\AirportBookingSource;
use App\Enums\AirportBookingStatus;
use App\Enums\AirportPaymentStatus;
use App\Models\Airport;
use App\Models\AirportBooking;
use App\Models\AirportCustomer;
use App\Models\AirportLocation;
use App\Models\AirportPackage;
use App\Models\AirportPackageAssignment;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AirportBooking>
 */
class AirportBookingFactory extends Factory
{
    public function definition(): array
    {
        $packageRate = fake()->randomFloat(2, 80, 300);
        $areaCharge = fake()->randomFloat(2, 0, 50);
        $vatRate = 15.0;
        $subtotal = $packageRate + $areaCharge;
        $vatAmount = round($subtotal * $vatRate / 100, 2);
        $total = round($subtotal + $vatAmount, 2);

        return [
            'booking_reference' => 'APT-' . date('Y') . '-' . strtoupper(fake()->bothify('?????')),
            'branch_id' => Branch::factory(),
            'airport_id' => Airport::factory(),
            'direction' => AirportBookingDirection::Pickup,
            'package_id' => AirportPackage::factory(),
            'package_assignment_id' => AirportPackageAssignment::factory(),
            'airport_customer_id' => AirportCustomer::factory(),
            'passenger_name' => fake()->name(),
            'passenger_phone' => fake()->phoneNumber(),
            'passenger_count' => fake()->numberBetween(1, 4),
            'flight_number' => fake()->bothify('??###'),
            'airline' => fake()->randomElement(['Ghana Airlines', 'British Airways', 'Emirates', 'KLM']),
            'scheduled_at' => fake()->dateTimeBetween('+1 day', '+30 days'),
            'terminal_location_id' => AirportLocation::factory()->terminal(),
            'area_location_id' => AirportLocation::factory()->area(),
            'specific_address' => null,
            'package_rate_snapshot' => $packageRate,
            'area_charge_snapshot' => $areaCharge,
            'vat_rate_snapshot' => $vatRate,
            'vat_amount' => $vatAmount,
            'total_amount' => $total,
            'payment_status' => AirportPaymentStatus::Pending,
            'payment_method' => null,
            'payment_reference' => null,
            'booking_status' => AirportBookingStatus::Pending,
            'booking_source' => AirportBookingSource::Staff,
            'assignment_mode' => AirportAssignmentMode::Manual,
            'cancellation_fee_applied' => null,
            'cancelled_at' => null,
            'cancelled_by' => null,
            'staff_notes' => null,
            'created_by' => User::factory(),
        ];
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'payment_status' => AirportPaymentStatus::Paid,
            'payment_method' => 'cash',
            'booking_status' => AirportBookingStatus::PaymentReceived,
        ]);
    }

    public function confirmed(): static
    {
        return $this->state(fn (array $attributes) => [
            'payment_status' => AirportPaymentStatus::Paid,
            'payment_method' => 'cash',
            'booking_status' => AirportBookingStatus::Confirmed,
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'booking_status' => AirportBookingStatus::Cancelled,
            'cancelled_at' => now(),
        ]);
    }
}
