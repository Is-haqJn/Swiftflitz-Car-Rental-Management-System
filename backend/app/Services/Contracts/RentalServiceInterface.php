<?php

namespace App\Services\Contracts;

use App\DTOs\RentalData;
use App\Models\Customer;
use App\Models\Rental;

interface RentalServiceInterface
{
    public function getAll(): mixed;

    public function findRental(string $id): Rental;

    public function create(RentalData $data): Rental;

    public function update(string $id, array $data): Rental;

    public function delete(string $id): void;

    public function confirm(string $id): Rental;

    public function processPickup(string $id, array $data, array $photoFiles = []): Rental;

    public function processReturn(string $id, array $data, array $photoFiles = []): Rental;

    public function approveReturn(string $id, array $data = []): Rental;

    public function cancel(string $id, array $data): Rental;

    public function switchVehicle(string $id, array $data): Rental;

    public function settleRental(string $id, array $data): Rental;

    public function settleDamage(string $id, array $data): Rental;

    public function recordRepairCost(string $id, array $data): Rental;

    public function collectDamageBalance(string $id): Rental;

    public function collectDeposit(string $id): Rental;

    public function refundDeposit(string $id): Rental;

    public function waivedOverdue(string $id, string $reason): Rental;

    public function settleRefund(string $id, array $data): Rental;

    public function getExtendPreview(string $id, string $newReturnDate): array;

    public function extendRental(string $id, array $data): Rental;

    public function sendPaymentLink(Rental $rental): void;

    public function sendDamagePaymentLink(Rental $rental): void;

    public function sendInvoiceToCustomer(Rental $rental, ?string $note = null): void;

    public function confirmPaidPendingForCustomer(Customer $customer): int;

    /** @param  \Illuminate\Http\UploadedFile[]  $files */
    public function attachPickupVideos(Rental $rental, array $files): Rental;

    /** @param  \Illuminate\Http\UploadedFile[]  $files */
    public function attachReturnVideos(Rental $rental, array $files): Rental;
}
