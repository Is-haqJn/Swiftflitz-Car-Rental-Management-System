<?php

namespace App\Services\Notifications;

use App\Models\AirportBooking;
use App\Models\ChauffeurBooking;
use App\Models\Driver;
use App\Models\Rental;
use App\Services\Contracts\Notifications\WhatsAppNotificationServiceInterface;
use App\Services\Contracts\WhatsAppTemplateServiceInterface;
use App\Services\Notifications\Channels\WhatsAppChannel;
use App\Settings\NotificationSystemSettings;
use App\Settings\WhatsAppSettings;

class WhatsAppNotificationService implements WhatsAppNotificationServiceInterface
{
    public function __construct(
        private readonly WhatsAppChannel $channel,
        private readonly WhatsAppTemplateServiceInterface $templateService,
        private readonly WhatsAppSettings $whatsAppSettings,
        private readonly NotificationSystemSettings $systemSettings,
    ) {}

    public function shouldSend(string $type): bool
    {
        if (! $this->whatsAppSettings->enabled) {
            return false;
        }

        $perTypeProperty = "send_{$type}";
        $systemProperty = "whatsapp_{$type}";

        $perTypeEnabled = property_exists($this->whatsAppSettings, $perTypeProperty)
            ? (bool) $this->whatsAppSettings->$perTypeProperty
            : false;

        $systemEnabled = property_exists($this->systemSettings, $systemProperty)
            ? (bool) $this->systemSettings->$systemProperty
            : false;

        return $perTypeEnabled && $systemEnabled;
    }

    public function shouldSendToAdmin(string $type): bool
    {
        if (! $this->whatsAppSettings->enabled) {
            return false;
        }

        if (! $this->whatsAppSettings->notify_admins) {
            return false;
        }

        $perTypeProperty = "send_admin_{$type}";
        $systemProperty = "whatsapp_admin_{$type}";

        $perTypeEnabled = property_exists($this->whatsAppSettings, $perTypeProperty)
            ? (bool) $this->whatsAppSettings->$perTypeProperty
            : false;

        $systemEnabled = property_exists($this->systemSettings, $systemProperty)
            ? (bool) $this->systemSettings->$systemProperty
            : false;

        return $perTypeEnabled && $systemEnabled;
    }

    public function resolveRecipient(?string $phone, bool $isCustomer = true): ?string
    {
        if ($this->whatsAppSettings->test_mode) {
            return $this->whatsAppSettings->test_phone_number ?: null;
        }

        if ($isCustomer && ! $this->whatsAppSettings->notify_customers) {
            return null;
        }

        /* admin_only without mirror: replace customer with monitoring number */
        if ($this->whatsAppSettings->admin_only_mode && ! ($this->whatsAppSettings->mirror_mode ?? false)) {
            return $this->whatsAppSettings->admin_only_phone_number ?: null;
        }

        return $phone ?: null;
    }

    public function notifyNewBooking(Rental $rental): void
    {
        if (! $this->shouldSend('new_booking')) {
            return;
        }

        $rental->loadMissing(['customer', 'vehicle']);

        $recipient = $this->resolveRecipient($rental->customer?->phone, isCustomer: true);

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('new_booking');

        if (! $template) {
            return;
        }

        $params = $this->templateService->resolveParams($template, [
            'customer_name' => $rental->customer?->name ?? '',
            'booking_reference' => $rental->reference,
            'vehicle_name' => $rental->vehicle?->name ?? '',
        ]);

        $this->dispatchCustomerTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    public function notifyReturnReminder(Rental $rental): void
    {
        if (! $this->shouldSend('return_reminder')) {
            return;
        }

        $rental->loadMissing(['customer', 'vehicle']);

        $recipient = $this->resolveRecipient($rental->customer?->phone, isCustomer: true);

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('return_reminder');

        if (! $template) {
            return;
        }

        $params = $this->templateService->resolveParams($template, [
            'customer_name' => $rental->customer?->name ?? '',
            'booking_reference' => $rental->reference,
            'vehicle_name' => $rental->vehicle?->name ?? '',
            'return_date' => $rental->end_date?->format('D, d M Y') ?? '',
        ]);

        $this->dispatchCustomerTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    public function notifyOverdueAlert(Rental $rental): void
    {
        if (! $this->shouldSend('overdue_alert')) {
            return;
        }

        $rental->loadMissing(['customer', 'vehicle']);

        $recipient = $this->resolveRecipient($rental->customer?->phone, isCustomer: true);

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('overdue_alert');

        if (! $template) {
            return;
        }

        $params = $this->templateService->resolveParams($template, [
            'customer_name' => $rental->customer?->name ?? '',
            'booking_reference' => $rental->reference,
            'vehicle_name' => $rental->vehicle?->name ?? '',
        ]);

        $this->dispatchCustomerTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    public function notifyPickupReminder(Rental $rental): void
    {
        if (! $this->shouldSend('pickup_reminder')) {
            return;
        }

        $rental->loadMissing(['customer', 'vehicle']);

        $recipient = $this->resolveRecipient($rental->customer?->phone, isCustomer: true);

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('pickup_reminder');

        if (! $template) {
            return;
        }

        $params = $this->templateService->resolveParams($template, [
            'customer_name' => $rental->customer?->name ?? '',
            'booking_reference' => $rental->reference,
            'vehicle_name' => $rental->vehicle?->name ?? '',
            'pickup_date' => $rental->start_date?->format('D, d M Y') ?? '',
        ]);

        $this->dispatchCustomerTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    public function notifyPaymentConfirmation(Rental $rental): void
    {
        if (! $this->shouldSend('payment_confirmation')) {
            return;
        }

        $rental->loadMissing(['customer']);

        $recipient = $this->resolveRecipient($rental->customer?->phone, isCustomer: true);

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('payment_confirmation');

        if (! $template) {
            return;
        }

        $params = $this->templateService->resolveParams($template, [
            'customer_name' => $rental->customer?->name ?? '',
            'booking_reference' => $rental->reference,
        ]);

        $this->dispatchCustomerTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    public function notifyAdminNewBooking(Rental $rental, ?string $overridePhone = null): void
    {
        $isBranchManager = $overridePhone !== null;

        if ($isBranchManager) {
            if (! $this->shouldSendToBranchManagers('new_booking')) {
                return;
            }
            $recipient = $this->resolveBranchManagerRecipient($overridePhone);
        } else {
            if (! $this->shouldSendToAdmin('new_booking')) {
                return;
            }
            $recipient = $this->resolveAdminRecipient();
        }

        $rental->loadMissing(['customer', 'vehicle', 'branch']);

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('admin_new_booking');

        if (! $template) {
            return;
        }

        $totalAmount = number_format((float) $rental->total_cost, 2);

        $params = $this->templateService->resolveParams($template, [
            'booking_reference' => $rental->reference,
            'branch_name' => $rental->branch?->name ?? 'N/A',
            'customer_name' => $rental->customer?->name ?? '',
            'vehicle_name' => $rental->vehicle?->name ?? '',
            'total_amount' => $totalAmount,
        ]);

        $this->channel->sendTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    public function notifyRentalCancelled(Rental $rental): void
    {
        if (! $this->shouldSend('rental_cancelled')) {
            return;
        }

        $rental->loadMissing(['customer', 'vehicle']);

        $recipient = $this->resolveRecipient($rental->customer?->phone, isCustomer: true);

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('rental_cancelled');

        if (! $template) {
            return;
        }

        $params = $this->templateService->resolveParams($template, [
            'customer_name' => $rental->customer?->name ?? '',
            'booking_reference' => $rental->reference,
            'vehicle_name' => $rental->vehicle?->name ?? '',
        ]);

        $this->dispatchCustomerTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    public function notifyRentalStatusChanged(Rental $rental, string $oldStatus): void
    {
        if (! $this->shouldSend('rental_status_change')) {
            return;
        }

        $rental->loadMissing(['customer', 'vehicle']);

        $recipient = $this->resolveRecipient($rental->customer?->phone, isCustomer: true);

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('rental_status_change');

        if (! $template) {
            return;
        }

        $params = $this->templateService->resolveParams($template, [
            'customer_name' => $rental->customer?->name ?? '',
            'booking_reference' => $rental->reference,
            'new_status' => ucfirst(str_replace('_', ' ', $rental->status->value ?? $rental->status)),
            'vehicle_name' => $rental->vehicle?->name ?? '',
        ]);

        $this->dispatchCustomerTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    public function notifyAirportBooking(AirportBooking $booking): void
    {
        if (! $this->shouldSend('airport_booking')) {
            return;
        }

        $booking->loadMissing(['airportCustomer', 'vehicle']);

        $phone = $booking->passenger_phone ?? $booking->airportCustomer?->phone;
        $recipient = $this->resolveRecipient($phone, isCustomer: true);

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('airport_booking');

        if (! $template) {
            return;
        }

        $params = $this->templateService->resolveParams($template, [
            'customer_name' => $booking->airportCustomer?->full_name ?? $booking->passenger_name ?? '',
            'booking_reference' => $booking->booking_reference,
            'scheduled_at' => $booking->scheduled_at?->format('D, d M Y H:i') ?? '',
        ]);

        $this->dispatchCustomerTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    public function notifyAirportBookingCancelled(AirportBooking $booking): void
    {
        if (! $this->shouldSend('airport_booking_cancelled')) {
            return;
        }

        $booking->loadMissing(['airportCustomer']);

        $phone = $booking->passenger_phone ?? $booking->airportCustomer?->phone;
        $recipient = $this->resolveRecipient($phone, isCustomer: true);

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('airport_booking_cancelled');

        if (! $template) {
            return;
        }

        $params = $this->templateService->resolveParams($template, [
            'customer_name' => $booking->airportCustomer?->full_name ?? $booking->passenger_name ?? '',
            'booking_reference' => $booking->booking_reference,
        ]);

        $this->dispatchCustomerTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    public function notifyAirportBookingStatusChanged(AirportBooking $booking, string $oldStatus): void
    {
        if (! $this->shouldSend('airport_booking_status_changed')) {
            return;
        }

        $booking->loadMissing(['airportCustomer']);

        $recipient = $this->resolveAdminRecipient();

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('airport_booking_status_changed');

        if (! $template) {
            return;
        }

        $newStatus = ucfirst(strtolower(str_replace('_', ' ', $booking->booking_status->value)));

        $params = $this->templateService->resolveParams($template, [
            'booking_reference' => $booking->booking_reference,
            'new_status' => $newStatus,
        ]);

        $this->channel->sendTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    public function notifyChauffeurBooking(ChauffeurBooking $booking): void
    {
        if (! $this->shouldSend('chauffeur_booking')) {
            return;
        }

        $booking->loadMissing(['chauffeurCustomer', 'vehicle']);

        $recipient = $this->resolveRecipient($booking->chauffeurCustomer?->phone, isCustomer: true);

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('chauffeur_booking');

        if (! $template) {
            return;
        }

        $params = $this->templateService->resolveParams($template, [
            'customer_name' => $booking->chauffeurCustomer?->full_name ?? '',
            'booking_reference' => $booking->booking_reference,
            'pickup_time' => $booking->pickup_time?->format('D, d M Y H:i') ?? '',
            'vehicle_name' => $booking->vehicle?->name ?? '',
        ]);

        $this->dispatchCustomerTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    public function notifyChauffeurBookingCancelled(ChauffeurBooking $booking): void
    {
        if (! $this->shouldSend('chauffeur_booking_cancelled')) {
            return;
        }

        $booking->loadMissing(['chauffeurCustomer']);

        $recipient = $this->resolveRecipient($booking->chauffeurCustomer?->phone, isCustomer: true);

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('chauffeur_booking_cancelled');

        if (! $template) {
            return;
        }

        $params = $this->templateService->resolveParams($template, [
            'customer_name' => $booking->chauffeurCustomer?->full_name ?? '',
            'booking_reference' => $booking->booking_reference,
        ]);

        $this->dispatchCustomerTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    public function notifyChauffeurBookingStatusChanged(ChauffeurBooking $booking, string $oldStatus): void
    {
        if (! $this->shouldSend('chauffeur_booking_status_changed')) {
            return;
        }

        $booking->loadMissing(['chauffeurCustomer']);

        $recipient = $this->resolveAdminRecipient();

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('chauffeur_booking_status_changed');

        if (! $template) {
            return;
        }

        $newStatus = ucfirst(strtolower(str_replace('_', ' ', $booking->booking_status->value)));

        $params = $this->templateService->resolveParams($template, [
            'booking_reference' => $booking->booking_reference,
            'new_status' => $newStatus,
        ]);

        $this->channel->sendTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    public function notifyChauffeurPickupReminder(ChauffeurBooking $booking): void
    {
        if (! $this->shouldSend('chauffeur_pickup_reminder')) {
            return;
        }

        $booking->loadMissing(['chauffeurCustomer', 'vehicle']);

        $recipient = $this->resolveRecipient($booking->chauffeurCustomer?->phone, isCustomer: true);

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('chauffeur_pickup_reminder');

        if (! $template) {
            return;
        }

        $params = $this->templateService->resolveParams($template, [
            'customer_name' => $booking->chauffeurCustomer?->full_name ?? '',
            'booking_reference' => $booking->booking_reference,
            'pickup_time' => $booking->pickup_time?->format('D, d M Y H:i') ?? '',
            'vehicle_name' => $booking->vehicle?->name ?? '',
        ]);

        $this->dispatchCustomerTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    public function notifyDriverDocumentExpiry(Driver $driver, string $documentType): void
    {
        if (! $this->shouldSend('driver_document_expiry')) {
            return;
        }

        $recipient = $this->resolveAdminRecipient();

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('driver_document_expiry');

        if (! $template) {
            return;
        }

        $expiryDate = $documentType === 'driver\'s license'
            ? $driver->license_expiry_date?->format('D, d M Y')
            : $driver->id_expiry_date?->format('D, d M Y');

        $params = $this->templateService->resolveParams($template, [
            'driver_name' => $driver->full_name,
            'document_type' => $documentType,
            'expiry_date' => $expiryDate ?? '',
        ]);

        $this->channel->sendTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    public function notifyAdminRentalCancelled(Rental $rental, ?string $overridePhone = null): void
    {
        $isBranchManager = $overridePhone !== null;

        if ($isBranchManager) {
            if (! $this->shouldSendToBranchManagers('rental_cancelled')) {
                return;
            }
            $recipient = $this->resolveBranchManagerRecipient($overridePhone);
        } else {
            if (! $this->shouldSendToAdmin('rental_cancelled')) {
                return;
            }
            $recipient = $this->resolveAdminRecipient();
        }

        $rental->loadMissing(['customer', 'vehicle', 'branch']);

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('admin_rental_cancelled');

        if (! $template) {
            return;
        }

        $params = $this->templateService->resolveParams($template, [
            'booking_reference' => $rental->reference,
            'customer_name' => $rental->customer?->name ?? '',
            'branch_name' => $rental->branch?->name ?? 'N/A',
            'vehicle_name' => $rental->vehicle?->name ?? '',
        ]);

        $this->channel->sendTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    public function notifyAdminPickupReminder(Rental $rental, ?string $overridePhone = null): void
    {
        $isBranchManager = $overridePhone !== null;

        if ($isBranchManager) {
            if (! $this->shouldSendToBranchManagers('pickup_reminder')) {
                return;
            }
            $recipient = $this->resolveBranchManagerRecipient($overridePhone);
        } else {
            if (! $this->shouldSendToAdmin('pickup_reminder')) {
                return;
            }
            $recipient = $this->resolveAdminRecipient();
        }

        $rental->loadMissing(['customer', 'vehicle', 'branch']);

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('admin_pickup_reminder');

        if (! $template) {
            return;
        }

        $params = $this->templateService->resolveParams($template, [
            'booking_reference' => $rental->reference,
            'pickup_date' => $rental->start_date?->format('D, d M Y') ?? '',
            'customer_name' => $rental->customer?->name ?? '',
            'vehicle_name' => $rental->vehicle?->name ?? '',
            'branch_name' => $rental->branch?->name ?? 'N/A',
        ]);

        $this->channel->sendTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    public function notifyAdminReturnReminder(Rental $rental, ?string $overridePhone = null): void
    {
        $isBranchManager = $overridePhone !== null;

        if ($isBranchManager) {
            if (! $this->shouldSendToBranchManagers('return_reminder')) {
                return;
            }
            $recipient = $this->resolveBranchManagerRecipient($overridePhone);
        } else {
            if (! $this->shouldSendToAdmin('return_reminder')) {
                return;
            }
            $recipient = $this->resolveAdminRecipient();
        }

        $rental->loadMissing(['customer', 'vehicle', 'branch']);

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('admin_return_reminder');

        if (! $template) {
            return;
        }

        $params = $this->templateService->resolveParams($template, [
            'booking_reference' => $rental->reference,
            'return_date' => $rental->end_date?->format('D, d M Y') ?? '',
            'customer_name' => $rental->customer?->name ?? '',
            'vehicle_name' => $rental->vehicle?->name ?? '',
            'branch_name' => $rental->branch?->name ?? 'N/A',
        ]);

        $this->channel->sendTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    public function notifyAdminOverdueAlert(Rental $rental, ?string $overridePhone = null): void
    {
        $isBranchManager = $overridePhone !== null;

        if ($isBranchManager) {
            if (! $this->shouldSendToBranchManagers('overdue_alert')) {
                return;
            }
            $recipient = $this->resolveBranchManagerRecipient($overridePhone);
        } else {
            if (! $this->shouldSendToAdmin('overdue_alert')) {
                return;
            }
            $recipient = $this->resolveAdminRecipient();
        }

        $rental->loadMissing(['customer', 'vehicle', 'branch']);

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('admin_overdue_alert');

        if (! $template) {
            return;
        }

        $params = $this->templateService->resolveParams($template, [
            'booking_reference' => $rental->reference,
            'customer_name' => $rental->customer?->name ?? '',
            'vehicle_name' => $rental->vehicle?->name ?? '',
            'branch_name' => $rental->branch?->name ?? 'N/A',
        ]);

        $this->channel->sendTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    public function notifyAdminPaymentConfirmation(Rental $rental, ?string $overridePhone = null): void
    {
        $isBranchManager = $overridePhone !== null;

        if ($isBranchManager) {
            if (! $this->shouldSendToBranchManagers('payment_confirmation')) {
                return;
            }
            $recipient = $this->resolveBranchManagerRecipient($overridePhone);
        } else {
            if (! $this->shouldSendToAdmin('payment_confirmation')) {
                return;
            }
            $recipient = $this->resolveAdminRecipient();
        }

        $rental->loadMissing(['customer', 'branch']);

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('admin_payment_confirmation');

        if (! $template) {
            return;
        }

        $totalAmount = number_format((float) $rental->total_cost, 2);

        $params = $this->templateService->resolveParams($template, [
            'total_amount' => $totalAmount,
            'booking_reference' => $rental->reference,
            'customer_name' => $rental->customer?->name ?? '',
            'branch_name' => $rental->branch?->name ?? 'N/A',
        ]);

        $this->channel->sendTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    public function notifyAdminRentalStatusChanged(Rental $rental, string $oldStatus, ?string $overridePhone = null): void
    {
        $isBranchManager = $overridePhone !== null;

        if ($isBranchManager) {
            if (! $this->shouldSendToBranchManagers('rental_status_change')) {
                return;
            }
            $recipient = $this->resolveBranchManagerRecipient($overridePhone);
        } else {
            if (! $this->shouldSendToAdmin('rental_status_change')) {
                return;
            }
            $recipient = $this->resolveAdminRecipient();
        }

        $rental->loadMissing(['customer', 'branch']);

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('admin_rental_status_change');

        if (! $template) {
            return;
        }

        $newStatus = ucfirst(str_replace('_', ' ', $rental->status->value ?? $rental->status));

        $params = $this->templateService->resolveParams($template, [
            'booking_reference' => $rental->reference,
            'new_status' => $newStatus,
            'branch_name' => $rental->branch?->name ?? 'N/A',
        ]);

        $this->channel->sendTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    public function notifyAdminAirportBooking(AirportBooking $booking, ?string $overridePhone = null): void
    {
        $isBranchManager = $overridePhone !== null;

        if ($isBranchManager) {
            if (! $this->shouldSendToBranchManagers('airport_booking')) {
                return;
            }
            $recipient = $this->resolveBranchManagerRecipient($overridePhone);
        } else {
            if (! $this->shouldSendToAdmin('airport_booking')) {
                return;
            }
            $recipient = $this->resolveAdminRecipient();
        }

        $booking->loadMissing(['airportCustomer', 'vehicle', 'branch']);

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('admin_airport_booking');

        if (! $template) {
            return;
        }

        $customerName = $booking->passenger_name ?? $booking->airportCustomer?->name ?? '';

        $params = $this->templateService->resolveParams($template, [
            'booking_reference' => $booking->reference,
            'branch_name' => $booking->branch?->name ?? 'N/A',
            'customer_name' => $customerName,
            'vehicle_name' => $booking->vehicle?->name ?? '',
        ]);

        $this->channel->sendTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    public function notifyAdminAirportBookingCancelled(AirportBooking $booking, ?string $overridePhone = null): void
    {
        $isBranchManager = $overridePhone !== null;

        if ($isBranchManager) {
            if (! $this->shouldSendToBranchManagers('airport_booking_cancelled')) {
                return;
            }
            $recipient = $this->resolveBranchManagerRecipient($overridePhone);
        } else {
            if (! $this->shouldSendToAdmin('airport_booking_cancelled')) {
                return;
            }
            $recipient = $this->resolveAdminRecipient();
        }

        $booking->loadMissing(['airportCustomer', 'vehicle', 'branch']);

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('admin_airport_booking_cancelled');

        if (! $template) {
            return;
        }

        $customerName = $booking->passenger_name ?? $booking->airportCustomer?->name ?? '';

        $params = $this->templateService->resolveParams($template, [
            'booking_reference' => $booking->reference,
            'customer_name' => $customerName,
            'branch_name' => $booking->branch?->name ?? 'N/A',
            'vehicle_name' => $booking->vehicle?->name ?? '',
        ]);

        $this->channel->sendTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    public function notifyAdminChauffeurBooking(ChauffeurBooking $booking, ?string $overridePhone = null): void
    {
        $isBranchManager = $overridePhone !== null;

        if ($isBranchManager) {
            if (! $this->shouldSendToBranchManagers('chauffeur_booking')) {
                return;
            }
            $recipient = $this->resolveBranchManagerRecipient($overridePhone);
        } else {
            if (! $this->shouldSendToAdmin('chauffeur_booking')) {
                return;
            }
            $recipient = $this->resolveAdminRecipient();
        }

        $booking->loadMissing(['chauffeurCustomer', 'vehicle', 'branch']);

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('admin_chauffeur_booking');

        if (! $template) {
            return;
        }

        $customerName = $booking->chauffeurCustomer?->name ?? '';

        $params = $this->templateService->resolveParams($template, [
            'booking_reference' => $booking->reference,
            'branch_name' => $booking->branch?->name ?? 'N/A',
            'customer_name' => $customerName,
            'vehicle_name' => $booking->vehicle?->name ?? '',
        ]);

        $this->channel->sendTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    public function notifyAdminChauffeurBookingCancelled(ChauffeurBooking $booking, ?string $overridePhone = null): void
    {
        $isBranchManager = $overridePhone !== null;

        if ($isBranchManager) {
            if (! $this->shouldSendToBranchManagers('chauffeur_booking_cancelled')) {
                return;
            }
            $recipient = $this->resolveBranchManagerRecipient($overridePhone);
        } else {
            if (! $this->shouldSendToAdmin('chauffeur_booking_cancelled')) {
                return;
            }
            $recipient = $this->resolveAdminRecipient();
        }

        $booking->loadMissing(['chauffeurCustomer', 'vehicle', 'branch']);

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('admin_chauffeur_booking_cancelled');

        if (! $template) {
            return;
        }

        $customerName = $booking->chauffeurCustomer?->name ?? '';

        $params = $this->templateService->resolveParams($template, [
            'booking_reference' => $booking->reference,
            'customer_name' => $customerName,
            'branch_name' => $booking->branch?->name ?? 'N/A',
            'vehicle_name' => $booking->vehicle?->name ?? '',
        ]);

        $this->channel->sendTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    public function notifyAdminChauffeurPickupReminder(ChauffeurBooking $booking, ?string $overridePhone = null): void
    {
        $isBranchManager = $overridePhone !== null;

        if ($isBranchManager) {
            if (! $this->shouldSendToBranchManagers('chauffeur_pickup_reminder')) {
                return;
            }
            $recipient = $this->resolveBranchManagerRecipient($overridePhone);
        } else {
            if (! $this->shouldSendToAdmin('chauffeur_pickup_reminder')) {
                return;
            }
            $recipient = $this->resolveAdminRecipient();
        }

        $booking->loadMissing(['chauffeurCustomer', 'vehicle', 'branch']);

        if ($recipient === null) {
            return;
        }

        $template = $this->templateService->getTemplate('admin_chauffeur_pickup_reminder');

        if (! $template) {
            return;
        }

        $customerName = $booking->chauffeurCustomer?->name ?? '';

        $params = $this->templateService->resolveParams($template, [
            'booking_reference' => $booking->reference,
            'pickup_date' => $booking->pickup_date?->format('D, d M Y') ?? '',
            'customer_name' => $customerName,
            'vehicle_name' => $booking->vehicle?->name ?? '',
            'branch_name' => $booking->branch?->name ?? 'N/A',
        ]);

        $this->channel->sendTemplate($recipient, $template->template_name, $template->language_code, $params);
    }

    /**
     * Resolve the admin phone recipient.
     *
     * Test mode only overrides customer recipients - admin alerts always
     * target the configured admin phone number so on-call operators still
     * receive alerts while QA is bouncing customer messages to a sandbox.
     */
    private function resolveAdminRecipient(): ?string
    {
        if ($this->whatsAppSettings->admin_phone_number) {
            return $this->whatsAppSettings->admin_phone_number;
        }

        if ($this->whatsAppSettings->test_mode) {
            return $this->whatsAppSettings->test_phone_number ?: null;
        }

        return null;
    }

    private function shouldSendToBranchManagers(string $type): bool
    {
        if (! $this->whatsAppSettings->enabled) {
            return false;
        }

        if (! ($this->whatsAppSettings->notify_branch_managers ?? false)) {
            return false;
        }

        $perTypeProperty = "send_admin_{$type}";
        $systemProperty = "whatsapp_admin_{$type}";

        $perTypeEnabled = property_exists($this->whatsAppSettings, $perTypeProperty)
            ? (bool) $this->whatsAppSettings->$perTypeProperty
            : false;

        $systemEnabled = property_exists($this->systemSettings, $systemProperty)
            ? (bool) $this->systemSettings->$systemProperty
            : false;

        return $perTypeEnabled && $systemEnabled;
    }

    private function resolveBranchManagerRecipient(?string $phone): ?string
    {
        if ($this->whatsAppSettings->test_mode) {
            return $this->whatsAppSettings->test_phone_number ?: null;
        }

        if ($this->whatsAppSettings->admin_only_mode) {
            return $this->whatsAppSettings->admin_only_phone_number ?: null;
        }

        return $phone ?: null;
    }

    private function resolveMirrorRecipient(): ?string
    {
        if ($this->whatsAppSettings->test_mode) {
            return null;
        }

        /* mirror only active when admin_only_mode is on */
        if (! $this->whatsAppSettings->admin_only_mode) {
            return null;
        }

        if (! ($this->whatsAppSettings->mirror_mode ?? false)) {
            return null;
        }

        return $this->whatsAppSettings->admin_only_phone_number ?: null;
    }

    private function dispatchCustomerTemplate(string $recipient, string $templateName, string $languageCode, array $params): void
    {
        $this->channel->sendTemplate($recipient, $templateName, $languageCode, $params);

        $mirror = $this->resolveMirrorRecipient();

        if ($mirror !== null) {
            $this->channel->sendTemplate($mirror, $templateName, $languageCode, $params);
        }
    }
}
