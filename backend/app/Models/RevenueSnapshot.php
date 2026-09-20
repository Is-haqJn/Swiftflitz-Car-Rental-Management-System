<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RevenueSnapshot extends Model
{
    protected $fillable = [
        'period_type',
        'branch_id',
        'period_key',
        'period_label',
        'revenue',
        'transaction_count',
        'calculated_at',
    ];

    protected function casts(): array
    {
        return [
            'revenue' => 'float',
            'transaction_count' => 'integer',
            'calculated_at' => 'datetime',
        ];
    }
}
