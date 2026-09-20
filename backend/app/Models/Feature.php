<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Feature extends Model
{
    use HasFactory, HasUuids, LogsActivity;

    protected $fillable = [
        'name',
        'icon',
        'is_active',
    ];

    public function vehicles(): BelongsToMany
    {
        return $this->belongsToMany(Vehicle::class, 'vehicle_features');
    }

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('feature')
            ->setDescriptionForEvent(fn (string $eventName) => "Feature {$this->name} was {$eventName}");
    }
}
