<?php

use App\Mail\RentalInvoiceMail;
use App\Models\Customer;
use App\Models\Rental;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

function grantInvoicePermission(User $user): void
{
    Permission::firstOrCreate(['name' => 'rentals.view_all', 'guard_name' => 'web']);
    $user->givePermissionTo('rentals.view_all');
}

it('requires authentication', function () {
    $rental = Rental::factory()->create();

    $this->postJson("/api/v1/rentals/{$rental->id}/send-invoice")
        ->assertUnauthorized();
});

it('queues RentalInvoiceMail to customer email', function () {
    Mail::fake();

    $user = User::factory()->create();
    grantInvoicePermission($user);

    $customer = Customer::factory()->create(['email' => 'customer@example.com']);
    $rental = Rental::factory()->for($customer)->create();

    $this->actingAs($user, 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/send-invoice")
        ->assertOk()
        ->assertJson(['message' => 'Invoice sent to customer successfully.']);

    Mail::assertQueued(RentalInvoiceMail::class, fn ($mail) => $mail->hasTo('customer@example.com'));
});

it('returns 422 when customer has no email', function () {
    $user = User::factory()->create();
    grantInvoicePermission($user);

    $customer = Customer::factory()->create();
    /* Use raw query to set email to empty string, bypassing model validation */
    DB::table('customers')->where('id', $customer->id)->update(['email' => '']);
    $customer->refresh();

    $rental = Rental::factory()->for($customer)->create();

    $this->actingAs($user, 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/send-invoice")
        ->assertUnprocessable();
});

it('accepts an optional note up to 500 chars', function () {
    Mail::fake();

    $user = User::factory()->create();
    grantInvoicePermission($user);

    $customer = Customer::factory()->create(['email' => 'customer@example.com']);
    $rental = Rental::factory()->for($customer)->create();

    $note = str_repeat('a', 500);

    $this->actingAs($user, 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/send-invoice", ['note' => $note])
        ->assertOk();

    Mail::assertQueued(RentalInvoiceMail::class, fn ($mail) => $mail->note === $note);
});

it('rejects a note longer than 500 chars', function () {
    $user = User::factory()->create();
    grantInvoicePermission($user);

    $customer = Customer::factory()->create(['email' => 'customer@example.com']);
    $rental = Rental::factory()->for($customer)->create();

    $this->actingAs($user, 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/send-invoice", [
            'note' => str_repeat('x', 501),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('note');
});
