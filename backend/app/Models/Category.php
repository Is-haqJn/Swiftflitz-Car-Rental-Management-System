<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Category extends Model implements HasMedia
{
    use HasFactory, HasUuids, InteractsWithMedia, LogsActivity;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
        'is_active',
        'security_deposit',
        'young_driver_age_threshold',
        'young_driver_deposit',
        'cancellation_fee',
        'before_pickup_cancellation_fee',
        'after_pickup_cancellation_fee',
        'overdue_fee',
        'early_return_charge',
    ];

    /* Auto-generate slug */
    protected static function booted(): void
    {
        static::creating(static function ($category) {
            if (empty($category->slug)) {
                $category->slug = Str::slug($category->name, '-');
            }
        });

        static::updating(static function ($category) {
            if ($category->isDirty('name')) {
                $category->slug = Str::slug($category->name, '-');
            }
        });
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('category')
            ->setDescriptionForEvent(fn (string $eventName) => "Category {$this->name} was {$eventName}");
    }

    /* Relationships */
    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class);
    }

    /* Media Collections */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('image')
            ->singleFile()                  // Only 1 image per category
            ->useDisk('media')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }

    /* Media Conversions */
    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(500)
            ->sharpen(10)
            ->format('webp')
            ->quality(70)
            ->nonQueued();

        $this->addMediaConversion('medium')
            ->width(1000)
            ->format('webp')
            ->quality(75)
            ->nonQueued();

        $this->addMediaConversion('large')
            ->width(1920)
            ->height(1080)
            ->format('webp')
            ->quality(80);
    }

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'security_deposit' => 'decimal:2',
            'young_driver_age_threshold' => 'integer',
            'young_driver_deposit' => 'decimal:2',
            'cancellation_fee' => 'decimal:2',
            'before_pickup_cancellation_fee' => 'decimal:2',
            'after_pickup_cancellation_fee' => 'decimal:2',
            'overdue_fee' => 'decimal:2',
            'early_return_charge' => 'decimal:2',
        ];
    }
}
