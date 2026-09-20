<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class SmsTemplate extends Model
{
    /** @use HasFactory<\Database\Factories\SmsTemplateFactory> */
    use HasFactory, LogsActivity;

    protected $fillable = [
        'key',
        'name',
        'description',
        'body',
        'default_body',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['key', 'name', 'body'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('sms_template')
            ->setDescriptionForEvent(fn (string $eventName) => "SMS template {$this->name} was {$eventName}");
    }

    /**
     * Whether this template has been customised from its default.
     */
    public function isCustomised(): bool
    {
        return $this->body !== $this->default_body;
    }

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}
