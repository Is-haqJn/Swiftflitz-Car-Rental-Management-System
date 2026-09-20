<?php

namespace Database\Seeders;

use App\Enums\CouponType;
use App\Models\DiscountCoupon;
use Illuminate\Database\Seeder;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\warning;

/**
 * Discount coupons seeder - covers multiple coupon scenarios for testing.
 *
 * Codes are lowercase for easy typing. Use these in CreateRental to verify pricing.
 *
 *   sf10001  - 10% off, first-time type, 10 max uses
 *   sf20002  - GHS 100 flat, min 7 days
 *   sf30003  - 15% off, min GHS 500 rental
 *   sf40004  - GHS 50 flat, flash sale (30-day expiry, 5 uses)
 *   sf50005  - 20% off, per-customer limit of 1 use (loyalty reward)
 *   sf60006  - GHS 75 flat, no restrictions (always valid, easy test)
 *   sfexpire - GHS 30 flat, ALREADY EXPIRED (tests expired coupon rejection)
 *   sfused   - GHS 100 flat, USED UP (max_uses = 1, used_count = 1)
 */
class DiscountCouponSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            warning('DiscountCouponSeeder seeds development data and is skipped in production by default.');
            if (! confirm('DiscountCouponSeeder - Run in production?', default: false)) {
                $this->command->warn('DiscountCouponSeeder skipped.');

                return;
            }
        }

        $coupons = [

            /* Standard coupons */
            [
                'code' => 'sf10001',
                'name' => 'Welcome Discount',
                'description' => '10% off your first rental - limited to 10 total uses.',
                'type' => CouponType::Percentage->value,
                'value' => 10.00,
                'max_uses' => 10,
                'is_active' => true,
                'is_auto_generated' => false,
            ],
            [
                'code' => 'sf20002',
                'name' => 'Long Stay Bonus',
                'description' => 'GHS 100 off any rental of 7 days or more.',
                'type' => CouponType::Fixed->value,
                'value' => 100.00,
                'min_rental_days' => 7,
                'is_active' => true,
                'is_auto_generated' => false,
            ],
            [
                'code' => 'sf30003',
                'name' => 'Premium Rental',
                'description' => '15% off rentals with a base cost of GHS 500 or more.',
                'type' => CouponType::Percentage->value,
                'value' => 15.00,
                'min_rental_amount' => 500.00,
                'is_active' => true,
                'is_auto_generated' => false,
            ],
            [
                'code' => 'sf40004',
                'name' => 'Flash Sale',
                'description' => 'GHS 50 off - valid for 30 days, 5 uses only.',
                'type' => CouponType::Fixed->value,
                'value' => 50.00,
                'expires_at' => now()->addDays(30),
                'max_uses' => 5,
                'is_active' => true,
                'is_auto_generated' => false,
            ],

            /* Per-customer limit */
            [
                'code' => 'sf50005',
                'name' => 'Loyalty Coupon',
                'description' => '20% off - each customer can use this only once.',
                'type' => CouponType::Percentage->value,
                'value' => 20.00,
                'max_uses_per_customer' => 1,
                'is_active' => true,
                'is_auto_generated' => false,
            ],

            /* No restrictions - quick test coupon */
            [
                'code' => 'sf60006',
                'name' => 'Open Promo',
                'description' => 'GHS 75 flat discount - no restrictions, use freely for testing.',
                'type' => CouponType::Fixed->value,
                'value' => 75.00,
                'is_active' => true,
                'is_auto_generated' => false,
            ],

            /* Edge case: EXPIRED */
            [
                'code' => 'sfexpire',
                'name' => 'Expired Promo',
                'description' => 'GHS 30 off - expired yesterday. Used to test expiry validation.',
                'type' => CouponType::Fixed->value,
                'value' => 30.00,
                'expires_at' => now()->subDay(),
                'is_active' => true,
                'is_auto_generated' => false,
            ],

            /* Edge case: USED UP */
            [
                'code' => 'sfused',
                'name' => 'Used Up Coupon',
                'description' => 'GHS 100 flat - max 1 use, already used. Tests used-up validation.',
                'type' => CouponType::Fixed->value,
                'value' => 100.00,
                'max_uses' => 1,
                'used_count' => 1,
                'is_active' => true,
                'is_auto_generated' => false,
            ],
        ];

        $seeded = 0;

        foreach ($coupons as $coupon) {
            if (! DiscountCoupon::where('code', $coupon['code'])->exists()) {
                DiscountCoupon::create($coupon);
                $seeded++;
            }
        }

        $skipped = count($coupons) - $seeded;
        $this->command->info("Seeded {$seeded} discount coupons (skipped {$skipped} existing).");
    }
}
