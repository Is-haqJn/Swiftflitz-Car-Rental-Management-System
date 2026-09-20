<?php

namespace App\DTOs;

readonly class RentalData
{
    public function __construct(
        public string $vehicleId,
        public string $customerId,
        public string $pickupDate,
        public string $returnDate,
        public ?string $branchId = null,
        public ?string $pickupTime = '09:00',
        public ?string $returnTime = '17:00',
        public ?string $source = 'website',
        public ?string $pickupLocationId = null,
        public ?string $dropoffLocationId = null,
        public array $addons = [],
        public ?string $couponCode = null,
        public float $manualDiscountAmount = 0.0,
        public ?string $manualDiscountReason = null,
        public bool $skipSecurityDeposit = false,
        public ?bool $youngDriverOverride = null,
        public ?float $overrideBaseCost = null,
        public float $initialPayment = 0.0,
        public bool $collectDepositNow = false,
        public ?string $customerNotes = null,
        public ?string $adminNotes = null,
        public ?string $paymentMethod = null,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            vehicleId: $data['vehicle_id'],
            customerId: $data['customer_id'],
            pickupDate: $data['pickup_date'],
            returnDate: $data['return_date'],
            branchId: $data['branch_id'] ?? null,
            pickupTime: $data['pickup_time'] ?? '09:00',
            returnTime: $data['return_time'] ?? '17:00',
            source: $data['source'] ?? 'website',
            pickupLocationId: $data['pickup_location_id'] ?? null,
            dropoffLocationId: $data['dropoff_location_id'] ?? null,
            addons: $data['addons'] ?? [],
            couponCode: $data['coupon_code'] ?? null,
            manualDiscountAmount: (float) ($data['manual_discount_amount'] ?? 0),
            manualDiscountReason: $data['manual_discount_reason'] ?? null,
            skipSecurityDeposit: (bool) ($data['skip_security_deposit'] ?? false),
            youngDriverOverride: isset($data['young_driver_override']) ? (bool) $data['young_driver_override'] : null,
            initialPayment: (float) ($data['initial_payment'] ?? 0),
            collectDepositNow: (bool) ($data['collect_deposit_now'] ?? false),
            customerNotes: $data['customer_notes'] ?? null,
            adminNotes: $data['admin_notes'] ?? null,
            paymentMethod: $data['payment_method'] ?? null,
        );
    }

    public function toArray(): array
    {
        $data = [
            'vehicle_id' => $this->vehicleId,
            'customer_id' => $this->customerId,
            'pickup_date' => $this->pickupDate,
            'return_date' => $this->returnDate,
            'branch_id' => $this->branchId,
            'pickup_time' => $this->pickupTime,
            'return_time' => $this->returnTime,
            'source' => $this->source,
            'pickup_location_id' => $this->pickupLocationId,
            'dropoff_location_id' => $this->dropoffLocationId,
            'addons' => $this->addons,
            'coupon_code' => $this->couponCode,
            'manual_discount_amount' => $this->manualDiscountAmount,
            'manual_discount_reason' => $this->manualDiscountReason,
            'skip_security_deposit' => $this->skipSecurityDeposit,
            'override_base_cost' => $this->overrideBaseCost,
            'initial_payment' => $this->initialPayment,
            'collect_deposit_now' => $this->collectDepositNow,
            'customer_notes' => $this->customerNotes,
            'admin_notes' => $this->adminNotes,
        ];

        return array_filter($data, fn ($v) => $v !== null);
    }
}
