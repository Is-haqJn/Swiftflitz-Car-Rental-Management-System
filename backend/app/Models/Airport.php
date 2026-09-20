<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Airport extends Model
{
    use HasFactory, HasUuids, LogsActivity;

    protected $fillable = [
        'name',
        'city',
        'country',
        'is_active',
        'is_default',
        'vat_rate',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('airport')
            ->setDescriptionForEvent(fn (string $eventName) => "Airport {$this->name} was {$eventName}");
    }

    public function locations(): HasMany
    {
        return $this->hasMany(AirportLocation::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(AirportPackageAssignment::class);
    }

    public function packages(): BelongsToMany
    {
        return $this->belongsToMany(AirportPackage::class, 'airport_package_assignments')
            ->withPivot('base_price', 'is_active')
            ->withTimestamps();
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function serviceableBranch(): HasOne
    {
        return $this->hasOne(Branch::class)->where('has_airport_service', true)->where('is_active', true);
    }

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'vat_rate' => 'decimal:2',
        ];
    }
}
