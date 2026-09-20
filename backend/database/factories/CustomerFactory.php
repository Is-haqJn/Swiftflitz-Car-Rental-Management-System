<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Customer>
 */
class CustomerFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->numerify('+233#########'),
            'alt_phone' => null,
            'address' => fake()->address(),
            'license_number' => strtoupper(fake()->unique()->bothify('DL-####-????')),
            'license_expiry_date' => fake()->dateTimeBetween('+6 months', '+5 years')->format('Y-m-d'),
            'id_type' => fake()->randomElement(['ghana_card', 'passport', 'voter_id']),
            'id_number' => strtoupper(fake()->unique()->bothify('GHA-########-?')),
            'date_of_birth' => fake()->dateTimeBetween('-60 years', '-18 years')->format('Y-m-d'),
            'emergency_contact' => null,
            'notes' => null,
            'is_blacklisted' => false,
            'blacklist_reason' => null,
            'profile_status' => 'verified',
        ];
    }

    public function blacklisted(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_blacklisted' => true,
            'blacklist_reason' => fake()->sentence(),
        ]);
    }

    public function expiredLicense(): static
    {
        return $this->state(fn (array $attributes) => [
            'license_expiry_date' => fake()->dateTimeBetween('-2 years', '-1 day')->format('Y-m-d'),
        ]);
    }
}
