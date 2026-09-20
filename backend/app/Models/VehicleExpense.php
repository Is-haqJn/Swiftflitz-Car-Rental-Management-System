<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class VehicleExpense extends Model implements HasMedia
{
    use InteractsWithMedia, LogsActivity;

    protected $fillable = [
        'vehicle_id',
        'recorded_by',
        'expense_type',
        'description',
        'amount',
        'currency',
        'currency_symbol',
        'exchange_rate',
        'expense_date',
        'reference',
        'notes',
    ];

    /**
     * Human-readable expense type labels.
     *
     * @return array<string, string>
     */
    public static function expenseTypes(): array
    {
        return [
            'fuel' => 'Fuel',
            'maintenance' => 'Maintenance',
            'insurance' => 'Insurance',
            'repair' => 'Repair',
            'cleaning' => 'Cleaning',
            'other' => 'Other',
        ];
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('receipts')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'application/pdf'])
            ->onlyKeepLatest(3);
    }

    public function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'exchange_rate' => 'decimal:6',
            'expense_date' => 'date',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('expense')
            ->setDescriptionForEvent(fn (string $eventName) => "Vehicle expense was {$eventName}");
    }

    /** @return BelongsTo<Vehicle, $this> */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    /** @return BelongsTo<User, $this> */
    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    /**
     * Scope to a date range.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<static>  $query
     */
    public function scopeDateRange($query, ?string $from, ?string $to): void
    {
        if ($from) {
            $query->where('expense_date', '>=', Carbon::parse($from)->startOfDay());
        }
        if ($to) {
            $query->where('expense_date', '<=', Carbon::parse($to)->endOfDay());
        }
    }
}
