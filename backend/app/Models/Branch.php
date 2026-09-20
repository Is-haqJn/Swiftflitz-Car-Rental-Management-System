<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Branch extends Model
{
    use HasFactory, HasUuids, LogsActivity;

    protected $fillable = [
        'name',
        'code',
        'address',
        'phone',
        'email',
        'description',
        'is_active',
        'currency',
        'currency_symbol',
        'exchange_rate',
        'show_converted_price',
        'has_airport_service',
        'airport_id',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('branch')
            ->setDescriptionForEvent(fn (string $eventName) => "Branch {$this->name} was {$eventName}");
    }

    public function managers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'branch_user');
    }

    public function customers(): BelongsToMany
    {
        return $this->belongsToMany(Customer::class, 'branch_customer');
    }

    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class);
    }

    public function rentalLocations(): HasMany
    {
        return $this->hasMany(RentalLocation::class);
    }

    public function airport(): BelongsTo
    {
        return $this->belongsTo(Airport::class);
    }

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'has_airport_service' => 'boolean',
            'exchange_rate' => 'decimal:6',
            'show_converted_price' => 'boolean',
        ];
    }
}
