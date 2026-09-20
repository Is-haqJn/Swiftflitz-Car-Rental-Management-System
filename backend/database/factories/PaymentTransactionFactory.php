<?php

namespace Database\Factories;

use App\Enums\PaymentTransactionStatus;
use App\Enums\TransactionType;
use App\Models\PaymentTransaction;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<PaymentTransaction>
 */
class PaymentTransactionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'reference' => 'TXN-' . strtoupper(Str::random(10)),
            'provider' => fake()->randomElement(['paystack', 'stripe', 'hubtel']),
            'channel' => fake()->randomElement(['card', 'momo', null]),
            'payment_phone' => null,
            'amount' => fake()->randomFloat(2, 10, 5000),
            'currency' => 'GHS',
            'status' => PaymentTransactionStatus::Pending->value,
            'type' => TransactionType::Payment->value,
            'description' => null,
            'discount_amount' => null,
            'discount_reason' => null,
            'coupon_usage_id' => null,
            'discount_rule_usage_id' => null,
            'processed_by_user_id' => null,
            'paid_at' => null,
            'payer_email' => fake()->safeEmail(),
            'payer_phone' => fake()->numerify('02########'),
            'payer_name' => fake()->name(),
            'metadata' => null,
        ];
    }

    public function paid(): static
    {
        return $this->state([
            'status' => PaymentTransactionStatus::Paid->value,
            'paid_at' => now(),
        ]);
    }

    public function failed(): static
    {
        return $this->state(['status' => PaymentTransactionStatus::Failed->value]);
    }

    public function manual(): static
    {
        return $this->state([
            'type' => TransactionType::ManualPayment->value,
            'provider' => 'manual',
        ]);
    }

    public function forProvider(string $provider): static
    {
        return $this->state(['provider' => $provider]);
    }
}
