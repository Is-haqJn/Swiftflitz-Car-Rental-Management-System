<?php

namespace App\Repositories;

use App\Models\DiscountCoupon;
use App\Repositories\Base\QueryableRepository;
use App\Repositories\Contracts\DiscountCouponRepositoryInterface;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class DiscountCouponRepository extends QueryableRepository implements DiscountCouponRepositoryInterface
{
    public function query(): QueryBuilder
    {
        return parent::query()->defaultSort('-created_at');
    }

    public function getAllowedFilters(): array
    {
        return [
            AllowedFilter::exact('is_active'),
            AllowedFilter::exact('type'),
            AllowedFilter::exact('coupon_type'),
            AllowedFilter::callback('search', function ($query, $value) {
                $query->where(function ($q) use ($value) {
                    $q->where('name', 'like', "%{$value}%")
                        ->orWhere('code', 'like', "%{$value}%");
                });
            }),
            AllowedFilter::callback('expired', function ($query, $value) {
                if ($value) {
                    $query->whereNotNull('expires_at')->where('expires_at', '<', now());
                }
            }),
            AllowedFilter::callback('used', function ($query, $value) {
                if ($value) {
                    $query->whereNotNull('max_uses')->whereColumn('used_count', '>=', 'max_uses');
                }
            }),
        ];
    }

    public function getAllowedSorts(): array
    {
        return ['name', 'code', 'created_at', 'value', 'expires_at'];
    }

    public function getAllowedIncludes(): array
    {
        return ['createdBy'];
    }

    public function getDefaultIncludes(): array
    {
        return [];
    }

    public function getAll(): mixed
    {
        return $this->getFiltered();
    }

    public function findCoupon(string $id): DiscountCoupon
    {
        return DiscountCoupon::findOrFail($id);
    }

    public function findByCode(string $code): ?DiscountCoupon
    {
        return DiscountCoupon::where('code', $code)->first();
    }

    public function createCoupon(array $data): DiscountCoupon
    {
        return DiscountCoupon::create($data);
    }

    public function updateCoupon(string $id, array $data): DiscountCoupon
    {
        $coupon = $this->findCoupon($id);
        $coupon->update($data);

        return $coupon->fresh();
    }

    public function deleteCoupon(string $id): void
    {
        $this->findCoupon($id)->delete();
    }

    public function incrementUsage(string $id): void
    {
        DiscountCoupon::where('id', $id)->increment('used_count');
    }

    protected function model(): string
    {
        return DiscountCoupon::class;
    }
}
