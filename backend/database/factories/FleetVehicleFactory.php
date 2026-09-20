<?php

namespace Database\Factories;

use App\Enums\FleetVehicleStatus;
use App\Models\Branch;
use App\Models\FleetVehicle;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FleetVehicle>
 */
class FleetVehicleFactory extends Factory
{
    public function definition(): array
    {
        return [
            'branch_id' => Branch::factory(),
            'make' => fake()->randomElement(['Toyota', 'Mercedes', 'BMW', 'Ford', 'Hyundai']),
            'model' => fake()->randomElement(['Corolla', 'E-Class', 'X5', 'Transit', 'H1']),
            'year' => fake()->numberBetween(2018, 2024),
            'color' => fake()->safeColorName(),
            'license_plate' => strtoupper(fake()->bothify('GR-####-??')),
            'seats' => fake()->randomElement([4, 6, 7, 8]),
            'features' => ['Air Conditioning', 'GPS'],
            'has_insurance' => true,
            'insurance_expiry_date' => fake()->dateTimeBetween('+1 year', '+3 years')->format('Y-m-d'),
            'has_roadworthy' => true,
            'roadworthy_expiry_date' => fake()->dateTimeBetween('+1 year', '+2 years')->format('Y-m-d'),
            'status' => FleetVehicleStatus::Available,
            'is_active' => true,
        ];
    }

    public function available(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => FleetVehicleStatus::Available,
            'is_active' => true,
        ]);
    }

    public function onTrip(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => FleetVehicleStatus::OnTrip,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => FleetVehicleStatus::Inactive,
            'is_active' => false,
        ]);
    }
}
