<?php

namespace Database\Seeders;

use App\Enums\DiscountConditionType;
use App\Enums\DiscountType;
use App\Models\Category;
use App\Models\DiscountRule;
use Illuminate\Database\Seeder;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\warning;

/**
 * Discount rules seeder - covers each condition_type variant for testing.
 *
 * condition_type values:
 *   none | rental_duration_days | days_before_pickup | booking_source
 *   customer_completed_rentals | base_amount | vehicle_id | category_id
 */
class DiscountRuleSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            warning('DiscountRuleSeeder seeds development data and is skipped in production by default.');
            if (! confirm('DiscountRuleSeeder - Run in production?', default: false)) {
                $this->command->warn('DiscountRuleSeeder skipped.');

                return;
            }
        }

        $economyId = Category::where('slug', 'economy')->value('id');
        $suvId = Category::where('slug', 'suv')->value('id');

        $rules = [

            /* Always-on / no condition */
            // (Good for testing that a rule fires on every rental)
            // Removed to keep the set focused; use coupons for unconditional discounts.

            /* Duration-based */
            [
                'name' => 'Weekly Stay Bonus',
                'description' => 'GHS 200 flat discount for rentals of 7 or more days.',
                'discount_type' => DiscountType::Flat->value,
                'discount_value' => 200.00,
                'condition_type' => DiscountConditionType::RentalDurationDays->value,
                'condition_value' => '7',
                'is_stackable' => true,
                'is_active' => true,
            ],

            /* Advance booking */
            [
                'name' => 'Early Booking Discount',
                'description' => '10% off when the rental is booked at least 7 days before pickup.',
                'discount_type' => DiscountType::Percentage->value,
                'discount_value' => 10.00,
                'condition_type' => DiscountConditionType::DaysBeforePickup->value,
                'condition_value' => '7',
                'is_stackable' => true,
                'is_active' => true,
            ],

            /* Booking source */
            [
                'name' => 'Walk-In Special',
                'description' => 'GHS 50 off for customers who walk in and book at the counter.',
                'discount_type' => DiscountType::Flat->value,
                'discount_value' => 50.00,
                'condition_type' => DiscountConditionType::BookingSource->value,
                'condition_value' => 'walk_in',
                'is_stackable' => false,
                'is_active' => true,
            ],

            /* Loyalty */
            [
                'name' => 'Loyalty Reward',
                'description' => '5% off for customers who have completed 3 or more rentals.',
                'discount_type' => DiscountType::Percentage->value,
                'discount_value' => 5.00,
                'condition_type' => DiscountConditionType::CustomerCompletedRentals->value,
                'condition_value' => '3',
                'is_stackable' => true,
                'is_active' => true,
            ],

            /* High-value booking */
            [
                'name' => 'High-Value Booking Reward',
                'description' => 'GHS 300 off when the base rental cost exceeds GHS 3,000.',
                'discount_type' => DiscountType::Flat->value,
                'discount_value' => 300.00,
                'condition_type' => DiscountConditionType::BaseAmount->value,
                'condition_value' => '3000',
                'is_stackable' => false,
                'is_active' => true,
            ],

            /* Category-specific */
            [
                'name' => 'Economy Budget Deal',
                'description' => '8% off all Economy category vehicles - great for budget travellers.',
                'discount_type' => DiscountType::Percentage->value,
                'discount_value' => 8.00,
                'condition_type' => DiscountConditionType::CategoryId->value,
                'condition_value' => $economyId,
                'is_stackable' => true,
                'is_active' => true,
            ],
            [
                'name' => 'SUV Weekend Promo',
                'description' => 'GHS 150 off SUV rentals. Stackable with loyalty and early booking.',
                'discount_type' => DiscountType::Flat->value,
                'discount_value' => 150.00,
                'condition_type' => DiscountConditionType::CategoryId->value,
                'condition_value' => $suvId,
                'is_stackable' => true,
                'is_active' => true,
            ],
        ];

        $seeded = 0;

        foreach ($rules as $rule) {
            // Skip category rules if category doesn't exist yet
            if ($rule['condition_type'] === DiscountConditionType::CategoryId->value
                && ! $rule['condition_value']) {
                continue;
            }

            if (! DiscountRule::where('name', $rule['name'])->exists()) {
                DiscountRule::create($rule);
                $seeded++;
            }
        }

        $skipped = count($rules) - $seeded;
        $this->command->info("Seeded {$seeded} discount rules (skipped {$skipped} existing).");
    }
}
