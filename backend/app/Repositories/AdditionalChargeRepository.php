<?php

namespace App\Repositories;

use App\Enums\ChargeScope;
use App\Models\AdditionalCharge;
use App\Repositories\Base\QueryableRepository;
use App\Repositories\Contracts\AdditionalChargeRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class AdditionalChargeRepository extends QueryableRepository implements AdditionalChargeRepositoryInterface
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
            AllowedFilter::exact('scope'),
            AllowedFilter::exact('is_active'),
            AllowedFilter::exact('charge_type'),
            AllowedFilter::callback('search', function ($query, $value) {
                $query->where('name', 'like', "%{$value}%");
            }),
        ];
    }

    public function getAllowedSorts(): array
    {
        return ['name', 'created_at', 'scope', 'charge_type', 'amount'];
    }

    public function getAllowedIncludes(): array
    {
        return ['branch', 'category', 'vehicle'];
    }

    public function getDefaultIncludes(): array
    {
        return ['branch', 'category', 'vehicle'];
    }

    public function getAll(): mixed
    {
        return $this->getFiltered();
    }

    public function findCharge(string $id): AdditionalCharge
    {
        return AdditionalCharge::findOrFail($id);
    }

    public function createCharge(array $data): AdditionalCharge
    {
        return AdditionalCharge::create($data);
    }

    public function updateCharge(string $id, array $data): AdditionalCharge
    {
        $charge = $this->findCharge($id);
        $charge->update($data);

        return $charge->fresh(['branch', 'category', 'vehicle']);
    }

    public function deleteCharge(string $id): void
    {
        $this->findCharge($id)->delete();
    }

    public function getGlobalCharges(): Collection
    {
        return AdditionalCharge::where('scope', ChargeScope::Global)
            ->where('is_active', true)
            ->get();
    }

    public function getCategoryCharges(string $categoryId): Collection
    {
        return AdditionalCharge::where('scope', ChargeScope::Category)
            ->where('category_id', $categoryId)
            ->where('is_active', true)
            ->get();
    }

    public function getVehicleCharges(string $vehicleId): Collection
    {
        return AdditionalCharge::where('scope', ChargeScope::Vehicle)
            ->where('vehicle_id', $vehicleId)
            ->where('is_active', true)
            ->get();
    }

    public function getRegularCharges(?string $branchId = null): Collection
    {
        return AdditionalCharge::where('scope', ChargeScope::Regular)
            ->where('is_active', true)
            ->when($branchId, function ($q) use ($branchId) {
                $q->where(function ($q) use ($branchId) {
                    $q->where('branch_id', $branchId)->orWhereNull('branch_id');
                });
            })
            ->get();
    }

    protected function model(): string
    {
        return AdditionalCharge::class;
    }
}
