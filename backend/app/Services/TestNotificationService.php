<?php

namespace App\Services;

use App\Mail\BookingConfirmationMail;
use App\Mail\NewQuoteRequestMail;
use App\Mail\OverdueAlertMail;
use App\Mail\PickupReminderMail;
use App\Mail\QuoteConfirmationMail;
use App\Mail\QuoteReadyMail;
use App\Mail\ReturnReminderMail;
use App\Mail\VehicleExpiryMail;
use App\Models\User;
use App\Repositories\Contracts\TestNotificationRepositoryInterface;
use App\Services\Contracts\TestNotificationServiceInterface;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Mail;
use RuntimeException;

class TestNotificationService implements TestNotificationServiceInterface
{
    public function __construct(
        protected TestNotificationRepositoryInterface $testNotificationRepository,
    ) {}

    /**
     * Send a test email of the given type to the specified email address.
     *
     * @throws RuntimeException When no sample data is found for the given type.
     */
    public function sendTestEmail(string $type, string $recipientEmail): void
    {
        $mailable = $this->resolveMailable($type);

        Mail::to($recipientEmail)->queue($mailable);
    }

    /**
     * Resolve the appropriate Mailable for the given notification type.
     *
     * @throws RuntimeException When no suitable sample record exists.
     */
    private function resolveMailable(string $type): Mailable
    {
        return match ($type) {
            'vehicle_expiry' => $this->buildVehicleExpiry(),
            'booking_confirmation' => $this->buildBookingConfirmation(),
            'overdue_alert' => $this->buildOverdueAlert(),
            'return_reminder' => $this->buildReturnReminder(),
            'pickup_reminder' => $this->buildPickupReminder(),
            'quote_confirmation' => $this->buildQuoteConfirmation(),
            'new_quote_request' => $this->buildNewQuoteRequest(),
            'quote_ready' => $this->buildQuoteReady(),
            default => throw new RuntimeException("Unknown notification type: {$type}"),
        };
    }

    private function buildVehicleExpiry(): Mailable
    {
        $vehicle = $this->testNotificationRepository->getLatestVehicle();

        if ($vehicle === null) {
            throw new RuntimeException("No vehicle data found. Please create at least one vehicle to send a 'vehicle_expiry' test email.");
        }

        return new VehicleExpiryMail($vehicle, "This is a test vehicle expiry notification for {$vehicle->name}.");
    }

    private function buildBookingConfirmation(): Mailable
    {
        $rental = $this->testNotificationRepository->getLatestRental();

        if ($rental === null) {
            throw new RuntimeException("No rental data found. Please create at least one rental to send a 'booking_confirmation' test email.");
        }

        return new BookingConfirmationMail($rental);
    }

    private function buildOverdueAlert(): Mailable
    {
        $rental = $this->testNotificationRepository->getLatestRental();

        if ($rental === null) {
            throw new RuntimeException("No rental data found. Please create at least one rental to send an 'overdue_alert' test email.");
        }

        return new OverdueAlertMail($rental);
    }

    private function buildReturnReminder(): Mailable
    {
        $rental = $this->testNotificationRepository->getLatestRental();

        if ($rental === null) {
            throw new RuntimeException("No rental data found. Please create at least one rental to send a 'return_reminder' test email.");
        }

        return new ReturnReminderMail($rental);
    }

    private function buildPickupReminder(): Mailable
    {
        $rental = $this->testNotificationRepository->getLatestRental();

        if ($rental === null) {
            throw new RuntimeException("No rental data found. Please create at least one rental to send a 'pickup_reminder' test email.");
        }

        return new PickupReminderMail($rental);
    }

    private function buildQuoteConfirmation(): Mailable
    {
        $quoteRequest = $this->testNotificationRepository->getLatestQuoteRequest();

        if ($quoteRequest === null) {
            throw new RuntimeException("No quote request data found. Please create at least one quote request to send a 'quote_confirmation' test email.");
        }

        return new QuoteConfirmationMail($quoteRequest);
    }

    private function buildNewQuoteRequest(): Mailable
    {
        $quoteRequest = $this->testNotificationRepository->getLatestQuoteRequest();

        if ($quoteRequest === null) {
            throw new RuntimeException("No quote request data found. Please create at least one quote request to send a 'new_quote_request' test email.");
        }

        $admin = User::query()->first() ?? new User(['name' => 'Admin', 'email' => 'admin@example.com']);

        return new NewQuoteRequestMail($quoteRequest, $admin);
    }

    private function buildQuoteReady(): Mailable
    {
        $quoteRequest = $this->testNotificationRepository->getLatestQuoteRequest();

        if ($quoteRequest === null) {
            throw new RuntimeException("No quote request data found. Please create at least one quote request to send a 'quote_ready' test email.");
        }

        return new QuoteReadyMail($quoteRequest);
    }
}
