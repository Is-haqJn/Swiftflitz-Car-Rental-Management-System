<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class AirportCustomer extends Model
{
    use HasFactory, HasUuids, LogsActivity;

    protected $fillable = [
        'full_name',
        'email',
        'phone',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('airport_customer')
            ->setDescriptionForEvent(fn (string $eventName) => "Airport customer {$this->full_name} was {$eventName}");
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(AirportBooking::class, 'airport_customer_id');
    }
}
