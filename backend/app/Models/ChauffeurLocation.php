<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChauffeurLocation extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'branch_id',
        'name',
        'charge',
        'is_active',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(ChauffeurBooking::class, 'pickup_location_id');
    }

    protected function casts(): array
    {
        return [
            'charge' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }
}
