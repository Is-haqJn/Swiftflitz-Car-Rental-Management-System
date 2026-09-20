<?php

namespace App\Models;

use App\Enums\RentalPaymentStatus;
use App\Enums\RentalSource;
use App\Enums\RentalStatus;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Rental extends Model implements HasMedia
{
    use HasFactory, HasUuids, InteractsWithMedia, LogsActivity, SoftDeletes;

    protected $fillable = [
        'reference',
        'branch_id',
        'vehicle_id',
        'customer_id',
        'manager_id',
        'confirmed_by',
        'source',
        'status',
        'payment_status',
        'pickup_date',
        'pickup_time',
        'return_date',
        'return_time',
        'actual_pickup_date',
        'actual_return_date',
        'pickup_location',
        'dropoff_location',
        'pickup_location_id',
        'dropoff_location_id',
        'rental_days',
        'extension_days',
        'early_pickup_days',
        'original_return_date',
        'daily_rate',
        'base_cost',
        'extras_cost',
        'additional_charges',
        'location_charge',
        'subtotal',
        'vat_amount',
        'total_cost',
        'rule_discount_amount',
        'coupon_discount_amount',
        'manual_discount_amount',
        'manual_discount_reason',
        'manual_discount_by',
        'total_discount_amount',
        'applied_charges_breakdown',
        'coupon_applied',
        'amount_paid',
        'security_deposit_amount',
        'security_deposit_status',
        'skip_security_deposit',
        'young_driver_override',
        'deposit_collected_at',
        'deposit_collected_by',
        'deposit_paid',
        'deposit_refunded',
        'deposit_applied_to_balance',
        'deposit_refunded_at',
        'deposit_waived',
        'deposit_waived_by',
        'deposit_waiver_reason',
        'overdue_fee',
        'late_pickup_fee',
        'vehicle_switch_fee',
        'is_overdue',
        'overdue_minutes',
        'overdue_waived',
        'overdue_waiver_reason',
        'overdue_waived_by',
        'is_early_return',
        'actual_rental_days',
        'early_return_refund',
        'early_return_charge',
        'early_return_charge_waived',
        'early_return_charge_waived_by',
        'early_return_charge_waiver_reason',
        'early_return_reason',
        'settlement_status',
        'damage_settlement_status',
        'has_damage',
        'estimated_repair_cost',
        'actual_repair_cost',
        'damage_balance_due',
        'customer_notes',
        'admin_notes',
        'cancellation_reason',
        'cancellation_fee',
        'days_used_cost',
        'refund_amount',
        'refund_status',
        'cancellation_amount_owed',
        'cancellation_debt_waived',
        'cancellation_deposit_deduction',
        'cancellation_debt_paid',
        'cancelled_by_type',
        'cancelled_by',
        'cancelled_at',
        'currency',
        'currency_symbol',
        'exchange_rate',
        'total_cost_global',
    ];

    /* Accessors */
    /** Combined pickup date + time as Carbon datetime. */
    public function getScheduledPickupDateAttribute(): Carbon
    {
        return Carbon::parse($this->pickup_date->format('Y-m-d') . ' ' . ($this->pickup_time ?? '09:00'));
    }

    /** Combined return date + time as Carbon datetime. */
    public function getScheduledReturnDateAttribute(): Carbon
    {
        return Carbon::parse($this->return_date->format('Y-m-d') . ' ' . ($this->return_time ?? '17:00'));
    }

    /* Activity Logging */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('rental')
            ->setDescriptionForEvent(fn (string $eventName) => "Rental {$this->reference} was {$eventName}");
    }

    /* Relationships */
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

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    public function manualDiscountBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manual_discount_by');
    }

    public function depositWaivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deposit_waived_by');
    }

    public function overdueWaivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'overdue_waived_by');
    }

    public function earlyReturnChargeWaivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'early_return_charge_waived_by');
    }

    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function pickupLocation(): BelongsTo
    {
        return $this->belongsTo(RentalLocation::class, 'pickup_location_id');
    }

    public function dropoffLocation(): BelongsTo
    {
        return $this->belongsTo(RentalLocation::class, 'dropoff_location_id');
    }

    public function inspections(): HasMany
    {
        return $this->hasMany(RentalInspection::class);
    }

    public function couponUsages(): HasMany
    {
        return $this->hasMany(CouponUsage::class);
    }

    public function discountUsages(): HasMany
    {
        return $this->hasMany(RentalDiscountUsage::class);
    }

    /* Media */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('pickup_video')
            ->acceptsMimeTypes(['video/mp4', 'video/quicktime', 'video/webm']);

        $this->addMediaCollection('return_video')
            ->acceptsMimeTypes(['video/mp4', 'video/quicktime', 'video/webm']);
    }

    /* Casts */
    protected function casts(): array
    {
        return [
            'status' => RentalStatus::class,
            'payment_status' => RentalPaymentStatus::class,
            'source' => RentalSource::class,
            'pickup_date' => 'date',
            'return_date' => 'date',
            'original_return_date' => 'date',
            'extension_days' => 'integer',
            'early_pickup_days' => 'integer',
            'actual_pickup_date' => 'datetime',
            'actual_return_date' => 'datetime',
            'deposit_collected_at' => 'datetime',
            'deposit_refunded_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'daily_rate' => 'decimal:2',
            'base_cost' => 'decimal:2',
            'extras_cost' => 'decimal:2',
            'additional_charges' => 'decimal:2',
            'location_charge' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'vat_amount' => 'decimal:2',
            'total_cost' => 'decimal:2',
            'rule_discount_amount' => 'decimal:2',
            'coupon_discount_amount' => 'decimal:2',
            'manual_discount_amount' => 'decimal:2',
            'total_discount_amount' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'security_deposit_amount' => 'decimal:2',
            'deposit_paid' => 'decimal:2',
            'deposit_refunded' => 'decimal:2',
            'overdue_fee' => 'decimal:2',
            'late_pickup_fee' => 'decimal:2',
            'vehicle_switch_fee' => 'decimal:2',
            'early_return_refund' => 'decimal:2',
            'early_return_charge' => 'decimal:2',
            'early_return_charge_waived' => 'boolean',
            'estimated_repair_cost' => 'decimal:2',
            'actual_repair_cost' => 'decimal:2',
            'damage_balance_due' => 'decimal:2',
            'cancellation_fee' => 'decimal:2',
            'days_used_cost' => 'decimal:2',
            'refund_amount' => 'decimal:2',
            'cancellation_amount_owed' => 'decimal:2',
            'cancellation_debt_waived' => 'boolean',
            'cancellation_deposit_deduction' => 'decimal:2',
            'applied_charges_breakdown' => 'array',
            'coupon_applied' => 'array',
            'skip_security_deposit' => 'boolean',
            'deposit_waived' => 'boolean',
            'is_overdue' => 'boolean',
            'overdue_waived' => 'boolean',
            'is_early_return' => 'boolean',
            'has_damage' => 'boolean',
            'exchange_rate' => 'decimal:6',
            'total_cost_global' => 'decimal:2',
        ];
    }
}
