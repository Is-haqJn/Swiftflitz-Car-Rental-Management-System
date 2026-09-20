<?php

namespace App\Repositories;

use App\Models\DiscountRule;
use App\Repositories\Base\QueryableRepository;
use App\Repositories\Contracts\DiscountRuleRepositoryInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class DiscountRuleRepository extends QueryableRepository implements DiscountRuleRepositoryInterface
{
    public function query(): QueryBuilder
    {
        $base = parent::query()->defaultSort('-created_at');

        $user = auth()->user();
        if ($user && ! $user->hasAnyRole(['super_admin', 'admin'])) {
            $branchIds = $user->branches()->pluck('id')->toArray();
            $ids = empty($branchIds) ? ['__none__'] : $branchIds;
            $base->where(function ($q) use ($ids) {
                $q->whereIn('branch_id', $ids)->orWhereNull('branch_id');
            });
        }

        return $base;
    }

    public function getAllowedFilters(): array
    {
        return [
            AllowedFilter::exact('branch_id'),
            AllowedFilter::exact('discount_type'),
            AllowedFilter::exact('condition_type'),
            AllowedFilter::exact('is_active'),
            AllowedFilter::callback('search', function ($query, $value) {
                $query->where('name', 'like', "%{$value}%");
            }),
        ];
    }

    public function getAllowedSorts(): array
    {
        return ['name', 'created_at', 'discount_type', 'discount_value'];
    }

    public function getAllowedIncludes(): array
    {
        return ['branch', 'conditionVehicle', 'conditionCategory'];
    }

    public function getDefaultIncludes(): array
    {
        return ['branch', 'conditionVehicle', 'conditionCategory'];
    }

    public function getAll(): mixed
    {
        return $this->getFiltered();
    }

    public function findRule(string $id): DiscountRule
    {
        return DiscountRule::findOrFail($id);
    }

    public function createRule(array $data): DiscountRule
    {
        return DiscountRule::create($data);
    }

    public function updateRule(string $id, array $data): DiscountRule
    {
        $rule = $this->findRule($id);
        $rule->update($data);

        return $rule->fresh(['branch', 'conditionVehicle', 'conditionCategory']);
    }

    public function deleteRule(string $id): void
    {
        $this->findRule($id)->delete();
    }

    public function getApplicableRules(?string $branchId): Collection
    {
        $today = Carbon::today();

        return DiscountRule::query()
            ->where('is_active', true)
            ->where(function ($q) use ($branchId) {
                $q->whereNull('branch_id');
                if ($branchId) {
                    $q->orWhere('branch_id', $branchId);
                }
            })
            ->where(function ($q) use ($today) {
                $q->whereNull('valid_from')->orWhereDate('valid_from', '<=', $today);
            })
            ->where(function ($q) use ($today) {
                $q->whereNull('valid_to')->orWhereDate('valid_to', '>=', $today);
            })
            ->get();
    }

    protected function model(): string
    {
        return DiscountRule::class;
    }
}
