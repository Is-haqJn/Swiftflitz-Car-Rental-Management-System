<?php

namespace App\Services\Contracts;

use App\DTOs\DiscountRuleData;
use App\Models\DiscountRule;
use Illuminate\Support\Collection;

interface DiscountRuleServiceInterface
{
    public function getAll(): mixed;

    public function findRule(string $id): DiscountRule;

    public function create(DiscountRuleData $data): DiscountRule;

    public function update(string $id, array $data): DiscountRule;

    public function delete(string $id): void;

    /**
     * Return applicable rules for a branch. Full evaluation deferred to Rental phase.
     */
    public function getApplicableRules(?string $branchId): Collection;
}
