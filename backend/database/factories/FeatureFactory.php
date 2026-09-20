<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Feature>
 */
class FeatureFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name'      => fake()->unique()->words(2, true),
            'icon'      => fake()->randomElement(['wifi', 'gps', 'bluetooth', 'camera', 'usb', 'ac', 'sunroof']),
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
