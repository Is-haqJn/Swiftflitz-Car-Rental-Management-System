<?php

namespace Database\Factories;

use App\Models\ChauffeurCustomer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ChauffeurCustomer>
 */
class ChauffeurCustomerFactory extends Factory
{
    public function definition(): array
    {
        return [
            'full_name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'expected_destination' => fake()->optional(0.5)->address(),
        ];
    }

    public function withoutEmail(): static
    {
        return $this->state(fn (array $attributes) => [
            'email' => null,
        ]);
    }
}
