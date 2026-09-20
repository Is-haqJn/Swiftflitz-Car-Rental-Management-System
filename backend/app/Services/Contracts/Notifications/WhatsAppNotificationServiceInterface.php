<?php

namespace App\Services\Contracts\Notifications;

use App\Models\AirportBooking;
use App\Models\ChauffeurBooking;
use App\Models\Driver;
use App\Models\Rental;

interface WhatsAppNotificationServiceInterface
{
    /**
     * Check whether a WhatsApp notification should be sent for the given event type.
     * Validates both the WhatsApp-specific per-type toggle and the system-level toggle.
     */
    public function shouldSend(string $type): bool;

    public function shouldSendToAdmin(string $type): bool;

    /**
     * Resolve the actual phone number to send to, applying delivery-mode rules.
     * Returns null if the message should be suppressed (e.g. notify_customers is off
     * and the recipient is a customer).
     */
    public function resolveRecipient(?string $phone, bool $isCustomer = true): ?string;

    public function notifyNewBooking(Rental $rental): void;

    public function notifyReturnReminder(Rental $rental): void;

    public function notifyOverdueAlert(Rental $rental): void;

    public function notifyPickupReminder(Rental $rental): void;

    public function notifyPaymentConfirmation(Rental $rental): void;

    public function notifyAdminNewBooking(Rental $rental, ?string $overridePhone = null): void;

    public function notifyAdminRentalCancelled(Rental $rental, ?string $overridePhone = null): void;

    public function notifyAdminPickupReminder(Rental $rental, ?string $overridePhone = null): void;

    public function notifyAdminReturnReminder(Rental $rental, ?string $overridePhone = null): void;

    public function notifyAdminOverdueAlert(Rental $rental, ?string $overridePhone = null): void;

    public function notifyAdminPaymentConfirmation(Rental $rental, ?string $overridePhone = null): void;

    public function notifyAdminRentalStatusChanged(Rental $rental, string $oldStatus, ?string $overridePhone = null): void;

    public function notifyAdminAirportBooking(AirportBooking $booking, ?string $overridePhone = null): void;

    public function notifyAdminAirportBookingCancelled(AirportBooking $booking, ?string $overridePhone = null): void;

    public function notifyAdminChauffeurBooking(ChauffeurBooking $booking, ?string $overridePhone = null): void;

    public function notifyAdminChauffeurBookingCancelled(ChauffeurBooking $booking, ?string $overridePhone = null): void;

    public function notifyAdminChauffeurPickupReminder(ChauffeurBooking $booking, ?string $overridePhone = null): void;

    public function notifyRentalCancelled(Rental $rental): void;

    public function notifyRentalStatusChanged(Rental $rental, string $oldStatus): void;

    public function notifyAirportBooking(AirportBooking $booking): void;

    public function notifyAirportBookingCancelled(AirportBooking $booking): void;

    public function notifyAirportBookingStatusChanged(AirportBooking $booking, string $oldStatus): void;

    public function notifyChauffeurBooking(ChauffeurBooking $booking): void;

    public function notifyChauffeurBookingCancelled(ChauffeurBooking $booking): void;

    public function notifyChauffeurBookingStatusChanged(ChauffeurBooking $booking, string $oldStatus): void;

    public function notifyChauffeurPickupReminder(ChauffeurBooking $booking): void;

    public function notifyDriverDocumentExpiry(Driver $driver, string $documentType): void;
}
