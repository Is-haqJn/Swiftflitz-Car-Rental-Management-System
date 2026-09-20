<?php

namespace App\Models;

use App\Enums\VehicleFuelType;
use App\Enums\VehicleStatus;
use App\Enums\VehicleTransmission;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Vehicle extends Model implements HasMedia
{
    use HasFactory, HasUuids, InteractsWithMedia, LogsActivity;

    protected $fillable = [
        'category_id',
        'branch_id',
        'name',
        'make',
        'model',
        'year',
        'roadworthy_expiry_date',
        'insurance_expiry_date',
        'license_plate',
        'vin',
        'color',
        'seats',
        'fuel_type',
        'engine_size',
        'odometer',
        'has_insurance',
        'has_roadworthy',
        'transmission',
        'features',
        'daily_rate',
        'security_deposit',
        'young_driver_age_threshold',
        'young_driver_deposit',
        'price_visible',
        'status',
        'description',
        'condition_notes',
        'is_featured',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('vehicle')
            ->setDescriptionForEvent(fn (string $eventName) => "Vehicle {$this->name} ({$this->license_plate}) was {$eventName}");
    }

    /* Relationships */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function rentals(): HasMany
    {
        return $this->hasMany(Rental::class);
    }

    /* Media Collections */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('images')
            ->useDisk('media')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }

    /* Media Conversions */
    public function registerMediaConversions(?Media $media = null): void
    {
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
            ->quality(75);
        // ->nonQueued();

        $this->addMediaConversion('large')
            ->width(1920)
            ->height(1080)
            ->format('webp')
            ->quality(80);
        // ->nonQueued();
    }

    protected function casts(): array
    {
        return [
            'features' => 'array',
            'roadworthy_expiry_date' => 'date',
            'insurance_expiry_date' => 'date',
            'daily_rate' => 'decimal:2',
            'security_deposit' => 'decimal:2',
            'young_driver_age_threshold' => 'integer',
            'young_driver_deposit' => 'decimal:2',
            'fuel_type' => VehicleFuelType::class,
            'transmission' => VehicleTransmission::class,
            'status' => VehicleStatus::class,
            'has_insurance' => 'boolean',
            'has_roadworthy' => 'boolean',
            'price_visible' => 'boolean',
            'is_featured' => 'boolean',
        ];
    }
}
