<?php

namespace App\Repositories\Contracts;

use App\Models\DiscountCoupon;

interface DiscountCouponRepositoryInterface
{
    public function getAll(): mixed;

    public function findCoupon(string $id): DiscountCoupon;

    public function findByCode(string $code): ?DiscountCoupon;

    public function createCoupon(array $data): DiscountCoupon;

    public function updateCoupon(string $id, array $data): DiscountCoupon;

    public function deleteCoupon(string $id): void;

    public function incrementUsage(string $id): void;
}
