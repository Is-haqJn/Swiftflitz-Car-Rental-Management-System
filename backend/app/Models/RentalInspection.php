<?php

namespace App\Models;

use App\Enums\InspectionType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RentalInspection extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'rental_id',
        'type',
        'inspector_id',
        'fuel_level',
        'mileage',
        'condition_notes',
        'damage_noted',
        'damage_types',
        'damage_severity',
        'damage_description',
        'photos',
        'swap_vehicle_id',
    ];

    /* Relationships */
    public function rental(): BelongsTo
    {
        return $this->belongsTo(Rental::class);
    }

    public function inspector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inspector_id');
    }

    public function swapVehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'swap_vehicle_id');
    }

    /* Casts */
    protected function casts(): array
    {
        return [
            'type' => InspectionType::class,
            'damage_noted' => 'boolean',
            'damage_types' => 'array',
            'photos' => 'array',
        ];
    }
}
