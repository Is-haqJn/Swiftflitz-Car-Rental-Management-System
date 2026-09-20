<?php

namespace App\Services;

use App\DTOs\DiscountRuleData;
use App\Models\DiscountRule;
use App\Repositories\Contracts\DiscountRuleRepositoryInterface;
use App\Services\Contracts\DiscountRuleServiceInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DiscountRuleService implements DiscountRuleServiceInterface
{
    public function __construct(
        protected DiscountRuleRepositoryInterface $repository,
    ) {}

    public function getAll(): mixed
    {
        return $this->repository->getAll();
    }

    public function findRule(string $id): DiscountRule
    {
        return $this->repository->findRule($id);
    }

    public function create(DiscountRuleData $data): DiscountRule
    {
        return DB::transaction(function () use ($data) {
            return $this->repository->createRule($data->toArray());
        });
    }

    public function update(string $id, array $data): DiscountRule
    {
        return DB::transaction(function () use ($id, $data) {
            return $this->repository->updateRule($id, $data);
        });
    }

    public function delete(string $id): void
    {
        $this->repository->deleteRule($id);
    }

    public function getApplicableRules(?string $branchId): Collection
    {
        return $this->repository->getApplicableRules($branchId);
    }
}
