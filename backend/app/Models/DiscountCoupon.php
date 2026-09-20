<?php

namespace App\Models;

use App\Enums\CouponBehaviourType;
use App\Enums\CouponScopeType;
use App\Enums\CouponType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DiscountCoupon extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'code',
        'coupon_type',
        'name',
        'description',
        'type',
        'value',
        'expires_at',
        'valid_days',
        'max_uses',
        'max_uses_per_customer',
        'used_count',
        'min_rental_days',
        'min_rental_amount',
        'is_auto_generated',
        'is_active',
        'created_by',
    ];

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function usages(): HasMany
    {
        return $this->hasMany(CouponUsage::class, 'coupon_id');
    }

    public function scopes(): HasMany
    {
        return $this->hasMany(CouponScope::class, 'coupon_id');
    }

    /**
     * Returns true if the coupon applies to the given booking context.
     *
     * A coupon with no scope rows is unrestricted and always applies.
     * Otherwise, at least one scope row must match the context.
     *
     * @param  CouponScopeType  $type  The type of booking context
     * @param  string|null  $id  The specific resource ID (vehicle, category, package)
     */
    public function appliesToContext(CouponScopeType $type, ?string $id = null): bool
    {
        $scopes = $this->relationLoaded('scopes') ? $this->scopes : $this->scopes()->get();

        if ($scopes->isEmpty()) {
            return true;
        }

        return $scopes->contains(function (CouponScope $scope) use ($type, $id) {
            if ($scope->scope_type !== $type) {
                return false;
            }

            // Scope has no specific ID → matches any resource of this type
            if ($scope->scope_id === null) {
                return true;
            }

            return $scope->scope_id === $id;
        });
    }

    /**
     * Returns true if the coupon matches any of the provided (type, id?) pairs.
     * Used when a booking may qualify under multiple scope types (e.g. chauffeur + vehicle + category).
     *
     * @param  array<array{CouponScopeType, string|null}>  $contexts
     */
    public function appliesToAny(array $contexts): bool
    {
        $scopes = $this->relationLoaded('scopes') ? $this->scopes : $this->scopes()->get();

        if ($scopes->isEmpty()) {
            return true;
        }

        foreach ($contexts as [$type, $id]) {
            $match = $scopes->contains(function (CouponScope $scope) use ($type, $id) {
                if ($scope->scope_type !== $type) {
                    return false;
                }

                return $scope->scope_id === null || $scope->scope_id === $id;
            });

            if ($match) {
                return true;
            }
        }

        return false;
    }

    protected function casts(): array
    {
        return [
            'type' => CouponType::class,
            'coupon_type' => CouponBehaviourType::class,
            'value' => 'decimal:2',
            'min_rental_amount' => 'decimal:2',
            'expires_at' => 'datetime',
            'is_auto_generated' => 'boolean',
            'is_active' => 'boolean',
        ];
    }
}
