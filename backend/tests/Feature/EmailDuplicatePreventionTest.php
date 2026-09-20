<?php

use App\Enums\RentalStatus;
use App\Jobs\SendRentalStatusChangedJob;
use App\Mail\RentalStatusChangedMail;
use App\Models\Customer;
use App\Models\Rental;
use App\Services\Contracts\Notifications\SmsNotificationServiceInterface;
use App\Services\Contracts\Notifications\WhatsAppNotificationServiceInterface;
use App\Services\Contracts\NotificationServiceInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

it('sends customer email when rental transitions from pending to confirmed', function (): void {
    Mail::fake();

    $this->mock(NotificationServiceInterface::class)
        ->shouldReceive('send')->andReturn(null);
    $this->mock(WhatsAppNotificationServiceInterface::class)
        ->shouldReceive('notifyRentalStatusChanged', 'notifyAdminRentalStatusChanged')->andReturn(null);
    $this->mock(SmsNotificationServiceInterface::class)
        ->shouldReceive('notifyRentalStatusChanged', 'notifyAdminRentalStatusChanged')->andReturn(null);

    $customer = Customer::factory()->create(['email' => 'customer@example.com']);

    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'status' => RentalStatus::Confirmed->value,
    ]);

    SendRentalStatusChangedJob::dispatchSync($rental, 'pending');

    /* Sprint H: pending->confirmed is now meaningful - customer notified of confirmation */
    Mail::assertQueued(RentalStatusChangedMail::class);
});

it('sends customer email for non-pending-to-confirmed transitions', function (): void {
    Mail::fake();

    $this->mock(NotificationServiceInterface::class)
        ->shouldReceive('send')->andReturn(null);
    $this->mock(WhatsAppNotificationServiceInterface::class)
        ->shouldReceive('notifyRentalStatusChanged', 'notifyAdminRentalStatusChanged')->andReturn(null);
    $this->mock(SmsNotificationServiceInterface::class)
        ->shouldReceive('notifyRentalStatusChanged', 'notifyAdminRentalStatusChanged')->andReturn(null);

    $customer = Customer::factory()->create(['email' => 'customer2@example.com']);

    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'status' => RentalStatus::Active->value,
    ]);

    SendRentalStatusChangedJob::dispatchSync($rental, 'confirmed');

    Mail::assertQueued(RentalStatusChangedMail::class);
});
