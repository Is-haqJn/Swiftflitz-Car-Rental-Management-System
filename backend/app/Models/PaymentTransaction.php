<?php

namespace App\Models;

use App\Enums\PaymentTransactionStatus;
use App\Enums\TransactionType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PaymentTransaction extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'reference',
        'provider',
        'provider_reference',
        'channel',
        'payment_phone',
        'card_bin',
        'card_last4',
        'card_type',
        'amount',
        'currency',
        'currency_symbol',
        'exchange_rate',
        'status',
        'type',
        'description',
        'discount_amount',
        'discount_reason',
        'coupon_usage_id',
        'discount_rule_usage_id',
        'processed_by_user_id',
        'paid_at',
        'payer_email',
        'payer_phone',
        'payer_name',
        'transactable_id',
        'transactable_type',
        'branch_id',
        'metadata',
        'gateway_amount',
        'gateway_currency',
        'gateway_charges',
        'customer_amount',
    ];

    public function transactable(): MorphTo
    {
        return $this->morphTo();
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by_user_id');
    }

    public function couponUsage(): BelongsTo
    {
        return $this->belongsTo(CouponUsage::class, 'coupon_usage_id');
    }

    public function discountRuleUsage(): BelongsTo
    {
        return $this->belongsTo(RentalDiscountUsage::class, 'discount_rule_usage_id');
    }

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'gateway_amount' => 'decimal:2',
            'gateway_charges' => 'decimal:2',
            'customer_amount' => 'decimal:2',
            'status' => PaymentTransactionStatus::class,
            'type' => TransactionType::class,
            'metadata' => 'array',
            'paid_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }
}
