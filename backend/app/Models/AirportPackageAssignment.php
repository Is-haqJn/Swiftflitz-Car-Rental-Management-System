<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class AirportPackageAssignment extends Model
{
    use HasFactory, HasUuids, LogsActivity;

    protected $fillable = [
        'package_id',
        'airport_id',
        'base_price',
        'is_active',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('airport_package_assignment')
            ->setDescriptionForEvent(fn (string $eventName) => "Airport package assignment was {$eventName}");
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(AirportPackage::class, 'package_id');
    }

    public function airport(): BelongsTo
    {
        return $this->belongsTo(Airport::class);
    }

    protected function casts(): array
    {
        return [
            'base_price' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }
}
