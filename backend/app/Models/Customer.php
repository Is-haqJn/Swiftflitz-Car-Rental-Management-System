<?php

namespace App\Models;

use App\Enums\CustomerIdType;
use App\Enums\CustomerProfileStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Customer extends Model implements HasMedia
{
    use HasFactory, HasUuids, InteractsWithMedia, LogsActivity;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'alt_phone',
        'address',
        'license_number',
        'license_expiry_date',
        'id_type',
        'id_number',
        'id_expiry_date',
        'date_of_birth',
        'emergency_contact',
        'notes',
        'is_blacklisted',
        'blacklist_reason',
        'profile_status',
        'verified_at',
        'verified_by',
        'reupload_token',
        'reupload_token_expires_at',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('customer')
            ->setDescriptionForEvent(fn (string $eventName) => "Customer {$this->name} was {$eventName}");
    }

    /* Relationships */
    public function branches(): BelongsToMany
    {
        return $this->belongsToMany(Branch::class, 'branch_customer');
    }

    public function rentals(): HasMany
    {
        return $this->hasMany(Rental::class);
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'verified_by');
    }

    public function customerDocuments(): HasMany
    {
        return $this->hasMany(CustomerDocument::class);
    }

    /* Media Collections */
    /**
     * Register media collections for customer documents.
     */
    public function registerMediaCollections(): void
    {
        // Driver's license images (front and back)
        $this->addMediaCollection('license')
            ->useDisk('media')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
        //            ->maxFilesize(5 * 1024 * 1024); // 5MB max

        // National ID images (Ghana Card, Passport, Voter ID)
        $this->addMediaCollection('id_document')
            ->useDisk('media')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
        //            ->maxFilesize(5 * 1024 * 1024); // 5MB max

        // Passport images
        $this->addMediaCollection('passport')
            ->useDisk('media')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

        // Additional documents (optional)
        $this->addMediaCollection('documents')
            ->useDisk('media')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
        //            ->maxFilesize(5 * 1024 * 1024); // 5MB max
    }

    /* Media Conversions */
    /**
     * Register media conversions for image optimization.
     */
    public function registerMediaConversions(?Media $media = null): void
    {
        // Only apply conversions to images (not PDFs)
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

            $this->addMediaConversion('large')
                ->width(1200)
                ->height(900)
                ->format('webp')
                ->quality(85)
                ->nonQueued();
        }
    }

    protected function casts(): array
    {
        return [
            'license_expiry_date' => 'date',
            'id_expiry_date' => 'date',
            'date_of_birth' => 'date',
            'emergency_contact' => 'array',
            'is_blacklisted' => 'boolean',
            'id_type' => CustomerIdType::class,
            'profile_status' => CustomerProfileStatus::class,
            'verified_at' => 'datetime',
            'reupload_token_expires_at' => 'datetime',
        ];
    }
}
