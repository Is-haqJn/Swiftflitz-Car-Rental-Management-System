<?php

namespace Database\Factories;

use App\Enums\DriverIdType;
use App\Enums\DriverStatus;
use App\Models\Driver;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Driver>
 */
class DriverFactory extends Factory
{
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'phone_number' => fake()->phoneNumber(),
            'email' => fake()->unique()->safeEmail(),
            'date_of_birth' => fake()->date('Y-m-d', '-20 years'),
            'address' => fake()->address(),
            'city' => fake()->city(),
            'id_type' => DriverIdType::GhanaCard,
            'id_number' => fake()->numerify('GHA-##########-#'),
            'id_expiry_date' => fake()->dateTimeBetween('+1 year', '+5 years')->format('Y-m-d'),
            'license_number' => fake()->numerify('DL-######'),
            'license_class' => 'B',
            'license_expiry_date' => fake()->dateTimeBetween('+1 year', '+4 years')->format('Y-m-d'),
            'license_verified' => true,
            'available_for_chauffeur' => true,
            'available_for_airport' => true,
            'status' => DriverStatus::Available,
            'is_active' => true,
            'created_by' => User::factory(),
        ];
    }

    public function available(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => DriverStatus::Available,
            'is_active' => true,
        ]);
    }

    public function onTrip(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => DriverStatus::OnTrip,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => DriverStatus::Inactive,
            'is_active' => false,
        ]);
    }
}
