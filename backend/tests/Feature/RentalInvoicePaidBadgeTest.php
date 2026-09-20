<?php

use App\Enums\RentalPaymentStatus;
use App\Mail\RentalInvoiceMail;
use App\Models\Rental;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('marks invoice paid when amount_paid equals total_cost', function () {
    $rental = Rental::factory()->create([
        'total_cost' => 500,
        'amount_paid' => 500,
        'payment_status' => RentalPaymentStatus::Paid->value,
    ]);

    $mailable = new RentalInvoiceMail($rental);

    /*
     * RentalInvoiceMail should expose a public $isPaid property so Blade views
     * can conditionally render a "PAID" stamp/badge. This property does not
     * exist yet - test will FAIL until it is added.
     */
    expect($mailable->isPaid)->toBeTrue();
});

it('marks invoice unpaid when amount_paid is less than total_cost', function () {
    $rental = Rental::factory()->create([
        'total_cost' => 500,
        'amount_paid' => 200,
        'payment_status' => RentalPaymentStatus::PartiallyPaid->value,
    ]);

    $mailable = new RentalInvoiceMail($rental);

    expect($mailable->isPaid)->toBeFalse();
});

it('marks invoice unpaid when total_cost is zero', function () {
    $rental = Rental::factory()->create([
        'total_cost' => 0,
        'amount_paid' => 0,
        'payment_status' => RentalPaymentStatus::Pending->value,
    ]);

    $mailable = new RentalInvoiceMail($rental);

    expect($mailable->isPaid)->toBeFalse();
});
