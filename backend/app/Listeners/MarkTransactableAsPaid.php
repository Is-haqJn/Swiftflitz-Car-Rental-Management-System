<?php

namespace App\Listeners;

use App\Enums\AirportBookingStatus;
use App\Enums\AirportPaymentStatus;
use App\Enums\ChauffeurPaymentStatus;
use App\Enums\CustomerProfileStatus;
use App\Enums\PaymentTransactionStatus;
use App\Enums\RentalPaymentStatus;
use App\Enums\RentalStatus;
use App\Enums\TransactionType;
use App\Events\PaymentStatusUpdated;
use App\Events\RentalStatusChanged;
use App\Models\AirportBooking;
use App\Models\ChauffeurBooking;
use App\Models\PaymentTransaction;
use App\Models\Rental;
use Illuminate\Support\Facades\DB;

class MarkTransactableAsPaid
{
    /**
     * Update the transactable record when a payment transaction is confirmed as paid.
     *
     * Runs on both the verify() path (user redirected back from provider) and the
     * webhook path (server-to-server notification), so payment status is always recorded
     * even if one channel fails.
     */
    public function handle(PaymentStatusUpdated $event): void
    {
        $transaction = $event->transaction;

        match ($transaction->transactable_type) {
            'rental' => $this->markRentalPaid($transaction->transactable_id, (float) $transaction->amount, $event),
            'airport_booking' => $this->markAirportBookingPaid($transaction->transactable_id, $event),
            'chauffeur_booking' => $this->markChauffeurBookingPaid($transaction->transactable_id, $event),
            default => null,
        };
    }

    private function markRentalPaid(string $rentalId, float $amount, PaymentStatusUpdated $event): void
    {
        $rental = Rental::find($rentalId);

        if (! $rental) {
            return;
        }

        $transaction = $event->transaction;
        $purpose = $transaction->metadata['purpose'] ?? null;

        /* Security deposit payment - mark deposit as held, do not touch rental amount_paid */
        if ($purpose === 'deposit') {
            DB::transaction(function () use ($rental, $amount, $transaction) {
                $rental->update([
                    'security_deposit_status' => 'held',
                    'deposit_paid' => round((float) ($rental->deposit_paid ?? 0) + $amount, 2),
                ]);

                $transaction->update(['type' => TransactionType::SecurityDeposit]);
            });

            return;
        }

        /* Damage payment - settle the damage balance, do not touch rental amount_paid */
        if ($purpose === 'damage') {
            DB::transaction(function () use ($rental, $rentalId, $transaction) {
                $rental->update([
                    'damage_balance_due' => null,
                    'damage_settlement_status' => 'settled',
                ]);

                /*
                 * Remove the pending RepairCost estimate (if any) so only one
                 * damage record exists per lifecycle. The online payment becomes
                 * the canonical DamageCharge record.
                 */
                PaymentTransaction::where('transactable_type', 'rental')
                    ->where('transactable_id', $rentalId)
                    ->where('type', TransactionType::RepairCost->value)
                    ->where('status', PaymentTransactionStatus::Pending->value)
                    ->delete();

                $transaction->update(['type' => TransactionType::DamageCharge]);
            });

            return;
        }

        DB::transaction(function () use ($rental, $amount, $transaction) {
            $amountPaid = round((float) $rental->amount_paid + $amount, 2);
            $totalCost = (float) $rental->total_cost;
            $isFullPayment = $amountPaid >= $totalCost;

            $paymentStatus = $isFullPayment
                ? RentalPaymentStatus::Paid
                : RentalPaymentStatus::PartiallyPaid;

            $rental->update([
                'amount_paid' => $amountPaid,
                'payment_status' => $paymentStatus,
            ]);

            /* Tag the transaction as full or part payment when it has the generic default type */
            if ($transaction->type === null || $transaction->type === TransactionType::Payment) {
                $transaction->update([
                    'type' => $isFullPayment ? TransactionType::FullPayment : TransactionType::PartPayment,
                ]);
            }
        });

        /* E1: Auto-confirm verified customer rental on payment (atomic to prevent double-confirm) */
        $rental->refresh();
        $rental->loadMissing('customer');

        if ($rental->status === RentalStatus::Pending
            && $rental->customer?->profile_status === CustomerProfileStatus::Verified) {
            $updated = Rental::where('id', $rental->id)
                ->where('status', RentalStatus::Pending->value)
                ->update(['status' => RentalStatus::Confirmed->value]);

            if ($updated > 0) {
                event(new RentalStatusChanged(
                    $rental->fresh(),
                    RentalStatus::Pending->value,
                    RentalStatus::Confirmed->value
                ));
            }
        }
    }

    private function markAirportBookingPaid(string $bookingId, PaymentStatusUpdated $event): void
    {
        DB::transaction(function () use ($bookingId, $event) {
            AirportBooking::where('id', $bookingId)
                ->update([
                    'payment_status' => AirportPaymentStatus::Paid,
                    'booking_status' => AirportBookingStatus::PaymentReceived,
                ]);

            /* Tag the online transaction as a full payment when it has the generic default type */
            $transaction = $event->transaction;

            if ($transaction->type === null || $transaction->type === TransactionType::Payment) {
                $transaction->update(['type' => TransactionType::FullPayment]);
            }
        });
    }

    private function markChauffeurBookingPaid(string $bookingId, PaymentStatusUpdated $event): void
    {
        DB::transaction(function () use ($bookingId, $event) {
            ChauffeurBooking::where('id', $bookingId)
                ->update(['payment_status' => ChauffeurPaymentStatus::Paid]);

            /* Tag the online transaction as a full payment when it has the generic default type */
            $transaction = $event->transaction;

            if ($transaction->type === null || $transaction->type === TransactionType::Payment) {
                $transaction->update(['type' => TransactionType::FullPayment]);
            }
        });
    }
}
