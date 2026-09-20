<?php

use App\Enums\DiscountConditionType;
use App\Enums\DiscountType;
use App\Enums\RentalStatus;
use App\Models\AdditionalCharge;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\DiscountCoupon;
use App\Models\DiscountRule;
use App\Models\QuoteRequest;
use App\Models\Rental;
use App\Models\RentalLocation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

/* Helpers */
/**
 * Create permissions (if missing) and grant them to a user.
 *
 * @param  string[]  $names
 */
function grantPerms(User $user, array $names): void
{
    foreach ($names as $name) {
        Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
    }
    $user->givePermissionTo($names);
}

function freshUser(): User
{
    return User::factory()->create();
}

function newCouponPayload(): array
{
    return [
        'coupon_type' => 'standard',
        'name' => 'Test Coupon',
        'type' => 'fixed',
        'value' => 10,
    ];
}

function newDiscountRulePayload(?string $branchId = null): array
{
    return [
        'branch_id' => $branchId,
        'name' => 'Test Rule',
        'discount_type' => DiscountType::Flat->value,
        'discount_value' => 15,
        'condition_type' => DiscountConditionType::None->value,
        'condition_value' => null,
    ];
}

function newAdditionalChargePayload(?string $branchId = null): array
{
    return [
        'branch_id' => $branchId,
        'name' => 'Test Charge',
        'scope' => 'global',
        'charge_type' => 'flat',
        'amount' => 25,
    ];
}

function newRentalLocationPayload(string $branchId): array
{
    return [
        'branch_id' => $branchId,
        'name' => 'Test Location',
    ];
}

// ══════════════════════════════════════════════════════════════════════════════
// COUPON POLICY
// ══════════════════════════════════════════════════════════════════════════════

describe('CouponPolicy', function () {
    describe('viewAny', function () {
        it('allows user with coupons.view_all', function () {
            $user = freshUser();
            grantPerms($user, ['coupons.view_all']);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/v1/coupons')
                ->assertOk();
        });

        it('denies user with no coupon permissions', function () {
            $this->actingAs(freshUser(), 'sanctum')
                ->getJson('/api/v1/coupons')
                ->assertForbidden();
        });

        it('super_admin bypasses policy', function () {
            $sa = freshUser();
            $sa->assignRole(Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']));

            $this->actingAs($sa, 'sanctum')
                ->getJson('/api/v1/coupons')
                ->assertOk();
        });
    });

    describe('create', function () {
        it('allows user with coupons.create', function () {
            $user = freshUser();
            grantPerms($user, ['coupons.create']);

            $this->actingAs($user, 'sanctum')
                ->postJson('/api/v1/coupons', newCouponPayload())
                ->assertCreated();
        });

        it('denies user with only coupons.view_all', function () {
            $user = freshUser();
            grantPerms($user, ['coupons.view_all']);

            $this->actingAs($user, 'sanctum')
                ->postJson('/api/v1/coupons', newCouponPayload())
                ->assertForbidden();
        });
    });

    describe('update', function () {
        it('allows user with coupons.edit', function () {
            $user = freshUser();
            grantPerms($user, ['coupons.view_all', 'coupons.edit']);
            $coupon = DiscountCoupon::factory()->create();

            $this->actingAs($user, 'sanctum')
                ->putJson("/api/v1/coupons/{$coupon->id}", newCouponPayload())
                ->assertOk();
        });

        it('denies user with only coupons.view_all', function () {
            $user = freshUser();
            grantPerms($user, ['coupons.view_all']);
            $coupon = DiscountCoupon::factory()->create();

            $this->actingAs($user, 'sanctum')
                ->putJson("/api/v1/coupons/{$coupon->id}", newCouponPayload())
                ->assertForbidden();
        });
    });

    describe('delete', function () {
        it('allows user with coupons.delete', function () {
            $user = freshUser();
            grantPerms($user, ['coupons.delete']);
            $coupon = DiscountCoupon::factory()->create();

            $this->actingAs($user, 'sanctum')
                ->deleteJson("/api/v1/coupons/{$coupon->id}")
                ->assertNoContent();
        });

        it('denies user with only coupons.edit', function () {
            $user = freshUser();
            grantPerms($user, ['coupons.edit']);
            $coupon = DiscountCoupon::factory()->create();

            $this->actingAs($user, 'sanctum')
                ->deleteJson("/api/v1/coupons/{$coupon->id}")
                ->assertForbidden();
        });
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// DISCOUNT RULE POLICY
// ══════════════════════════════════════════════════════════════════════════════

describe('DiscountRulePolicy', function () {
    describe('viewAny', function () {
        it('allows user with discounts.view_all', function () {
            $user = freshUser();
            grantPerms($user, ['discounts.view_all']);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/v1/discount-rules')
                ->assertOk();
        });

        it('denies user with no discount permissions', function () {
            $this->actingAs(freshUser(), 'sanctum')
                ->getJson('/api/v1/discount-rules')
                ->assertForbidden();
        });
    });

    describe('create', function () {
        it('allows user with discounts.create', function () {
            $user = freshUser();
            grantPerms($user, ['discounts.create']);
            $branch = Branch::factory()->create();

            $this->actingAs($user, 'sanctum')
                ->postJson('/api/v1/discount-rules', newDiscountRulePayload($branch->id))
                ->assertCreated();
        });

        it('denies user with only discounts.view_all', function () {
            $user = freshUser();
            grantPerms($user, ['discounts.view_all']);
            $branch = Branch::factory()->create();

            $this->actingAs($user, 'sanctum')
                ->postJson('/api/v1/discount-rules', newDiscountRulePayload($branch->id))
                ->assertForbidden();
        });
    });

    describe('update - branch-scoped', function () {
        it('allows global user (no branches) with discounts.edit to update org-wide rule', function () {
            /* Admin-level user: has the permission and no branch restrictions */
            $user = freshUser();
            grantPerms($user, ['discounts.view_all', 'discounts.edit']);

            $globalRule = DiscountRule::create(array_merge(
                newDiscountRulePayload(null),
                ['branch_id' => null]
            ));

            $this->actingAs($user, 'sanctum')
                ->putJson("/api/v1/discount-rules/{$globalRule->id}", newDiscountRulePayload(null))
                ->assertOk();
        });

        it('denies branch-restricted user from editing org-wide rule', function () {
            /* Manager-level user: has permission but is assigned to a branch */
            $user = freshUser();
            $branch = Branch::factory()->create();
            $user->branches()->attach($branch->id);
            grantPerms($user, ['discounts.view_all', 'discounts.edit']);

            $globalRule = DiscountRule::create(array_merge(
                newDiscountRulePayload(null),
                ['branch_id' => null]
            ));

            $this->actingAs($user, 'sanctum')
                ->putJson("/api/v1/discount-rules/{$globalRule->id}", newDiscountRulePayload(null))
                ->assertForbidden();
        });

        it('allows branch-restricted user with discounts.edit to edit their own branch rule', function () {
            $user = freshUser();
            $branch = Branch::factory()->create();
            $user->branches()->attach($branch->id);
            grantPerms($user, ['discounts.view_all', 'discounts.edit']);

            $branchRule = DiscountRule::create(array_merge(
                newDiscountRulePayload($branch->id),
                ['branch_id' => $branch->id]
            ));

            $this->actingAs($user, 'sanctum')
                ->putJson("/api/v1/discount-rules/{$branchRule->id}", newDiscountRulePayload($branch->id))
                ->assertOk();
        });

        it('denies user from editing a different branch rule', function () {
            $user = freshUser();
            $myBranch = Branch::factory()->create();
            $otherBranch = Branch::factory()->create();
            $user->branches()->attach($myBranch->id);
            grantPerms($user, ['discounts.view_all', 'discounts.edit']);

            $otherRule = DiscountRule::create(array_merge(
                newDiscountRulePayload($otherBranch->id),
                ['branch_id' => $otherBranch->id]
            ));

            $this->actingAs($user, 'sanctum')
                ->putJson("/api/v1/discount-rules/{$otherRule->id}", newDiscountRulePayload($otherBranch->id))
                ->assertForbidden();
        });
    });

    describe('delete', function () {
        it('allows global user with discounts.delete to delete org-wide rule', function () {
            $user = freshUser();
            grantPerms($user, ['discounts.view_all', 'discounts.delete']);

            $globalRule = DiscountRule::create(array_merge(
                newDiscountRulePayload(null),
                ['branch_id' => null]
            ));

            $this->actingAs($user, 'sanctum')
                ->deleteJson("/api/v1/discount-rules/{$globalRule->id}")
                ->assertNoContent();
        });

        it('denies branch-restricted user from deleting org-wide rule', function () {
            $user = freshUser();
            $branch = Branch::factory()->create();
            $user->branches()->attach($branch->id);
            grantPerms($user, ['discounts.view_all', 'discounts.delete']);

            $globalRule = DiscountRule::create(array_merge(
                newDiscountRulePayload(null),
                ['branch_id' => null]
            ));

            $this->actingAs($user, 'sanctum')
                ->deleteJson("/api/v1/discount-rules/{$globalRule->id}")
                ->assertForbidden();
        });
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADDITIONAL CHARGE POLICY
// ══════════════════════════════════════════════════════════════════════════════

describe('AdditionalChargePolicy', function () {
    describe('viewAny', function () {
        it('allows user with rentals.manage_additional_charges', function () {
            $user = freshUser();
            grantPerms($user, ['rentals.manage_additional_charges']);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/v1/additional-charges')
                ->assertOk();
        });

        it('allows user with rentals.view_all (read-only access)', function () {
            $user = freshUser();
            grantPerms($user, ['rentals.view_all']);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/v1/additional-charges')
                ->assertOk();
        });

        it('denies user with no relevant permissions', function () {
            $this->actingAs(freshUser(), 'sanctum')
                ->getJson('/api/v1/additional-charges')
                ->assertForbidden();
        });
    });

    describe('create', function () {
        it('allows user with rentals.manage_additional_charges', function () {
            $user = freshUser();
            grantPerms($user, ['rentals.manage_additional_charges']);

            $this->actingAs($user, 'sanctum')
                ->postJson('/api/v1/additional-charges', newAdditionalChargePayload())
                ->assertCreated();
        });

        it('denies user with only rentals.view_all', function () {
            $user = freshUser();
            grantPerms($user, ['rentals.view_all']);

            $this->actingAs($user, 'sanctum')
                ->postJson('/api/v1/additional-charges', newAdditionalChargePayload())
                ->assertForbidden();
        });
    });

    describe('update - branch-scoped', function () {
        it('allows global user with manage_additional_charges to update org-wide charge', function () {
            $user = freshUser();
            grantPerms($user, ['rentals.manage_additional_charges']);

            $globalCharge = AdditionalCharge::factory()->create(['branch_id' => null]);

            $this->actingAs($user, 'sanctum')
                ->putJson("/api/v1/additional-charges/{$globalCharge->id}", newAdditionalChargePayload())
                ->assertOk();
        });

        it('denies branch-restricted user from updating org-wide charge', function () {
            $user = freshUser();
            $branch = Branch::factory()->create();
            $user->branches()->attach($branch->id);
            grantPerms($user, ['rentals.manage_additional_charges']);

            $globalCharge = AdditionalCharge::factory()->create(['branch_id' => null]);

            $this->actingAs($user, 'sanctum')
                ->putJson("/api/v1/additional-charges/{$globalCharge->id}", newAdditionalChargePayload())
                ->assertForbidden();
        });

        it('allows branch-restricted user to update their own branch charge', function () {
            $user = freshUser();
            $branch = Branch::factory()->create();
            $user->branches()->attach($branch->id);
            grantPerms($user, ['rentals.manage_additional_charges']);

            $branchCharge = AdditionalCharge::factory()->create(['branch_id' => $branch->id]);

            $this->actingAs($user, 'sanctum')
                ->putJson("/api/v1/additional-charges/{$branchCharge->id}", newAdditionalChargePayload())
                ->assertOk();
        });
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// QUOTE REQUEST POLICY
// ══════════════════════════════════════════════════════════════════════════════

describe('QuoteRequestPolicy', function () {
    describe('viewAny', function () {
        it('allows user with rentals.view_quotes', function () {
            $user = freshUser();
            grantPerms($user, ['rentals.view_quotes']);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/v1/quote-requests')
                ->assertOk();
        });

        it('denies user with no quote permissions', function () {
            $this->actingAs(freshUser(), 'sanctum')
                ->getJson('/api/v1/quote-requests')
                ->assertForbidden();
        });
    });

    describe('delete', function () {
        it('allows user with rentals.manage_quotes', function () {
            $user = freshUser();
            grantPerms($user, ['rentals.manage_quotes']);
            $quote = QuoteRequest::factory()->create();

            $this->actingAs($user, 'sanctum')
                ->deleteJson("/api/v1/quote-requests/{$quote->id}")
                ->assertNoContent();
        });

        it('denies user with only rentals.view_quotes', function () {
            $user = freshUser();
            grantPerms($user, ['rentals.view_quotes']);
            $quote = QuoteRequest::factory()->create();

            $this->actingAs($user, 'sanctum')
                ->deleteJson("/api/v1/quote-requests/{$quote->id}")
                ->assertForbidden();
        });
    });

    describe('convert', function () {
        it('allows user with rentals.manage_quotes to convert a quoted request', function () {
            $user = freshUser();
            grantPerms($user, ['rentals.manage_quotes']);
            $customer = Customer::factory()->create();
            $quote = QuoteRequest::factory()->quoted()->create();

            $this->actingAs($user, 'sanctum')
                ->patchJson("/api/v1/quote-requests/{$quote->id}/convert", [
                    'customer_id' => $customer->id,
                ])
                ->assertOk();
        });

        it('denies user with only view_quotes from converting', function () {
            $user = freshUser();
            grantPerms($user, ['rentals.view_quotes']);
            $customer = Customer::factory()->create();
            $quote = QuoteRequest::factory()->quoted()->create();

            /* Provide valid payload so form validation passes and the policy check is reached. */
            $this->actingAs($user, 'sanctum')
                ->patchJson("/api/v1/quote-requests/{$quote->id}/convert", [
                    'customer_id' => $customer->id,
                ])
                ->assertForbidden();
        });
    });

    describe('super_admin bypass', function () {
        it('super_admin can view quotes without explicit permission', function () {
            $sa = freshUser();
            $sa->assignRole(Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']));

            $this->actingAs($sa, 'sanctum')
                ->getJson('/api/v1/quote-requests')
                ->assertOk();
        });
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// RENTAL LOCATION POLICY
// ══════════════════════════════════════════════════════════════════════════════

describe('RentalLocationPolicy', function () {
    describe('viewAny', function () {
        it('allows user with rentals.manage_locations', function () {
            $user = freshUser();
            grantPerms($user, ['rentals.manage_locations']);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/v1/rental-locations')
                ->assertOk();
        });

        it('allows user with rentals.view_all', function () {
            $user = freshUser();
            grantPerms($user, ['rentals.view_all']);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/v1/rental-locations')
                ->assertOk();
        });

        it('denies user with no relevant permissions', function () {
            $this->actingAs(freshUser(), 'sanctum')
                ->getJson('/api/v1/rental-locations')
                ->assertForbidden();
        });
    });

    describe('create', function () {
        it('allows user with rentals.manage_locations', function () {
            $user = freshUser();
            $branch = Branch::factory()->create();
            grantPerms($user, ['rentals.manage_locations']);

            $this->actingAs($user, 'sanctum')
                ->postJson('/api/v1/rental-locations', newRentalLocationPayload($branch->id))
                ->assertCreated();
        });

        it('denies user with only rentals.view_all', function () {
            $user = freshUser();
            $branch = Branch::factory()->create();
            grantPerms($user, ['rentals.view_all']);

            $this->actingAs($user, 'sanctum')
                ->postJson('/api/v1/rental-locations', newRentalLocationPayload($branch->id))
                ->assertForbidden();
        });
    });

    describe('update - branch-scoped', function () {
        it('allows global user to update a rental location in any branch', function () {
            $user = freshUser();
            $branch = Branch::factory()->create();
            grantPerms($user, ['rentals.manage_locations']);

            $location = RentalLocation::factory()->create(['branch_id' => $branch->id]);

            $this->actingAs($user, 'sanctum')
                ->putJson("/api/v1/rental-locations/{$location->id}", newRentalLocationPayload($branch->id))
                ->assertOk();
        });

        it('allows branch-restricted user to update their own branch location', function () {
            $user = freshUser();
            $branch = Branch::factory()->create();
            $user->branches()->attach($branch->id);
            grantPerms($user, ['rentals.manage_locations']);

            $location = RentalLocation::factory()->create(['branch_id' => $branch->id]);

            $this->actingAs($user, 'sanctum')
                ->putJson("/api/v1/rental-locations/{$location->id}", newRentalLocationPayload($branch->id))
                ->assertOk();
        });

        it('denies branch-restricted user from updating another branch location', function () {
            $user = freshUser();
            $myBranch = Branch::factory()->create();
            $otherBranch = Branch::factory()->create();
            $user->branches()->attach($myBranch->id);
            grantPerms($user, ['rentals.manage_locations']);

            $location = RentalLocation::factory()->create(['branch_id' => $otherBranch->id]);

            $this->actingAs($user, 'sanctum')
                ->putJson("/api/v1/rental-locations/{$location->id}", newRentalLocationPayload($otherBranch->id))
                ->assertForbidden();
        });
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// RENTAL POLICY
// ══════════════════════════════════════════════════════════════════════════════

describe('RentalPolicy', function () {
    describe('viewAny', function () {
        it('allows user with rentals.view_all', function () {
            $user = freshUser();
            grantPerms($user, ['rentals.view_all']);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/v1/rentals')
                ->assertOk();
        });

        it('allows user with rentals.view_own', function () {
            $user = freshUser();
            grantPerms($user, ['rentals.view_own']);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/v1/rentals')
                ->assertOk();
        });

        it('denies user with no rental permissions', function () {
            $this->actingAs(freshUser(), 'sanctum')
                ->getJson('/api/v1/rentals')
                ->assertForbidden();
        });
    });

    describe('delete', function () {
        it('allows user with rentals.delete', function () {
            $user = freshUser();
            grantPerms($user, ['rentals.delete']);
            $rental = Rental::factory()->create();

            $this->actingAs($user, 'sanctum')
                ->deleteJson("/api/v1/rentals/{$rental->id}")
                ->assertNoContent();
        });

        it('denies user with only rentals.edit (no delete permission)', function () {
            $user = freshUser();
            grantPerms($user, ['rentals.edit']);
            $rental = Rental::factory()->create();

            $this->actingAs($user, 'sanctum')
                ->deleteJson("/api/v1/rentals/{$rental->id}")
                ->assertForbidden();
        });
    });

    describe('processPickup', function () {
        it('allows user with rentals.process_pickup', function () {
            $user = freshUser();
            grantPerms($user, ['rentals.view_all', 'rentals.process_pickup']);
            $rental = Rental::factory()->create(['status' => RentalStatus::Confirmed->value]);

            $this->actingAs($user, 'sanctum')
                ->postJson("/api/v1/rentals/{$rental->id}/pickup", [
                    'odometer_reading' => 10000,
                    'fuel_level' => 'full',
                ])
                ->assertOk();
        });

        it('denies user without rentals.process_pickup', function () {
            $user = freshUser();
            grantPerms($user, ['rentals.view_all', 'rentals.edit']);
            $rental = Rental::factory()->create(['status' => RentalStatus::Confirmed->value]);

            $this->actingAs($user, 'sanctum')
                ->postJson("/api/v1/rentals/{$rental->id}/pickup", [
                    'odometer_reading' => 10000,
                    'fuel_level' => 'full',
                ])
                ->assertForbidden();
        });
    });

    describe('cancel', function () {
        it('allows user with rentals.update_status to cancel a rental', function () {
            $user = freshUser();
            grantPerms($user, ['rentals.view_all', 'rentals.update_status']);
            $rental = Rental::factory()->create(['status' => RentalStatus::Pending->value]);

            $this->actingAs($user, 'sanctum')
                ->postJson("/api/v1/rentals/{$rental->id}/cancel")
                ->assertOk();
        });

        it('denies user without rentals.update_status from cancelling', function () {
            $user = freshUser();
            grantPerms($user, ['rentals.view_all']);
            $rental = Rental::factory()->create(['status' => RentalStatus::Pending->value]);

            $this->actingAs($user, 'sanctum')
                ->postJson("/api/v1/rentals/{$rental->id}/cancel")
                ->assertForbidden();
        });
    });

    describe('approveReturn', function () {
        it('allows user with rentals.approve_return', function () {
            $user = freshUser();
            grantPerms($user, ['rentals.view_all', 'rentals.approve_return']);
            $rental = Rental::factory()->create(['status' => RentalStatus::Returned->value]);

            $this->actingAs($user, 'sanctum')
                ->postJson("/api/v1/rentals/{$rental->id}/approve-return")
                ->assertOk();
        });

        it('denies user without rentals.approve_return', function () {
            $user = freshUser();
            grantPerms($user, ['rentals.view_all', 'rentals.mark_returned']);
            $rental = Rental::factory()->create(['status' => RentalStatus::Returned->value]);

            $this->actingAs($user, 'sanctum')
                ->postJson("/api/v1/rentals/{$rental->id}/approve-return")
                ->assertForbidden();
        });
    });
});
