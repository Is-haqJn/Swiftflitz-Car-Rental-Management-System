<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\RentalLocation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RentalLocation>
 */
class RentalLocationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'branch_id' => Branch::factory(),
            'name' => fake()->unique()->city() . ' ' . fake()->randomElement(['Office', 'Depot', 'Hub', 'Point']),
            'pickup_charge' => fake()->optional(0.6)->randomFloat(2, 0, 100),
            'dropoff_charge' => fake()->optional(0.6)->randomFloat(2, 0, 100),
            'is_default' => false,
            'is_pickup' => true,
            'is_dropoff' => true,
            'is_active' => true,
        ];
    }

    public function default(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Main Office',
            'pickup_charge' => null,
            'dropoff_charge' => null,
            'is_default' => true,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function pickupOnly(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_pickup' => true,
            'is_dropoff' => false,
        ]);
    }

    public function dropoffOnly(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_pickup' => false,
            'is_dropoff' => true,
        ]);
    }
}
