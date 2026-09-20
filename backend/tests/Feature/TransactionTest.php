<?php

use App\Enums\PaymentTransactionStatus;
use App\Enums\TransactionType;
use App\Models\AirportBooking;
use App\Models\Branch;
use App\Models\ChauffeurBooking;
use App\Models\PaymentTransaction;
use App\Models\Rental;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

/* Helpers */

function makeTransactionAdmin(): User
{
    Permission::firstOrCreate(['name' => 'transactions.view_all', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'transactions.export', 'guard_name' => 'web']);

    $admin = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $role->givePermissionTo(['transactions.view_all', 'transactions.export']);
    $admin->assignRole('admin');

    return $admin;
}

function makeTransactionSuperAdmin(): User
{
    $user = User::factory()->create();
    Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
    $user->assignRole('super_admin');

    return $user;
}

/* GET /api/v1/transactions */

it('super_admin can list all transactions', function () {
    $admin = makeTransactionSuperAdmin();
    PaymentTransaction::factory()->count(3)->create();

    $this->actingAs($admin)
        ->getJson('/api/v1/transactions')
        ->assertStatus(200)
        ->assertJsonPath('meta.total', 3);
});

it('admin with transactions.view_all can list transactions', function () {
    $admin = makeTransactionAdmin();
    PaymentTransaction::factory()->count(2)->create();

    $this->actingAs($admin)
        ->getJson('/api/v1/transactions')
        ->assertStatus(200)
        ->assertJsonPath('meta.total', 2);
});

it('user without transactions.view_all cannot list transactions', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/api/v1/transactions')
        ->assertStatus(403);
});

it('unauthenticated user cannot list transactions', function () {
    $this->getJson('/api/v1/transactions')
        ->assertStatus(401);
});

it('can filter transactions by status', function () {
    $admin = makeTransactionSuperAdmin();
    PaymentTransaction::factory()->paid()->count(2)->create();
    PaymentTransaction::factory()->count(3)->create(['status' => PaymentTransactionStatus::Pending->value]);

    $this->actingAs($admin)
        ->getJson('/api/v1/transactions?filter[status]=paid')
        ->assertStatus(200)
        ->assertJsonPath('meta.total', 2);
});

it('can filter transactions by type', function () {
    $admin = makeTransactionSuperAdmin();
    PaymentTransaction::factory()->count(2)->create(['type' => TransactionType::ManualPayment->value]);
    PaymentTransaction::factory()->count(1)->create(['type' => TransactionType::Refund->value]);

    $this->actingAs($admin)
        ->getJson('/api/v1/transactions?filter[type]=manual_payment')
        ->assertStatus(200)
        ->assertJsonPath('meta.total', 2);
});

it('can filter transactions by transactable_type', function () {
    $admin = makeTransactionSuperAdmin();
    $rental = Rental::factory()->create();
    PaymentTransaction::factory()->count(2)->create([
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
    ]);
    PaymentTransaction::factory()->count(1)->create(['transactable_type' => 'airport_booking']);

    $this->actingAs($admin)
        ->getJson('/api/v1/transactions?filter[transactable_type]=rental')
        ->assertStatus(200)
        ->assertJsonPath('meta.total', 2);
});

it('index response includes summary stats', function () {
    $admin = makeTransactionSuperAdmin();
    PaymentTransaction::factory()->paid()->count(2)->create(['amount' => 100]);
    PaymentTransaction::factory()->count(1)->create([
        'status' => PaymentTransactionStatus::Pending->value,
        'amount' => 50,
    ]);

    $response = $this->actingAs($admin)
        ->getJson('/api/v1/transactions')
        ->assertStatus(200);

    expect($response->json('stats'))->toHaveKeys(['total_paid', 'total_pending', 'total_refunded', 'count']);
    expect((float) $response->json('stats.total_paid'))->toBe(200.0);
});

/* GET /api/v1/transactions/{id} */

it('admin can view a transaction detail', function () {
    $admin = makeTransactionAdmin();
    $transaction = PaymentTransaction::factory()->create([
        'reference' => 'TXN-DETAIL-001',
        'type' => TransactionType::Payment->value,
    ]);

    $this->actingAs($admin)
        ->getJson("/api/v1/transactions/{$transaction->id}")
        ->assertStatus(200)
        ->assertJsonPath('data.reference', 'TXN-DETAIL-001')
        ->assertJsonPath('data.type', TransactionType::Payment->value)
        ->assertJsonStructure(['data' => ['id', 'reference', 'type', 'type_label', 'amount', 'currency', 'status', 'provider', 'payer']]);
});

it('user without permission cannot view transaction detail', function () {
    $user = User::factory()->create();
    $transaction = PaymentTransaction::factory()->create();

    $this->actingAs($user)
        ->getJson("/api/v1/transactions/{$transaction->id}")
        ->assertStatus(403);
});

it('returns 404 for non-existent transaction', function () {
    $admin = makeTransactionSuperAdmin();

    $this->actingAs($admin)
        ->getJson('/api/v1/transactions/00000000-0000-0000-0000-000000000099')
        ->assertStatus(404);
});

/* Transaction type labels */

it('type_label returns human-readable string without underscores', function () {
    $admin = makeTransactionSuperAdmin();
    $transaction = PaymentTransaction::factory()->create([
        'type' => TransactionType::CancellationFee->value,
    ]);

    $response = $this->actingAs($admin)
        ->getJson("/api/v1/transactions/{$transaction->id}")
        ->assertStatus(200);

    expect($response->json('data.type_label'))->toBe('Cancellation Fee');
});

it('manual payment type has correct label', function () {
    $admin = makeTransactionSuperAdmin();
    $transaction = PaymentTransaction::factory()->create([
        'type' => TransactionType::ManualPayment->value,
    ]);

    $response = $this->actingAs($admin)
        ->getJson("/api/v1/transactions/{$transaction->id}")
        ->assertStatus(200);

    expect($response->json('data.type_label'))->toBe('Manual Payment');
});

/* discount_amount field */

it('transaction stores discount_amount and discount_reason', function () {
    $admin = makeTransactionSuperAdmin();
    $transaction = PaymentTransaction::factory()->create([
        'type' => TransactionType::Payment->value,
        'discount_amount' => 25.00,
        'discount_reason' => 'Coupon SUMMER20',
    ]);

    $response = $this->actingAs($admin)
        ->getJson("/api/v1/transactions/{$transaction->id}")
        ->assertStatus(200);

    expect((float) $response->json('data.discount_amount'))->toBe(25.0)
        ->and($response->json('data.discount_reason'))->toBe('Coupon SUMMER20');
});

/* Manual payment creates transaction record */

it('recording a manual payment on a rental creates a PaymentTransaction', function () {
    $admin = makeTransactionAdmin();
    Permission::firstOrCreate(['name' => 'rentals.update_status', 'guard_name' => 'web']);
    $admin->givePermissionTo('rentals.update_status');

    $rental = Rental::factory()->confirmed()->create(['total_cost' => 200.00, 'amount_paid' => 0.00]);

    $this->actingAs($admin)
        ->postJson("/api/v1/rentals/{$rental->id}/settle", [
            'amount' => 200.00,
            'payment_method' => 'cash',
            'notes' => 'Cash paid at office',
        ])
        ->assertStatus(200);

    expect(
        PaymentTransaction::where('transactable_id', $rental->id)
            ->where('type', TransactionType::FullPayment->value)
            ->where('provider', 'manual')
            ->exists()
    )->toBeTrue();
});

it('recording a manual payment on an airport booking creates a PaymentTransaction', function () {
    $admin = makeTransactionAdmin();
    Permission::firstOrCreate(['name' => 'airport_transfer.manage_bookings', 'guard_name' => 'web']);
    $admin->givePermissionTo('airport_transfer.manage_bookings');

    $booking = AirportBooking::factory()->create(['total_amount' => 150.00]);

    $this->actingAs($admin)
        ->postJson("/api/v1/airport-bookings/{$booking->id}/payment", [
            'payment_method' => 'cash',
            'payment_reference' => 'CASH-001',
        ])
        ->assertStatus(200);

    expect(
        PaymentTransaction::where('transactable_id', $booking->id)
            ->where('type', TransactionType::ManualPayment->value)
            ->exists()
    )->toBeTrue();
});

it('recording a manual payment on a chauffeur booking creates a PaymentTransaction', function () {
    $admin = makeTransactionAdmin();
    Permission::firstOrCreate(['name' => 'chauffeur_rental.manage_bookings', 'guard_name' => 'web']);
    $admin->givePermissionTo('chauffeur_rental.manage_bookings');

    $booking = ChauffeurBooking::factory()->create(['total_amount' => 175.00]);

    $this->actingAs($admin)
        ->postJson("/api/v1/chauffeur-bookings/{$booking->id}/payment", [
            'payment_method' => 'bank_transfer',
        ])
        ->assertStatus(200);

    expect(
        PaymentTransaction::where('transactable_id', $booking->id)
            ->where('type', TransactionType::ManualPayment->value)
            ->exists()
    )->toBeTrue();
});

/* Channel and payment_phone fields */

it('transaction resource exposes channel and payment_phone fields', function () {
    $admin = makeTransactionSuperAdmin();
    $transaction = PaymentTransaction::factory()->create([
        'channel' => 'momo',
        'payment_phone' => '0244123456',
    ]);

    $response = $this->actingAs($admin)
        ->getJson("/api/v1/transactions/{$transaction->id}")
        ->assertStatus(200);

    expect($response->json('data.channel'))->toBe('momo')
        ->and($response->json('data.payment_phone'))->toBe('0244123456');
});

it('can filter transactions by channel', function () {
    $admin = makeTransactionSuperAdmin();
    PaymentTransaction::factory()->count(2)->create(['channel' => 'momo']);
    PaymentTransaction::factory()->count(1)->create(['channel' => 'card']);

    $this->actingAs($admin)
        ->getJson('/api/v1/transactions?filter[channel]=momo')
        ->assertStatus(200)
        ->assertJsonPath('meta.total', 2);
});

/* Branch-based filtering */

it('manager assigned to a branch only sees transactions for that branch', function () {
    Permission::firstOrCreate(['name' => 'transactions.view_all', 'guard_name' => 'web']);

    $manager = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'web']);
    $role->givePermissionTo('transactions.view_all');
    $manager->assignRole('manager');

    $branch = Branch::factory()->create();
    $otherBranch = Branch::factory()->create();
    $manager->branches()->attach($branch->id);

    $myRental = Rental::factory()->create(['branch_id' => $branch->id]);
    $otherRental = Rental::factory()->create(['branch_id' => $otherBranch->id]);

    PaymentTransaction::factory()->create([
        'transactable_type' => 'rental',
        'transactable_id' => $myRental->id,
    ]);
    PaymentTransaction::factory()->create([
        'transactable_type' => 'rental',
        'transactable_id' => $otherRental->id,
    ]);

    $this->actingAs($manager)
        ->getJson('/api/v1/transactions')
        ->assertStatus(200)
        ->assertJsonPath('meta.total', 1);
});

it('user with permission but no branch sees no transactions', function () {
    Permission::firstOrCreate(['name' => 'transactions.view_all', 'guard_name' => 'web']);

    $user = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'staff', 'guard_name' => 'web']);
    $role->givePermissionTo('transactions.view_all');
    $user->assignRole('staff');

    $rental = Rental::factory()->create();
    PaymentTransaction::factory()->count(3)->create([
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
    ]);

    $this->actingAs($user)
        ->getJson('/api/v1/transactions')
        ->assertStatus(200)
        ->assertJsonPath('meta.total', 0);
});

/* Channel recording on manual payments */

it('manual payment on rental records channel from payment_method', function () {
    $admin = makeTransactionAdmin();
    Permission::firstOrCreate(['name' => 'rentals.update_status', 'guard_name' => 'web']);
    $admin->givePermissionTo('rentals.update_status');

    $rental = Rental::factory()->confirmed()->create(['total_cost' => 100.00, 'amount_paid' => 0.00]);

    $this->actingAs($admin)
        ->postJson("/api/v1/rentals/{$rental->id}/settle", [
            'amount' => 100.00,
            'payment_method' => 'mobile_money',
            'payment_phone' => '0244123456',
            'notes' => 'Momo received',
        ])
        ->assertStatus(200);

    $tx = PaymentTransaction::where('transactable_id', $rental->id)
        ->where('type', TransactionType::FullPayment->value)
        ->first();

    expect($tx)->not->toBeNull()
        ->and($tx->channel)->toBe('momo')
        ->and($tx->payment_phone)->toBe('0244123456');
});

it('manual payment on airport booking records channel and payment_phone', function () {
    $admin = makeTransactionAdmin();
    Permission::firstOrCreate(['name' => 'airport_transfer.manage_bookings', 'guard_name' => 'web']);
    $admin->givePermissionTo('airport_transfer.manage_bookings');

    $booking = AirportBooking::factory()->create(['total_amount' => 150.00]);

    $this->actingAs($admin)
        ->postJson("/api/v1/airport-bookings/{$booking->id}/payment", [
            'payment_method' => 'cash',
        ])
        ->assertStatus(200);

    $tx = PaymentTransaction::where('transactable_id', $booking->id)->first();

    expect($tx)->not->toBeNull()
        ->and($tx->channel)->toBe('cash')
        ->and($tx->payment_phone)->toBeNull();
});

it('manual payment on chauffeur booking records bank_transfer channel', function () {
    $admin = makeTransactionAdmin();
    Permission::firstOrCreate(['name' => 'chauffeur_rental.manage_bookings', 'guard_name' => 'web']);
    $admin->givePermissionTo('chauffeur_rental.manage_bookings');

    $booking = ChauffeurBooking::factory()->create(['total_amount' => 175.00]);

    $this->actingAs($admin)
        ->postJson("/api/v1/chauffeur-bookings/{$booking->id}/payment", [
            'payment_method' => 'bank_transfer',
            'payment_phone' => '0201234567',
        ])
        ->assertStatus(200);

    $tx = PaymentTransaction::where('transactable_id', $booking->id)->first();

    expect($tx)->not->toBeNull()
        ->and($tx->channel)->toBe('bank_transfer')
        ->and($tx->payment_phone)->toBe('0201234567');
});

it('branch-restricted user stats (total_paid) only reflects their branch transactions', function () {
    Permission::firstOrCreate(['name' => 'transactions.view_all', 'guard_name' => 'web']);

    $manager = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'branch_manager', 'guard_name' => 'web']);
    $role->givePermissionTo('transactions.view_all');
    $manager->assignRole('branch_manager');

    $branch = Branch::factory()->create();
    $otherBranch = Branch::factory()->create();
    $manager->branches()->attach($branch->id);

    $myRental = Rental::factory()->create(['branch_id' => $branch->id]);
    $otherRental = Rental::factory()->create(['branch_id' => $otherBranch->id]);

    PaymentTransaction::factory()->paid()->create([
        'transactable_type' => 'rental',
        'transactable_id' => $myRental->id,
        'amount' => 200.0,
    ]);
    PaymentTransaction::factory()->paid()->create([
        'transactable_type' => 'rental',
        'transactable_id' => $otherRental->id,
        'amount' => 500.0,
    ]);

    $response = $this->actingAs($manager)
        ->getJson('/api/v1/transactions')
        ->assertStatus(200);

    expect((float) $response->json('stats.total_paid'))->toBe(200.0);
});

it('processing rental pickup with partial payment creates a PaymentTransaction', function () {
    $admin = makeTransactionAdmin();
    Permission::firstOrCreate(['name' => 'rentals.process_pickup', 'guard_name' => 'web']);
    $admin->givePermissionTo('rentals.process_pickup');

    $rental = Rental::factory()->confirmed()->create([
        'total_cost' => 300.00,
        'amount_paid' => 0.00,
    ]);

    $this->actingAs($admin)
        ->postJson("/api/v1/rentals/{$rental->id}/pickup", [
            'actual_pickup_date' => now()->toDateString(),
            'amount_paid' => 100.00,
            'payment_method' => 'cash',
        ])
        ->assertStatus(200);

    /* First ever payment on a rental uses InitialPayment type */
    expect(
        PaymentTransaction::where('transactable_id', $rental->id)
            ->where('type', TransactionType::InitialPayment->value)
            ->where('status', PaymentTransactionStatus::Paid->value)
            ->where('amount', 100.00)
            ->exists()
    )->toBeTrue();
});

it('processing rental return with additional payment creates a PaymentTransaction', function () {
    $admin = makeTransactionAdmin();
    Permission::firstOrCreate(['name' => 'rentals.mark_returned', 'guard_name' => 'web']);
    $admin->givePermissionTo('rentals.mark_returned');

    $rental = Rental::factory()->active()->create([
        'total_cost' => 300.00,
        'amount_paid' => 100.00,
    ]);

    $this->actingAs($admin)
        ->postJson("/api/v1/rentals/{$rental->id}/return", [
            'fuel_level' => 'full',
            'mileage' => 5000,
            'amount_paid' => 150.00,
            'payment_method' => 'mobile_money',
            'payment_phone' => '0244111222',
        ])
        ->assertStatus(200);

    expect(
        PaymentTransaction::where('transactable_id', $rental->id)
            ->where('type', TransactionType::PartPayment->value)
            ->where('status', PaymentTransactionStatus::Paid->value)
            ->where('amount', 150.00)
            ->exists()
    )->toBeTrue();
});

it('processing rental pickup without payment does not create a PaymentTransaction', function () {
    $admin = makeTransactionAdmin();
    Permission::firstOrCreate(['name' => 'rentals.process_pickup', 'guard_name' => 'web']);
    $admin->givePermissionTo('rentals.process_pickup');

    $rental = Rental::factory()->confirmed()->create([
        'total_cost' => 300.00,
        'amount_paid' => 0.00,
    ]);

    $this->actingAs($admin)
        ->postJson("/api/v1/rentals/{$rental->id}/pickup", [
            'actual_pickup_date' => now()->toDateString(),
        ])
        ->assertStatus(200);

    expect(
        PaymentTransaction::where('transactable_id', $rental->id)->exists()
    )->toBeFalse();
});

it('admin sees all transactions regardless of branch', function () {
    $admin = makeTransactionAdmin();

    $branch1 = Branch::factory()->create();
    $branch2 = Branch::factory()->create();

    $r1 = Rental::factory()->create(['branch_id' => $branch1->id]);
    $r2 = Rental::factory()->create(['branch_id' => $branch2->id]);

    PaymentTransaction::factory()->create(['transactable_type' => 'rental', 'transactable_id' => $r1->id]);
    PaymentTransaction::factory()->create(['transactable_type' => 'rental', 'transactable_id' => $r2->id]);

    $this->actingAs($admin)
        ->getJson('/api/v1/transactions')
        ->assertStatus(200)
        ->assertJsonPath('meta.total', 2);
});

/* Damage / Repair cost transaction recording */

it('settling damage as forfeited creates a DamageCharge transaction', function () {
    $admin = makeTransactionAdmin();
    Permission::firstOrCreate(['name' => 'rentals.update_status', 'guard_name' => 'web']);
    $admin->givePermissionTo('rentals.update_status');

    $rental = Rental::factory()->create([
        'has_damage' => true,
        'damage_settlement_status' => 'pending',
        'security_deposit_status' => 'held',
        'deposit_paid' => 500.00,
    ]);

    $this->actingAs($admin)
        ->postJson("/api/v1/rentals/{$rental->id}/settle-damage", [
            'outcome' => 'forfeited',
            'actual_repair_cost' => 300.00,
        ])
        ->assertStatus(200);

    expect(
        PaymentTransaction::where('transactable_id', $rental->id)
            ->where('type', TransactionType::DamageCharge->value)
            ->where('amount', 300.00)
            ->exists()
    )->toBeTrue();
});

it('settling damage as settled (paid directly) creates a DamageCharge transaction', function () {
    $admin = makeTransactionAdmin();
    Permission::firstOrCreate(['name' => 'rentals.update_status', 'guard_name' => 'web']);
    $admin->givePermissionTo('rentals.update_status');

    $rental = Rental::factory()->create([
        'has_damage' => true,
        'damage_settlement_status' => 'pending',
    ]);

    $this->actingAs($admin)
        ->postJson("/api/v1/rentals/{$rental->id}/settle-damage", [
            'outcome' => 'settled',
            'actual_repair_cost' => 150.00,
        ])
        ->assertStatus(200);

    expect(
        PaymentTransaction::where('transactable_id', $rental->id)
            ->where('type', TransactionType::DamageCharge->value)
            ->where('amount', 150.00)
            ->exists()
    )->toBeTrue();
});

it('recording repair cost creates a pending RepairCost transaction', function () {
    $admin = makeTransactionAdmin();
    Permission::firstOrCreate(['name' => 'rentals.update_status', 'guard_name' => 'web']);
    $admin->givePermissionTo('rentals.update_status');

    $rental = Rental::factory()->create([
        'has_damage' => true,
        'damage_settlement_status' => 'pending',
    ]);

    $this->actingAs($admin)
        ->patchJson("/api/v1/rentals/{$rental->id}/record-repair-cost", [
            'estimated_repair_cost' => 200.00,
        ])
        ->assertStatus(200);

    $tx = PaymentTransaction::where('transactable_id', $rental->id)
        ->where('type', TransactionType::RepairCost->value)
        ->where('amount', 200.00)
        ->first();

    expect($tx)->not->toBeNull();
    expect($tx->status)->toBe(PaymentTransactionStatus::Pending);
    expect($tx->paid_at)->toBeNull();
});

it('settling damage marks pending RepairCost transaction as paid with actual amount', function () {
    $admin = makeTransactionAdmin();
    Permission::firstOrCreate(['name' => 'rentals.update_status', 'guard_name' => 'web']);
    $admin->givePermissionTo('rentals.update_status');

    $rental = Rental::factory()->create([
        'has_damage' => true,
        'estimated_repair_cost' => 200.00,
        'damage_settlement_status' => 'pending',
    ]);

    /* Create the pending estimate transaction that recordRepairCost would have made */
    PaymentTransaction::factory()->create([
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'type' => TransactionType::RepairCost->value,
        'amount' => 200.00,
        'status' => 'pending',
        'paid_at' => null,
    ]);

    $this->actingAs($admin)
        ->postJson("/api/v1/rentals/{$rental->id}/settle-damage", [
            'outcome' => 'settled',
            'actual_repair_cost' => 250.00,
        ])
        ->assertStatus(200);

    $tx = PaymentTransaction::where('transactable_id', $rental->id)
        ->where('type', TransactionType::RepairCost->value)
        ->first();

    expect($tx->status)->toBe(PaymentTransactionStatus::Paid);
    expect((float) $tx->amount)->toBe(250.0);
    expect($tx->paid_at)->not->toBeNull();
});

it('collecting damage balance creates a DamageCharge transaction', function () {
    $admin = makeTransactionAdmin();
    Permission::firstOrCreate(['name' => 'rentals.update_status', 'guard_name' => 'web']);
    $admin->givePermissionTo('rentals.update_status');

    $rental = Rental::factory()->create([
        'has_damage' => true,
        'damage_balance_due' => 120.00,
        'damage_settlement_status' => 'forfeited',
    ]);

    $this->actingAs($admin)
        ->postJson("/api/v1/rentals/{$rental->id}/collect-damage-balance")
        ->assertStatus(200);

    expect(
        PaymentTransaction::where('transactable_id', $rental->id)
            ->where('type', TransactionType::DamageCharge->value)
            ->where('amount', 120.00)
            ->exists()
    )->toBeTrue();
});

/* Currency conversion in summaryStats */

it('summaryStats global scope converts multi-currency amounts to global unit before summing', function () {
    $admin = makeTransactionSuperAdmin();

    /* NGN branch: 1 NGN = 0.0082 GHS; transaction = ₦1000 -> 8.20 GHS equivalent */
    $ngnBranch = Branch::factory()->create([
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'exchange_rate' => 0.0082,
    ]);
    $ngnRental = Rental::factory()->create(['branch_id' => $ngnBranch->id]);

    /* GHS branch: exchange_rate = 1.0 (global currency); transaction = ₵200 -> 200 GHS */
    $ghsBranch = Branch::factory()->create([
        'currency' => 'GHS',
        'currency_symbol' => '₵',
        'exchange_rate' => 1.0,
    ]);
    $ghsRental = Rental::factory()->create(['branch_id' => $ghsBranch->id]);

    PaymentTransaction::factory()->paid()->create([
        'transactable_type' => 'rental',
        'transactable_id' => $ngnRental->id,
        'amount' => 1000.00,
        'exchange_rate' => 0.0082,
    ]);

    PaymentTransaction::factory()->paid()->create([
        'transactable_type' => 'rental',
        'transactable_id' => $ghsRental->id,
        'amount' => 200.00,
        'exchange_rate' => 1.0,
    ]);

    $response = $this->actingAs($admin)
        ->getJson('/api/v1/transactions')
        ->assertStatus(200);

    /* Expected: (1000 * 0.0082) + (200 * 1.0) = 8.20 + 200.00 = 208.20 GHS */
    expect(round((float) $response->json('stats.total_paid'), 2))->toBe(208.20);
});

/* PaymentTransactionResource - no live branch rate fallback */

it('transaction resource does not inherit branch exchange_rate when transaction has no stored rate', function () {
    $admin = makeTransactionSuperAdmin();

    $branch = Branch::factory()->create([
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'exchange_rate' => 0.0082,
    ]);
    $rental = Rental::factory()->create(['branch_id' => $branch->id]);

    /* Old transaction recorded before exchange_rate column was populated */
    $tx = PaymentTransaction::factory()->create([
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'exchange_rate' => null,
        'currency_symbol' => null,
    ]);

    $response = $this->actingAs($admin)
        ->getJson("/api/v1/transactions/{$tx->id}")
        ->assertStatus(200);

    /* Must be null - must not fall back to branch's current live rate */
    expect($response->json('data.exchange_rate'))->toBeNull();
    expect($response->json('data.currency_symbol'))->toBeNull();
});
