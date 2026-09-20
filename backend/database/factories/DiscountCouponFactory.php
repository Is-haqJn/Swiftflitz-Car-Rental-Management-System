<?php

namespace Database\Factories;

use App\Enums\CouponType;
use App\Models\DiscountCoupon;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DiscountCoupon>
 */
class DiscountCouponFactory extends Factory
{
    protected $model = DiscountCoupon::class;

    public function definition(): array
    {
        return [
            'code' => 'SF' . strtoupper(Str::random(6)),
            'name' => fake()->words(3, true),
            'description' => fake()->optional()->sentence(),
            'type' => fake()->randomElement(CouponType::list()),
            'value' => fake()->randomFloat(2, 5, 30),
            'expires_at' => null,
            'max_uses' => null,
            'used_count' => 0,
            'min_rental_days' => null,
            'min_rental_amount' => null,
            'is_active' => true,
            'created_by' => null,
        ];
    }

    public function percentage(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => CouponType::Percentage->value,
            'value' => fake()->randomFloat(2, 5, 30),
        ]);
    }

    public function fixed(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => CouponType::Fixed->value,
            'value' => fake()->randomFloat(2, 20, 200),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'expires_at' => now()->subDays(1),
        ]);
    }

    public function withMinRentalDays(int $days = 7): static
    {
        return $this->state(fn (array $attributes) => [
            'min_rental_days' => $days,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
