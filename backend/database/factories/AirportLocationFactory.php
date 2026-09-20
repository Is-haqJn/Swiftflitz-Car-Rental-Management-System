<?php

namespace Database\Factories;

use App\Enums\AirportLocationType;
use App\Models\Airport;
use App\Models\AirportLocation;
use App\Models\Branch;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AirportLocation>
 */
class AirportLocationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'location_type' => AirportLocationType::Terminal,
            'airport_id' => Airport::factory(),
            'branch_id' => null,
            'name' => fake()->city() . ' Terminal ' . fake()->randomElement(['1', '2', '3', 'International', 'Domestic']),
            'has_charge' => false,
            'charge_amount' => null,
            'is_active' => true,
        ];
    }

    public function terminal(?Airport $airport = null): static
    {
        return $this->state(fn (array $attributes) => [
            'location_type' => AirportLocationType::Terminal,
            'airport_id' => $airport?->id ?? Airport::factory(),
            'branch_id' => null,
            'has_charge' => false,
            'charge_amount' => null,
        ]);
    }

    public function area(?Branch $branch = null): static
    {
        return $this->state(fn (array $attributes) => [
            'location_type' => AirportLocationType::Area,
            'airport_id' => null,
            'branch_id' => $branch?->id ?? Branch::factory(),
            'name' => fake()->city() . ' ' . fake()->randomElement(['Zone', 'Estate', 'Area', 'District']),
        ]);
    }

    public function withCharge(float $amount = 20.00): static
    {
        return $this->state(fn (array $attributes) => [
            'has_charge' => true,
            'charge_amount' => $amount,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
