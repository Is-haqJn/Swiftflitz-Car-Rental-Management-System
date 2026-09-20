<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CouponUsage extends Model
{
    use HasUuids;

    protected $fillable = [
        'coupon_id',
        'customer_id',
        'rental_id',
        'used_at',
    ];

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(DiscountCoupon::class, 'coupon_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function rental(): BelongsTo
    {
        return $this->belongsTo(Rental::class, 'rental_id');
    }

    protected function casts(): array
    {
        return [
            'used_at' => 'datetime',
        ];
    }
}
