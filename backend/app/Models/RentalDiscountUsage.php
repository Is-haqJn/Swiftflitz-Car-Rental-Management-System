<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RentalDiscountUsage extends Model
{
    use HasUuids;

    protected $fillable = [
        'rental_id',
        'discount_rule_id',
        'applied_by',
        'discount_type',
        'amount',
        'note',
    ];

    public function discountRule(): BelongsTo
    {
        return $this->belongsTo(DiscountRule::class);
    }

    public function appliedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'applied_by');
    }

    public function rental(): BelongsTo
    {
        return $this->belongsTo(Rental::class, 'rental_id');
    }

    protected function casts(): array
    {
        return [
            'discount_type' => 'string',
            'amount' => 'decimal:2',
        ];
    }
}
