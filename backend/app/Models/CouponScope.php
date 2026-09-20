<?php

namespace App\Models;

use App\Enums\CouponScopeType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CouponScope extends Model
{
    protected $fillable = [
        'coupon_id',
        'scope_type',
        'scope_id',
    ];

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(DiscountCoupon::class, 'coupon_id');
    }

    protected function casts(): array
    {
        return [
            'scope_type' => CouponScopeType::class,
        ];
    }
}
