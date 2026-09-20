<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;

class VehicleFactory extends Factory
{
    protected $model = Vehicle::class;

    public function definition(): array
    {
        $makes = ['Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes', 'Hyundai', 'Kia', 'Nissan'];
        $make = fake()->randomElement($makes);

        return [
            'category_id' => Category::factory(),
            'name' => $make . ' ' . fake()->word(),
            'make' => $make,
            'model' => fake()->word(),
            'year' => fake()->numberBetween(2015, 2024),
            'license_plate' => strtoupper(fake()->bothify('GR-####-??')),
            'vin' => strtoupper(fake()->bothify('?????????????????')),
            'color' => fake()->safeColorName(),
            'seats' => fake()->randomElement([2, 4, 5, 7, 8]),
            'fuel_type' => fake()->randomElement(['petrol', 'diesel', 'hybrid', 'electric']),
            'engine_size' => fake()->randomElement(['1.5L', '2.0L', '2.5L', '3.0L']),
            'odometer' => fake()->numberBetween(0, 150000),
            'has_insurance' => fake()->boolean(80),
            'has_roadworthy' => fake()->boolean(80),
            'transmission' => fake()->randomElement(['automatic', 'manual']),
            'features' => [],
            'daily_rate' => fake()->randomFloat(2, 50, 500),
            'price_visible' => true,
            'status' => 'available',
            'condition_notes' => null,
            'is_featured' => false,
            'roadworthy_expiry_date' => fake()->dateTimeBetween('now', '+2 years')->format('Y-m-d'),
            'insurance_expiry_date' => fake()->dateTimeBetween('now', '+2 years')->format('Y-m-d'),
        ];
    }

    public function unavailable(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rented',
        ]);
    }

    public function featured(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_featured' => true,
        ]);
    }
}
