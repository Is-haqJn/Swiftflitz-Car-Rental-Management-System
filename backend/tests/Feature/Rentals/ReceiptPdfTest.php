<?php

use App\Mail\PaymentConfirmationMail;
use App\Models\Branch;
use App\Models\PaymentTransaction;
use App\Models\Rental;
use App\Models\Vehicle;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Mail\Mailables\Attachment;

uses(RefreshDatabase::class);

it('booking-receipt blade renders a non-empty PDF (byte check)', function () {
    $vehicle = Vehicle::factory()->create(['name' => 'Toyota Camry']);

    $rental = Rental::factory()->create([
        'vehicle_id' => $vehicle->id,
        'rental_days' => 3,
        'daily_rate' => 200.00,
        'base_cost' => 600.00,
        'subtotal' => 600.00,
        'total_cost' => 600.00,
        'amount_paid' => 600.00,
        'applied_charges_breakdown' => [],
    ]);

    $rental->load(['customer', 'vehicle.branch', 'pickupLocation', 'dropoffLocation', 'branch']);
    $sym = $rental->currency_symbol ?? $rental->branch?->currency_symbol ?? 'GHS';
    $pdfSafeSymbol = preg_match('/^[\x00-\x7F]+$/', $sym) ? $sym : ($rental->currency ?? 'GHS');

    $data = [
        'customerName' => $rental->customer?->name ?? 'there',
        'customerEmail' => $rental->customer?->email,
        'customerPhone' => $rental->customer?->phone,
        'reference' => $rental->reference,
        'vehicleName' => $rental->vehicle?->name ?? 'your selected vehicle',
        'pickupDate' => $rental->pickup_date?->format('D, M j, Y'),
        'returnDate' => $rental->return_date?->format('D, M j, Y'),
        'pickupTime' => $rental->pickup_time,
        'returnTime' => $rental->return_time,
        'pickupLocation' => $rental->pickupLocation?->name,
        'dropoffLocation' => $rental->dropoffLocation?->name,
        'rentalDays' => $rental->rental_days,
        'dailyRate' => (float) $rental->daily_rate,
        'baseCost' => (float) $rental->base_cost,
        'addonCharges' => [],
        'locationCharges' => [],
        'subtotal' => (float) $rental->subtotal,
        'discountAmount' => (float) ($rental->total_discount_amount ?? 0),
        'discountedSubtotal' => max(0.0, (float) $rental->subtotal - (float) ($rental->total_discount_amount ?? 0)),
        'vatAmount' => $rental->vat_amount !== null ? (float) $rental->vat_amount : null,
        'totalCost' => (float) $rental->total_cost,
        'securityDepositAmount' => $rental->security_deposit_amount !== null ? (float) $rental->security_deposit_amount : null,
        'depositPaid' => (float) ($rental->deposit_paid ?? 0),
        'skipDeposit' => (bool) $rental->skip_security_deposit,
        'currency_symbol' => $pdfSafeSymbol,
        'issuedAt' => now()->format('D, M j, Y'),
    ];

    $bytes = Pdf::loadView('pdf.booking-receipt', $data)->output();

    expect(strlen($bytes))->toBeGreaterThan(100, 'PDF output should not be empty')
        ->and($bytes)->toStartWith('%PDF', 'Output should be a valid PDF file');
});

it('receipt PDF uses ASCII-safe currency symbol for non-ASCII branch currencies', function () {
    $branch = Branch::factory()->create([
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'exchange_rate' => 0.085,
    ]);

    $vehicle = Vehicle::factory()->create(['branch_id' => $branch->id]);

    $rental = Rental::factory()->create([
        'vehicle_id' => $vehicle->id,
        'branch_id' => $branch->id,
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'exchange_rate' => 0.085,
        'rental_days' => 2,
        'daily_rate' => 50000.00,
        'base_cost' => 100000.00,
        'subtotal' => 100000.00,
        'total_cost' => 100000.00,
        'applied_charges_breakdown' => [],
    ]);

    $transaction = PaymentTransaction::factory()->create([
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'status' => 'paid',
        'amount' => 100000.00,
    ]);

    $mail = new PaymentConfirmationMail($transaction);
    $attachments = $mail->attachments();

    /* PDF must still attach even for non-ASCII branch currencies */
    expect($attachments)
        ->toHaveCount(1)
        ->and($attachments[0])->toBeInstanceOf(Attachment::class);
});

it('PaymentConfirmationMail::attachments() returns 1 attachment for rental transactable', function () {
    $rental = Rental::factory()->create();

    $transaction = PaymentTransaction::factory()->create([
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'status' => 'paid',
        'amount' => 100.00,
    ]);

    $mail = new PaymentConfirmationMail($transaction);
    $attachments = $mail->attachments();

    expect($attachments)
        ->toHaveCount(1)
        ->and($attachments[0])->toBeInstanceOf(Attachment::class);
});

it('PaymentConfirmationMail::attachments() returns empty for missing rental', function () {
    $transaction = PaymentTransaction::factory()->create([
        'transactable_type' => 'rental',
        'transactable_id' => '00000000-0000-0000-0000-000000000000',
        'status' => 'paid',
        'amount' => 100.00,
    ]);

    $mail = new PaymentConfirmationMail($transaction);

    expect($mail->attachments())->toBeEmpty();
});
