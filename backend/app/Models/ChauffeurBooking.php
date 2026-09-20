<?php

namespace App\Models;

use App\Enums\ChauffeurBookingStatus;
use App\Enums\ChauffeurPaymentStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class ChauffeurBooking extends Model
{
    use HasFactory, HasUuids, LogsActivity, SoftDeletes;

    protected $fillable = [
        'booking_reference',
        'branch_id',
        'vehicle_id',
        'driver_id',
        'chauffeur_customer_id',
        'pickup_location_id',
        'pickup_time',
        'return_time',
        'actual_pickup_time',
        'actual_return_time',
        'base_price_snapshot',
        'pickup_charge_snapshot',
        'vat_rate_snapshot',
        'vat_amount',
        'coupon_discount_snapshot',
        'overtime_hours',
        'overtime_charge',
        'total_amount',
        'currency',
        'currency_symbol',
        'exchange_rate',
        'payment_status',
        'payment_method',
        'payment_reference',
        'booking_status',
        'cancellation_fee_applied',
        'no_show_fee_applied',
        'cancelled_at',
        'cancelled_by',
        'staff_notes',
        'refund_note',
        'created_by',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('chauffeur_booking')
            ->setDescriptionForEvent(fn (string $eventName) => "Chauffeur booking {$this->booking_reference} was {$eventName}");
    }

    /* Relationships */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(FleetVehicle::class, 'vehicle_id');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class, 'driver_id');
    }

    public function chauffeurCustomer(): BelongsTo
    {
        return $this->belongsTo(ChauffeurCustomer::class, 'chauffeur_customer_id');
    }

    public function pickupLocation(): BelongsTo
    {
        return $this->belongsTo(ChauffeurLocation::class, 'pickup_location_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function bookingRecords(): HasMany
    {
        return $this->hasMany(ChauffeurBookingRecord::class, 'booking_id')->orderBy('created_at');
    }

    public function pickupLog(): HasOne
    {
        return $this->hasOne(ChauffeurPickupLog::class, 'booking_id');
    }

    public function returnLog(): HasOne
    {
        return $this->hasOne(ChauffeurReturnLog::class, 'booking_id');
    }

    /* Casts */
    protected function casts(): array
    {
        return [
            'booking_status' => ChauffeurBookingStatus::class,
            'payment_status' => ChauffeurPaymentStatus::class,
            'pickup_time' => 'datetime',
            'return_time' => 'datetime',
            'actual_pickup_time' => 'datetime',
            'actual_return_time' => 'datetime',
            'cancelled_at' => 'datetime',
            'base_price_snapshot' => 'decimal:2',
            'pickup_charge_snapshot' => 'decimal:2',
            'vat_rate_snapshot' => 'decimal:2',
            'vat_amount' => 'decimal:2',
            'coupon_discount_snapshot' => 'decimal:2',
            'overtime_hours' => 'decimal:2',
            'overtime_charge' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'cancellation_fee_applied' => 'decimal:2',
            'no_show_fee_applied' => 'decimal:2',
        ];
    }
}
