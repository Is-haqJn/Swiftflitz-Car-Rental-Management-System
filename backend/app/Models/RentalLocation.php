<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RentalLocation extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'branch_id',
        'name',
        'pickup_charge',
        'dropoff_charge',
        'is_default',
        'is_pickup',
        'is_dropoff',
        'is_chauffeur',
        'is_active',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    protected function casts(): array
    {
        return [
            'pickup_charge' => 'decimal:2',
            'dropoff_charge' => 'decimal:2',
            'is_default' => 'boolean',
            'is_pickup' => 'boolean',
            'is_dropoff' => 'boolean',
            'is_chauffeur' => 'boolean',
            'is_active' => 'boolean',
        ];
    }
}
