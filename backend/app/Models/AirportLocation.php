<?php

namespace App\Models;

use App\Enums\AirportLocationType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class AirportLocation extends Model
{
    use HasFactory, HasUuids, LogsActivity;

    protected $fillable = [
        'location_type',
        'airport_id',
        'branch_id',
        'name',
        'has_charge',
        'charge_amount',
        'is_active',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('airport_location')
            ->setDescriptionForEvent(fn (string $eventName) => "Airport location {$this->name} was {$eventName}");
    }

    public function airport(): BelongsTo
    {
        return $this->belongsTo(Airport::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    protected function casts(): array
    {
        return [
            'location_type' => AirportLocationType::class,
            'has_charge' => 'boolean',
            'charge_amount' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }
}
