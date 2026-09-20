<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChauffeurReturnLog extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'booking_id',
        'returned_at',
        'odometer_reading',
        'condition_notes',
        'overtime_minutes',
        'logged_by',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(ChauffeurBooking::class, 'booking_id');
    }

    public function loggedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'logged_by');
    }

    protected function casts(): array
    {
        return [
            'returned_at' => 'datetime',
        ];
    }
}
