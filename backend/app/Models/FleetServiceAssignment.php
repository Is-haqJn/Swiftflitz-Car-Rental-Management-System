<?php

namespace App\Models;

use App\Enums\FleetServiceType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class FleetServiceAssignment extends Model
{
    use HasFactory, HasUuids, LogsActivity;

    protected $table = 'fleet_vehicle_services';

    protected $fillable = [
        'vehicle_id',
        'service_type',
        'package_id',
        'category_id',
        'base_price',
        'is_active',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('fleet_service_assignment')
            ->setDescriptionForEvent(fn (string $eventName) => "Fleet service assignment was {$eventName}");
    }

    /* Relationships */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(FleetVehicle::class, 'vehicle_id');
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(AirportPackage::class, 'package_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    /* Casts */
    protected function casts(): array
    {
        return [
            'service_type' => FleetServiceType::class,
            'base_price' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }
}
