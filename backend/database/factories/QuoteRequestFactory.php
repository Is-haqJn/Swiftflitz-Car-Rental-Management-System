<?php

namespace Database\Factories;

use App\Enums\QuoteRequestStatus;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuoteRequest>
 */
class QuoteRequestFactory extends Factory
{
    public function definition(): array
    {
        $pickupDate = now()->addDays(fake()->numberBetween(2, 14))->format('Y-m-d');
        $returnDate = now()->addDays(fake()->numberBetween(15, 30))->format('Y-m-d');

        return [
            'reference'           => 'QR-' . now()->format('Y') . '-' . strtoupper(Str::random(5)),
            'vehicle_id'          => null,
            'name'                => fake()->name(),
            'email'               => fake()->unique()->safeEmail(),
            'phone'               => fake()->numerify('+233#########'),
            'rental_days'         => fake()->numberBetween(1, 30),
            'pickup_date'         => $pickupDate,
            'return_date'         => $returnDate,
            'pickup_location_id'  => null,
            'message'             => fake()->optional()->sentence(),
            'status'              => QuoteRequestStatus::Pending->value,
            'admin_notes'         => null,
            'contacted_at'        => null,
            'quoted_at'           => null,
            'sent_at'             => null,
            'confirmed_at'        => null,
            'quote_token'         => null,
            'token_expires_at'    => null,
            'converted_rental_id' => null,
        ];
    }

    /** Quote has been contacted by admin. */
    public function contacted(): static
    {
        return $this->state(fn (array $attributes) => [
            'status'       => QuoteRequestStatus::Contacted->value,
            'contacted_at' => now(),
        ]);
    }

    /** Vehicle assigned; awaiting email send. */
    public function quoted(): static
    {
        return $this->state(fn (array $attributes) => [
            'vehicle_id' => Vehicle::factory(),
            'status'     => QuoteRequestStatus::Quoted->value,
            'quoted_at'  => now(),
        ]);
    }

    /** Confirmation email sent to customer (token active). */
    public function sent(): static
    {
        return $this->state(fn (array $attributes) => [
            'vehicle_id'       => $attributes['vehicle_id'] ?? Vehicle::factory(),
            'status'           => QuoteRequestStatus::Sent->value,
            'quoted_at'        => now()->subHour(),
            'sent_at'          => now(),
            'quote_token'      => bin2hex(random_bytes(32)),
            'token_expires_at' => now()->addHours(48),
        ]);
    }

    /** Customer confirmed → rental created. */
    public function converted(): static
    {
        return $this->state(fn (array $attributes) => [
            'status'       => QuoteRequestStatus::Converted->value,
            'confirmed_at' => now(),
        ]);
    }

    /** Customer or admin cancelled the quote. */
    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => QuoteRequestStatus::Cancelled->value,
        ]);
    }

    /** Token has already expired (useful for expiry tests). */
    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'vehicle_id'       => $attributes['vehicle_id'] ?? Vehicle::factory(),
            'status'           => QuoteRequestStatus::Sent->value,
            'quoted_at'        => now()->subDays(3),
            'sent_at'          => now()->subDays(3),
            'quote_token'      => bin2hex(random_bytes(32)),
            'token_expires_at' => now()->subDay(), // already in the past
        ]);
    }
}
