<?php

namespace Database\Factories;

use App\Models\AirportPackage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AirportPackage>
 */
class AirportPackageFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['Basic', 'Comfort', 'Premium', 'Executive']) . ' ' . fake()->lexify('??'),
            'description' => fake()->sentence(),
            'features' => [
                fake()->randomElement(['Standard sedan', 'Luxury SUV', 'Minivan']),
                'Driver waits at pickup point',
                fake()->randomElement(['Water provided', 'Phone charging', 'Meet & greet']),
            ],
            'is_available_for_pickup' => true,
            'is_available_for_dropoff' => true,
            'auto_assign_vehicle' => true,
            'is_active' => true,
        ];
    }

    public function pickupOnly(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_available_for_pickup' => true,
            'is_available_for_dropoff' => false,
        ]);
    }

    public function dropoffOnly(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_available_for_pickup' => false,
            'is_available_for_dropoff' => true,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
