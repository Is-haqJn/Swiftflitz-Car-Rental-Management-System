<?php

namespace Database\Factories;

use App\Enums\FleetServiceType;
use App\Models\FleetServiceAssignment;
use App\Models\FleetVehicle;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FleetServiceAssignment>
 */
class FleetServiceAssignmentFactory extends Factory
{
    protected $model = FleetServiceAssignment::class;

    public function definition(): array
    {
        return [
            'vehicle_id' => FleetVehicle::factory()->available(),
            'service_type' => FleetServiceType::Chauffeur,
            'package_id' => null,
            'category_id' => null,
            'base_price' => fake()->randomFloat(2, 200, 800),
            'is_active' => true,
        ];
    }

    public function chauffeur(): static
    {
        return $this->state(fn (array $attributes) => [
            'service_type' => FleetServiceType::Chauffeur,
        ]);
    }

    public function airport(): static
    {
        return $this->state(fn (array $attributes) => [
            'service_type' => FleetServiceType::Airport,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
