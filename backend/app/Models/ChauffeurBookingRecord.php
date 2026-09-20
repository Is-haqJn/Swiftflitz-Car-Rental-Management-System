<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChauffeurBookingRecord extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'booking_id',
        'action',
        'performed_by',
        'notes',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(ChauffeurBooking::class, 'booking_id');
    }

    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}
