<?php

namespace Database\Factories;

use App\Enums\ExportStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ExportRecord>
 */
class ExportRecordFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $format = fake()->randomElement(['xlsx', 'pdf', 'csv']);

        return [
            'user_id' => User::factory(),
            'type' => fake()->randomElement(['rentals', 'customers', 'vehicles']),
            'format' => $format,
            'status' => ExportStatus::Pending,
            'filename' => null,
            'file_path' => null,
            'file_size' => null,
            'filters' => null,
            'expires_at' => null,
        ];
    }

    /**
     * Mark the export as ready with a file.
     */
    public function ready(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ExportStatus::Ready,
            'filename' => fake()->word() . '.' . $attributes['format'],
            'file_path' => 'exports/' . fake()->uuid() . '.' . $attributes['format'],
            'file_size' => fake()->numberBetween(1024, 1048576),
            'expires_at' => now()->addDay(),
        ]);
    }
}
