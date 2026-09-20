<?php

namespace App\Models;

use App\Enums\ExportStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExportRecord extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'type',
        'format',
        'status',
        'filename',
        'file_path',
        'file_size',
        'error_message',
        'filters',
        'expires_at',
    ];

    /* Relationships */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /* Helpers */
    public function isReady(): bool
    {
        return $this->status === ExportStatus::Ready;
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    /* Casts */
    protected function casts(): array
    {
        return [
            'status' => ExportStatus::class,
            'filters' => 'array',
            'expires_at' => 'datetime',
        ];
    }
}
