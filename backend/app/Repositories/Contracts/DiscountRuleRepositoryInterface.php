<?php

namespace App\Repositories\Contracts;

use App\Models\DiscountRule;
use Illuminate\Support\Collection;

interface DiscountRuleRepositoryInterface
{
    public function getAll(): mixed;

    public function findRule(string $id): DiscountRule;

    public function createRule(array $data): DiscountRule;

    public function updateRule(string $id, array $data): DiscountRule;

    public function deleteRule(string $id): void;

    /**
     * Return active rules valid today for the given branch (or org-wide).
     */
    public function getApplicableRules(?string $branchId): Collection;
}
