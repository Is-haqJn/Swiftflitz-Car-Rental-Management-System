<?php

namespace App\Models;

use App\Enums\FleetVehicleStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class FleetVehicle extends Model implements HasMedia
{
    use HasFactory, HasUuids, InteractsWithMedia, LogsActivity;

    protected $fillable = [
        'branch_id',
        'default_driver_id',
        'is_personal_vehicle',
        'make',
        'model',
        'year',
        'color',
        'license_plate',
        'seats',
        'features',
        'has_insurance',
        'insurance_expiry_date',
        'has_roadworthy',
        'roadworthy_expiry_date',
        'description',
        'status',
        'is_active',
        'is_featured',
        'notes',
        'transmission',
        'fuel_type',
        'engine',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('fleet_vehicle')
            ->setDescriptionForEvent(fn (string $eventName) => "Fleet vehicle {$this->make} {$this->model} ({$this->license_plate}) was {$eventName}");
    }

    /* Relationships */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function defaultDriver(): BelongsTo
    {
        return $this->belongsTo(Driver::class, 'default_driver_id');
    }

    public function serviceAssignments(): HasMany
    {
        return $this->hasMany(FleetServiceAssignment::class, 'vehicle_id');
    }

    public function airportAssignments(): HasMany
    {
        return $this->hasMany(FleetServiceAssignment::class, 'vehicle_id')
            ->where('service_type', 'airport');
    }

    public function chauffeurAssignment(): HasOne
    {
        return $this->hasOne(FleetServiceAssignment::class, 'vehicle_id')
            ->where('service_type', 'chauffeur');
    }

    /* Media Collections */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('photos')
            ->useDisk('media')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        if ($media && str_starts_with($media->mime_type, 'image/')) {
            $this->addMediaConversion('thumb')
                ->width(400)
                ->height(300)
                ->sharpen(10)
                ->format('webp')
                ->quality(70)
                ->nonQueued();

            $this->addMediaConversion('medium')
                ->width(800)
                ->height(600)
                ->format('webp')
                ->quality(80)
                ->nonQueued();

            $this->addMediaConversion('large')
                ->width(1920)
                ->height(1080)
                ->format('webp')
                ->quality(85)
                ->nonQueued();
        }
    }

    /* Accessors */
    public function getNameAttribute(): string
    {
        return trim(implode(' ', array_filter([$this->year, $this->make, $this->model])));
    }

    public function getInsuranceExpiredAttribute(): bool
    {
        return $this->insurance_expiry_date?->isPast() ?? false;
    }

    public function getInsuranceExpiresSoonAttribute(): bool
    {
        return $this->insurance_expiry_date
            && ! $this->insurance_expired
            && $this->insurance_expiry_date->diffInDays(now()) <= 30;
    }

    public function getRoadworthyExpiredAttribute(): bool
    {
        return $this->roadworthy_expiry_date?->isPast() ?? false;
    }

    public function getRoadworthyExpiresSoonAttribute(): bool
    {
        return $this->roadworthy_expiry_date
            && ! $this->roadworthy_expired
            && $this->roadworthy_expiry_date->diffInDays(now()) <= 30;
    }

    /* Scopes */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', FleetVehicleStatus::Available->value)
            ->where('is_active', true);
    }

    public function scopeForAirport($query)
    {
        return $query->whereHas('airportAssignments', fn ($q) => $q->where('is_active', true));
    }

    /* Casts */
    protected function casts(): array
    {
        return [
            'features' => 'array',
            'has_insurance' => 'boolean',
            'has_roadworthy' => 'boolean',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'is_personal_vehicle' => 'boolean',
            'insurance_expiry_date' => 'date',
            'roadworthy_expiry_date' => 'date',
            'status' => FleetVehicleStatus::class,
        ];
    }
}
