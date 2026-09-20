<?php

use App\Mail\RentalInvoiceMail;
use App\Models\Customer;
use App\Models\Rental;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('has correct subject for unpaid rental', function () {
    $customer = Customer::factory()->create(['email' => 'test@example.com']);
    $rental = Rental::factory()->for($customer)->create([
        'payment_status' => 'pending',
    ]);

    $mail = new RentalInvoiceMail($rental);
    $envelope = $mail->envelope();

    expect($envelope->subject)->toContain('Invoice')
        ->and($envelope->subject)->toContain($rental->reference);
});

it('has correct subject for paid rental', function () {
    $customer = Customer::factory()->create(['email' => 'test@example.com']);
    $rental = Rental::factory()->for($customer)->create([
        'payment_status' => 'paid',
    ]);

    $mail = new RentalInvoiceMail($rental);
    $envelope = $mail->envelope();

    expect($envelope->subject)->toContain('Receipt')
        ->and($envelope->subject)->toContain($rental->reference);
});

it('attaches a PDF file', function () {
    $customer = Customer::factory()->create(['email' => 'test@example.com']);
    $rental = Rental::factory()->for($customer)->create();

    $mail = new RentalInvoiceMail($rental);
    $attachments = $mail->attachments();

    expect($attachments)->not->toBeEmpty();

    $attachment = $attachments[0];
    expect($attachment)->toBeInstanceOf(\Illuminate\Mail\Attachment::class);
});

it('queues on the email queue', function () {
    $customer = Customer::factory()->create(['email' => 'test@example.com']);
    $rental = Rental::factory()->for($customer)->create();

    $mail = new RentalInvoiceMail($rental);

    expect($mail->queue)->toBe('email');
});

it('stores the note on the mailable', function () {
    $customer = Customer::factory()->create(['email' => 'test@example.com']);
    $rental = Rental::factory()->for($customer)->create();

    $mail = new RentalInvoiceMail($rental, 'Please pay promptly.');

    expect($mail->note)->toBe('Please pay promptly.');
});
