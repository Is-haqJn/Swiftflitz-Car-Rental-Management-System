<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vehicle extends Model
{
    //
    use HasFactory, HasUuids;


    protected $fillable = [
        'id',
        'name',
        'make',
        'model',
        'year',
        'license_plate',
        'vin',
        'color',
        'seats',
        'fuel_type',
        'engine_size',
        'mileage',
        'transmission',
        'features',
        'daily_rate',
        'weekly_rate',
        'monthly_rate',
        'price_visible',
        'status',
        'condition_notes',
        'is_featured',

    ];


    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
