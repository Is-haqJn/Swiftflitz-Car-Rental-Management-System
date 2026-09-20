<?php

namespace App\Services\Contracts;

use App\DTOs\DiscountCouponData;
use App\Models\DiscountCoupon;

interface DiscountCouponServiceInterface
{
    public function getAll(): mixed;

    public function findCoupon(string $id): DiscountCoupon;

    public function create(DiscountCouponData $data): DiscountCoupon;

    public function update(string $id, array $data): DiscountCoupon;

    public function delete(string $id): void;

    public function validateCode(string $code, ?string $customerId = null, ?string $context = null, ?string $contextId = null): DiscountCoupon;

    public function incrementUsage(string $id): void;
}
