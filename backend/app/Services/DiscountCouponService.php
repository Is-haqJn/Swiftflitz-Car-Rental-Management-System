<?php

namespace App\Services;

use App\DTOs\DiscountCouponData;
use App\Enums\CouponScopeType;
use App\Models\CouponUsage;
use App\Models\DiscountCoupon;
use App\Repositories\Contracts\DiscountCouponRepositoryInterface;
use App\Services\Contracts\DiscountCouponServiceInterface;
use App\Settings\RentalSettings;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class DiscountCouponService implements DiscountCouponServiceInterface
{
    public function __construct(
        protected DiscountCouponRepositoryInterface $repository,
        protected RentalSettings $rentalSettings,
    ) {}

    public function getAll(): mixed
    {
        return $this->repository->getAll();
    }

    public function findCoupon(string $id): DiscountCoupon
    {
        return $this->repository->findCoupon($id);
    }

    public function create(DiscountCouponData $data): DiscountCoupon
    {
        return DB::transaction(function () use ($data) {
            $prefix = strtoupper($this->rentalSettings->coupon_code_prefix ?? 'SF');
            $payload = $data->toArray();

            if (! empty($data->code)) {
                $payload['code'] = strtoupper($prefix . $data->code);
                $payload['is_auto_generated'] = false;
            } else {
                $payload['code'] = strtoupper($prefix . Str::random(5));
                $payload['is_auto_generated'] = true;
            }

            if (! empty($data->validDays)) {
                $payload['expires_at'] = now()->addDays($data->validDays);
            }

            $payload['created_by'] = auth()->id();

            $coupon = $this->repository->createCoupon($payload);

            $this->syncScopes($coupon, $data->scopes);

            return $coupon->load('scopes');
        });
    }

    public function update(string $id, array $data): DiscountCoupon
    {
        return DB::transaction(function () use ($id, $data) {
            if (isset($data['valid_days'])) {
                $data['expires_at'] = now()->addDays((int) $data['valid_days']);
            }

            $scopes = $data['scopes'] ?? null;
            unset($data['scopes']);

            $coupon = $this->repository->updateCoupon($id, $data);

            if ($scopes !== null) {
                $this->syncScopes($coupon, $scopes);
            }

            return $coupon->load('scopes');
        });
    }

    public function delete(string $id): void
    {
        $this->repository->deleteCoupon($id);
    }

    public function validateCode(string $code, ?string $customerId = null, ?string $context = null, ?string $contextId = null): DiscountCoupon
    {
        $coupon = $this->repository->findByCode(strtoupper($code));

        if (! $coupon) {
            throw ValidationException::withMessages([
                'code' => ['Coupon code not found.'],
            ]);
        }

        if (! $coupon->is_active) {
            throw ValidationException::withMessages([
                'code' => ['This coupon is no longer active.'],
            ]);
        }

        if ($coupon->expires_at && $coupon->expires_at->isPast()) {
            throw ValidationException::withMessages([
                'code' => ['This coupon has expired.'],
            ]);
        }

        if ($coupon->max_uses !== null && $coupon->used_count >= $coupon->max_uses) {
            throw ValidationException::withMessages([
                'code' => ['This coupon has reached its maximum usage limit.'],
            ]);
        }

        if ($customerId && $coupon->max_uses_per_customer !== null) {
            $customerUsageCount = CouponUsage::where('coupon_id', $coupon->id)
                ->where('customer_id', $customerId)
                ->count();

            if ($customerUsageCount >= $coupon->max_uses_per_customer) {
                throw ValidationException::withMessages([
                    'code' => ['You have reached the maximum usage limit for this coupon.'],
                ]);
            }
        }

        if ($context !== null) {
            $relevantTypes = match ($context) {
                'rental' => [CouponScopeType::Rental, CouponScopeType::Vehicle, CouponScopeType::Category],
                'chauffeur' => [CouponScopeType::Chauffeur, CouponScopeType::FleetVehicle, CouponScopeType::Category],
                'airport' => [CouponScopeType::Airport, CouponScopeType::AirportPackage],
                default => null,
            };

            if ($relevantTypes !== null) {
                $coupon->load('scopes');
                $applies = $coupon->scopes->isEmpty() || $coupon->scopes->contains(
                    fn ($scope) => in_array($scope->scope_type, $relevantTypes, true)
                );

                if (! $applies) {
                    throw ValidationException::withMessages([
                        'code' => ['This coupon is not valid for this booking type.'],
                    ]);
                }
            }
        }

        // first_time check deferred to Rental phase

        return $coupon;
    }

    public function incrementUsage(string $id): void
    {
        DB::transaction(function () use ($id) {
            $this->repository->incrementUsage($id);
        });
    }

    /**
     * @param  array<array{scope_type: string, scope_id: string|null}>  $scopes
     */
    private function syncScopes(DiscountCoupon $coupon, array $scopes): void
    {
        $coupon->scopes()->delete();

        foreach ($scopes as $scope) {
            $coupon->scopes()->create([
                'scope_type' => $scope['scope_type'],
                'scope_id' => $scope['scope_id'] ?? null,
            ]);
        }
    }
}
