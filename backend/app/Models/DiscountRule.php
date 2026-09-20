<?php

namespace App\Models;

use App\Enums\DiscountConditionType;
use App\Enums\DiscountType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DiscountRule extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'branch_id',
        'name',
        'description',
        'discount_type',
        'discount_value',
        'condition_type',
        'condition_value',
        'is_stackable',
        'is_active',
        'valid_from',
        'valid_to',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function conditionVehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'condition_value', 'id');
    }

    public function conditionCategory(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'condition_value', 'id');
    }

    public function usages(): HasMany
    {
        return $this->hasMany(RentalDiscountUsage::class);
    }

    protected function casts(): array
    {
        return [
            'discount_type' => DiscountType::class,
            'condition_type' => DiscountConditionType::class,
            'discount_value' => 'decimal:2',
            'is_stackable' => 'boolean',
            'is_active' => 'boolean',
            'valid_from' => 'date',
            'valid_to' => 'date',
        ];
    }
}
