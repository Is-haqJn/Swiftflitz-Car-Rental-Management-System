<?php

namespace App\Models;

use App\Enums\AirportAssignmentMode;
use App\Enums\AirportBookingDirection;
use App\Enums\AirportBookingSource;
use App\Enums\AirportBookingStatus;
use App\Enums\AirportPaymentStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class AirportBooking extends Model
{
    use HasFactory, HasUuids, LogsActivity, SoftDeletes;

    protected $fillable = [
        'booking_reference',
        'branch_id',
        'airport_id',
        'direction',
        'package_id',
        'package_assignment_id',
        'vehicle_id',
        'driver_id',
        'airport_customer_id',
        'passenger_name',
        'passenger_phone',
        'passenger_count',
        'flight_number',
        'airline',
        'scheduled_at',
        'terminal_location_id',
        'area_location_id',
        'specific_address',
        'package_rate_snapshot',
        'area_charge_snapshot',
        'vat_rate_snapshot',
        'vat_amount',
        'coupon_discount_snapshot',
        'total_amount',
        'currency',
        'currency_symbol',
        'exchange_rate',
        'payment_status',
        'payment_method',
        'payment_reference',
        'booking_status',
        'booking_source',
        'assignment_mode',
        'cancellation_fee_applied',
        'cancelled_at',
        'cancelled_by',
        'staff_notes',
        'created_by',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('airport_booking')
            ->setDescriptionForEvent(fn (string $eventName) => "Airport booking {$this->booking_reference} was {$eventName}");
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function airport(): BelongsTo
    {
        return $this->belongsTo(Airport::class);
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(AirportPackage::class, 'package_id');
    }

    public function packageAssignment(): BelongsTo
    {
        return $this->belongsTo(AirportPackageAssignment::class, 'package_assignment_id');
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(FleetVehicle::class, 'vehicle_id');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class, 'driver_id');
    }

    public function airportCustomer(): BelongsTo
    {
        return $this->belongsTo(AirportCustomer::class, 'airport_customer_id');
    }

    public function terminalLocation(): BelongsTo
    {
        return $this->belongsTo(AirportLocation::class, 'terminal_location_id');
    }

    public function areaLocation(): BelongsTo
    {
        return $this->belongsTo(AirportLocation::class, 'area_location_id');
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
        return $this->hasMany(AirportBookingRecord::class, 'booking_id')->orderBy('created_at');
    }

    protected function casts(): array
    {
        return [
            'booking_status' => AirportBookingStatus::class,
            'payment_status' => AirportPaymentStatus::class,
            'direction' => AirportBookingDirection::class,
            'booking_source' => AirportBookingSource::class,
            'assignment_mode' => AirportAssignmentMode::class,
            'scheduled_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'package_rate_snapshot' => 'decimal:2',
            'area_charge_snapshot' => 'decimal:2',
            'vat_rate_snapshot' => 'decimal:2',
            'vat_amount' => 'decimal:2',
            'coupon_discount_snapshot' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'cancellation_fee_applied' => 'decimal:2',
        ];
    }
}
