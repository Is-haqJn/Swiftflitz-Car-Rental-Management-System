<?php

use App\Mail\PaymentConfirmationMail;
use App\Models\PaymentTransaction;
use App\Models\Rental;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('payment confirmation email contains pickup docs disclaimer', function () {
    $rental = Rental::factory()->create();

    $transaction = PaymentTransaction::factory()->paid()->create([
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'amount' => (float) $rental->total_cost,
    ]);

    $mailable = new PaymentConfirmationMail($transaction);

    $rendered = $mailable->render();

    expect($rendered)->toContain("driver's license");
});
