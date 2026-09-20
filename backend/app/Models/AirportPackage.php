<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class AirportPackage extends Model implements HasMedia
{
    use HasFactory, HasUuids, InteractsWithMedia, LogsActivity;

    protected $fillable = [
        'name',
        'description',
        'features',
        'is_available_for_pickup',
        'is_available_for_dropoff',
        'auto_assign_vehicle',
        'is_active',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('airport_package')
            ->setDescriptionForEvent(fn (string $eventName) => "Airport package {$this->name} was {$eventName}");
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(AirportPackageAssignment::class, 'package_id');
    }

    /* Media Collections */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('package_photo')
            ->singleFile()
            ->useDisk('media')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }

    /* Media Conversions */
    public function registerMediaConversions(?Media $media = null): void
    {
        if ($media && str_starts_with($media->mime_type, 'image/')) {
            $this->addMediaConversion('thumb')
                ->width(300)
                ->height(200)
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
        }
    }

    protected function casts(): array
    {
        return [
            'features' => 'array',
            'is_available_for_pickup' => 'boolean',
            'is_available_for_dropoff' => 'boolean',
            'auto_assign_vehicle' => 'boolean',
            'is_active' => 'boolean',
        ];
    }
}
