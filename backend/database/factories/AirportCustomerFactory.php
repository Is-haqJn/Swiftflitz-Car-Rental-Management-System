<?php

namespace Database\Factories;

use App\Models\AirportCustomer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AirportCustomer>
 */
class AirportCustomerFactory extends Factory
{
    public function definition(): array
    {
        return [
            'full_name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->phoneNumber(),
        ];
    }
}
