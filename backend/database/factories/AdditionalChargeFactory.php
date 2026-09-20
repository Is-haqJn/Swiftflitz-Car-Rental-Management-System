<?php

namespace Database\Factories;

use App\Enums\ChargeScope;
use App\Enums\ChargeType;
use App\Models\AdditionalCharge;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AdditionalCharge>
 */
class AdditionalChargeFactory extends Factory
{
    protected $model = AdditionalCharge::class;

    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'description' => fake()->optional()->sentence(),
            'scope' => ChargeScope::Global->value,
            'vehicle_id' => null,
            'category_id' => null,
            'charge_type' => fake()->randomElement(ChargeType::list()),
            'amount' => fake()->randomFloat(2, 5, 200),
            'is_active' => true,
        ];
    }

    public function fixed(): static
    {
        return $this->state(fn (array $attributes) => [
            'charge_type' => ChargeType::Fixed->value,
        ]);
    }

    public function percentage(): static
    {
        return $this->state(fn (array $attributes) => [
            'charge_type' => ChargeType::Percentage->value,
            'amount' => fake()->randomFloat(2, 1, 20),
        ]);
    }

    public function option(): static
    {
        return $this->state(fn (array $attributes) => [
            'scope' => ChargeScope::Option->value,
            'vehicle_id' => null,
            'category_id' => null,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
