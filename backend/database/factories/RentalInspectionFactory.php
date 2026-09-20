<?php

namespace Database\Factories;

use App\Enums\InspectionType;
use App\Models\Rental;
use App\Models\RentalInspection;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\RentalInspection>
 */
class RentalInspectionFactory extends Factory
{
    protected $model = RentalInspection::class;

    public function definition(): array
    {
        return [
            'rental_id' => Rental::factory(),
            'manager_id' => null,
            'type' => InspectionType::Pickup->value,
            'notes' => fake()->optional()->paragraph(),
            'damage_report' => null,
            'fuel_level' => ['level' => fake()->randomElement(['full', 'three_quarters', 'half', 'quarter', 'empty'])],
            'odometer_reading' => ['value' => fake()->numberBetween(1000, 200000), 'unit' => 'km'],
            'images' => null,
        ];
    }

    public function pickup(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => InspectionType::Pickup->value,
        ]);
    }

    public function return(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => InspectionType::Return->value,
        ]);
    }

    public function withManager(): static
    {
        return $this->state(fn (array $attributes) => [
            'manager_id' => User::factory(),
        ]);
    }

    public function withDamage(): static
    {
        return $this->state(fn (array $attributes) => [
            'damage_report' => [
                ['location' => 'front_bumper', 'description' => fake()->sentence(), 'severity' => 'minor'],
            ],
        ]);
    }
}
