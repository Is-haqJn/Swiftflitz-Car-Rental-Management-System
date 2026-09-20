<?php

namespace App\Models;

use App\Enums\ChargeScope;
use App\Enums\ChargeType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdditionalCharge extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'branch_id',
        'name',
        'description',
        'scope',
        'category_id',
        'vehicle_id',
        'charge_type',
        'amount',
        'stock_quantity',
        'is_waivable',
        'is_active',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    protected function casts(): array
    {
        return [
            'scope' => ChargeScope::class,
            'charge_type' => ChargeType::class,
            'amount' => 'decimal:2',
            'stock_quantity' => 'integer',
            'is_waivable' => 'boolean',
            'is_active' => 'boolean',
        ];
    }
}
