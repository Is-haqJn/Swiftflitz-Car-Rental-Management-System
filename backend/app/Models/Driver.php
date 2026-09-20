<?php

namespace App\Models;

use App\Enums\DriverIdType;
use App\Enums\DriverStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Driver extends Model implements HasMedia
{
    use HasFactory, HasUuids, InteractsWithMedia, LogsActivity, SoftDeletes;

    protected $fillable = [
        'first_name',
        'last_name',
        'phone_number',
        'email',
        'date_of_birth',
        'address',
        'city',
        'id_type',
        'id_number',
        'id_expiry_date',
        'license_number',
        'license_class',
        'license_expiry_date',
        'license_verified',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relation',
        'available_for_chauffeur',
        'available_for_airport',
        'status',
        'notes',
        'created_by',
        'is_active',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('driver')
            ->setDescriptionForEvent(fn (string $eventName) => "Driver {$this->first_name} {$this->last_name} was {$eventName}");
    }

    /* Relationships */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /* Media Collections */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('driver_photo')
            ->singleFile()
            ->useDisk('media')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);

        $this->addMediaCollection('id_document')
            ->singleFile()
            ->useDisk('media')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

        $this->addMediaCollection('license_photo')
            ->singleFile()
            ->useDisk('media')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
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

    /* Accessors */
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function getLicenseExpiredAttribute(): bool
    {
        return $this->license_expiry_date->isPast();
    }

    public function getLicenseExpiresSoonAttribute(): bool
    {
        return ! $this->license_expired
            && $this->license_expiry_date->diffInDays(now()) <= 30;
    }

    public function getIdExpiredAttribute(): bool
    {
        return $this->id_expiry_date?->isPast() ?? false;
    }

    public function getIdExpiresSoonAttribute(): bool
    {
        return $this->id_expiry_date
            && ! $this->id_expired
            && $this->id_expiry_date->diffInDays(now()) <= 30;
    }

    public function getIsAvailableAttribute(): bool
    {
        return $this->status === DriverStatus::Available && $this->is_active;
    }

    /* Scopes */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', 'available')
            ->where('is_active', true);
    }

    public function scopeForChauffeur($query)
    {
        return $query->where('available_for_chauffeur', true);
    }

    public function scopeForAirport($query)
    {
        return $query->where('available_for_airport', true);
    }

    /* Casts */
    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'license_expiry_date' => 'date',
            'id_expiry_date' => 'date',
            'license_verified' => 'boolean',
            'available_for_chauffeur' => 'boolean',
            'available_for_airport' => 'boolean',
            'is_active' => 'boolean',
            'status' => DriverStatus::class,
            'id_type' => DriverIdType::class,
        ];
    }
}
