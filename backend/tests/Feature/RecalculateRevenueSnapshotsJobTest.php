<?php

use App\Enums\TransactionType;
use App\Jobs\RecalculateRevenueSnapshotsJob;
use App\Models\PaymentTransaction;
use App\Models\RevenueSnapshot;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('creates daily snapshots from paid transactions', function () {
    PaymentTransaction::factory()->paid()->create([
        'amount' => 500.00,
        'paid_at' => now()->startOfDay(),
    ]);
    PaymentTransaction::factory()->paid()->create([
        'amount' => 300.00,
        'paid_at' => now()->startOfDay(),
    ]);

    (new RecalculateRevenueSnapshotsJob)->handle();

    $snapshot = RevenueSnapshot::query()
        ->where('period_type', 'daily')
        ->where('period_key', now()->format('Y-m-d'))
        ->first();

    expect($snapshot)->not->toBeNull()
        ->and((float) $snapshot->revenue)->toBe(800.0)
        ->and($snapshot->transaction_count)->toBe(2);
});

it('creates weekly snapshots grouped by week start', function () {
    $monday = now()->startOfWeek();

    PaymentTransaction::factory()->paid()->create([
        'amount' => 1200.00,
        'paid_at' => $monday,
    ]);
    PaymentTransaction::factory()->paid()->create([
        'amount' => 800.00,
        'paid_at' => $monday->copy()->addDays(3),
    ]);

    (new RecalculateRevenueSnapshotsJob)->handle();

    $snapshot = RevenueSnapshot::query()
        ->where('period_type', 'weekly')
        ->where('period_key', $monday->format('Y-m-d'))
        ->first();

    expect($snapshot)->not->toBeNull()
        ->and((float) $snapshot->revenue)->toBe(2000.0)
        ->and($snapshot->transaction_count)->toBe(2);
});

it('creates monthly and yearly snapshots', function () {
    PaymentTransaction::factory()->paid()->create([
        'amount' => 2500.00,
        'paid_at' => now(),
    ]);

    (new RecalculateRevenueSnapshotsJob)->handle();

    $monthly = RevenueSnapshot::query()
        ->where('period_type', 'monthly')
        ->where('period_key', now()->format('Y-m'))
        ->first();

    $yearly = RevenueSnapshot::query()
        ->where('period_type', 'yearly')
        ->where('period_key', now()->format('Y'))
        ->first();

    expect($monthly)->not->toBeNull()
        ->and((float) $monthly->revenue)->toBe(2500.0)
        ->and($yearly)->not->toBeNull()
        ->and((float) $yearly->revenue)->toBe(2500.0);
});

it('excludes refund transactions from snapshots', function () {
    PaymentTransaction::factory()->paid()->create([
        'amount' => 1000.00,
        'type' => TransactionType::Payment->value,
        'paid_at' => now(),
    ]);
    PaymentTransaction::factory()->paid()->create([
        'amount' => 200.00,
        'type' => TransactionType::Refund->value,
        'paid_at' => now(),
    ]);

    (new RecalculateRevenueSnapshotsJob)->handle();

    $snapshot = RevenueSnapshot::query()
        ->where('period_type', 'daily')
        ->where('period_key', now()->format('Y-m-d'))
        ->first();

    expect($snapshot)->not->toBeNull()
        ->and((float) $snapshot->revenue)->toBe(1000.0)
        ->and($snapshot->transaction_count)->toBe(1);
});

it('upserts existing snapshots on re-run', function () {
    PaymentTransaction::factory()->paid()->create([
        'amount' => 500.00,
        'paid_at' => now(),
    ]);

    (new RecalculateRevenueSnapshotsJob)->handle();

    PaymentTransaction::factory()->paid()->create([
        'amount' => 300.00,
        'paid_at' => now(),
    ]);

    (new RecalculateRevenueSnapshotsJob)->handle();

    $snapshot = RevenueSnapshot::query()
        ->where('period_type', 'daily')
        ->where('period_key', now()->format('Y-m-d'))
        ->first();

    expect($snapshot)->not->toBeNull()
        ->and((float) $snapshot->revenue)->toBe(800.0)
        ->and($snapshot->transaction_count)->toBe(2);
});

it('does nothing when there are no paid transactions', function () {
    (new RecalculateRevenueSnapshotsJob)->handle();

    expect(RevenueSnapshot::query()->count())->toBe(0);
});
