<?php

namespace App\Models;

use App\Enums\QuoteRequestStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class QuoteRequest extends Model implements HasMedia
{
    use HasFactory, HasUuids, InteractsWithMedia, SoftDeletes;

    protected $fillable = [
        'vehicle_id',
        'customer_id',
        'branch_id',
        'pickup_location_id',
        'converted_rental_id',
        'reference',
        'name',
        'email',
        'phone',
        'rental_days',
        'expected_pickup_date',
        'pickup_date',
        'return_date',
        'vehicle_preference',
        'message',
        'admin_notes',
        'admin_base_price',
        'requested_addon_ids',
        'status',
        'pending_customer_data',
        'conflict_type',
        'conflicting_customer_id',
        'quote_token',
        'token_expires_at',
        'contacted_at',
        'quoted_at',
        'sent_at',
        'confirmed_at',
    ];

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function pickupLocation(): BelongsTo
    {
        return $this->belongsTo(RentalLocation::class, 'pickup_location_id');
    }

    public function convertedRental(): BelongsTo
    {
        return $this->belongsTo(Rental::class, 'converted_rental_id');
    }

    public function conflictingCustomer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'conflicting_customer_id');
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('pending_documents')
            ->useDisk('media')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
    }

    protected function casts(): array
    {
        return [
            'status' => QuoteRequestStatus::class,
            'admin_base_price' => 'decimal:2',
            'pending_customer_data' => 'array',
            'requested_addon_ids' => 'array',
            'expected_pickup_date' => 'date',
            'pickup_date' => 'date',
            'return_date' => 'date',
            'token_expires_at' => 'datetime',
            'contacted_at' => 'datetime',
            'quoted_at' => 'datetime',
            'sent_at' => 'datetime',
            'confirmed_at' => 'datetime',
        ];
    }
}
