<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChauffeurPickupLog extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'booking_id',
        'confirmed_at',
        'pickup_location',
        'odometer_reading',
        'customer_present',
        'driver_notes',
        'confirmed_by',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(ChauffeurBooking::class, 'booking_id');
    }

    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    protected function casts(): array
    {
        return [
            'confirmed_at' => 'datetime',
            'customer_present' => 'boolean',
        ];
    }
}
