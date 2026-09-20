<?php

namespace Database\Factories;

use App\Models\Airport;
use App\Models\AirportPackage;
use App\Models\AirportPackageAssignment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AirportPackageAssignment>
 */
class AirportPackageAssignmentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'package_id' => AirportPackage::factory(),
            'airport_id' => Airport::factory(),
            'base_price' => fake()->randomFloat(2, 50, 500),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
